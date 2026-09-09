import { randomUUID } from "node:crypto";
import { clerkClient } from "@clerk/express";
import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, barberAppointments, barberClients, barberServices, barberShops } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
type BarberProfile = {
  shopName: string;
  ownerName: string;
  phone: string;
  openingTime: string;
  closingTime: string;
};
type BarberService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
};
type BarberClient = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};
type BarberAppointment = {
  id: string;
  clientId?: string | null;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  amount: number;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  paymentMethod?: "pix" | "cash" | "credit_card" | "debit_card";
  completedAt?: string | null;
};
type ShopData = { profile: BarberProfile; services: BarberService[]; clients: BarberClient[]; appointments: BarberAppointment[] };
const paymentMethods = new Set(["pix", "cash", "credit_card", "debit_card"]);
const appointmentStatuses = new Set(["scheduled", "completed", "cancelled"]);

const defaultServices: BarberService[] = [
  { id: "service-cut", name: "Corte", duration: 30, price: 35, active: true },
  { id: "service-beard", name: "Barba", duration: 30, price: 25, active: true },
  { id: "service-combo", name: "Corte + Barba", duration: 60, price: 50, active: true },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProfile(value: unknown): value is BarberProfile {
  if (!isRecord(value)) return false;
  return ["shopName", "ownerName", "phone", "openingTime", "closingTime"].every((key) => isText(value[key]));
}

function isService(value: unknown): value is BarberService {
  if (!isRecord(value)) return false;
  return isText(value.id) && isText(value.name) && Number.isInteger(value.duration) && Number.isInteger(value.price) && typeof value.active === "boolean";
}

function isAppointment(value: unknown): value is BarberAppointment {
  if (!isRecord(value)) return false;
  return (
    isText(value.id) &&
    (value.clientId === undefined || value.clientId === null || isText(value.clientId)) &&
    isText(value.clientName) &&
    typeof value.clientPhone === "string" &&
    isText(value.serviceId) &&
    Number.isInteger(value.amount) &&
    isText(value.date) &&
    isText(value.time) &&
    typeof value.status === "string" &&
    appointmentStatuses.has(value.status) &&
    (value.paymentMethod === undefined || (typeof value.paymentMethod === "string" && paymentMethods.has(value.paymentMethod)))
  );
}

function serializeAppointment(row: typeof barberAppointments.$inferSelect): BarberAppointment {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    serviceId: row.serviceId,
    amount: row.amount,
    date: row.date,
    time: row.time,
    status: row.status as BarberAppointment["status"],
    paymentMethod: row.paymentMethod as BarberAppointment["paymentMethod"],
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

async function findShop(clerkUserId: string) {
  return db.select().from(barberShops).where(eq(barberShops.clerkUserId, clerkUserId)).limit(1).then((rows) => rows[0]);
}

async function buildShopData(clerkUserId: string): Promise<ShopData | null> {
  const shop = await findShop(clerkUserId);
  if (!shop) return null;
  const [services, clients, appointments] = await Promise.all([
    db.select().from(barberServices).where(eq(barberServices.shopId, shop.id)),
    db.select().from(barberClients).where(eq(barberClients.shopId, shop.id)).orderBy(asc(barberClients.name)),
    db.select().from(barberAppointments).where(eq(barberAppointments.shopId, shop.id)).orderBy(asc(barberAppointments.date), asc(barberAppointments.time)),
  ]);

  return {
    profile: {
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      phone: shop.phone,
      openingTime: shop.openingTime,
      closingTime: shop.closingTime,
    },
    services,
    clients: clients.map((client) => ({ ...client, createdAt: client.createdAt.toISOString() })),
    appointments: appointments.map(serializeAppointment),
  };
}

router.get("/shop", requireAuth, async (_req, res) => {
  const data = await buildShopData(res.locals.clerkUserId);
  if (!data) {
    res.status(404).json({ error: "Barbershop not configured" });
    return;
  }
  res.json(data);
});

router.put("/shop", requireAuth, async (req, res) => {
  const body = req.body as { profile?: unknown; services?: unknown; clients?: unknown; appointments?: unknown };
  const profile = body.profile;
  if (!isProfile(profile)) {
    res.status(400).json({ error: "Invalid barbershop profile" });
    return;
  }

  const clerkUserId = res.locals.clerkUserId as string;
  const currentShop = await findShop(clerkUserId);
  const shopId = currentShop?.id ?? randomUUID();

  await db.transaction(async (tx) => {
    if (currentShop) {
      await tx
        .update(barberShops)
        .set({
          shopName: profile.shopName.trim(),
          ownerName: profile.ownerName.trim(),
          phone: profile.phone.trim(),
          openingTime: profile.openingTime.trim(),
          closingTime: profile.closingTime.trim(),
          updatedAt: new Date(),
        })
        .where(eq(barberShops.id, currentShop.id));
      return;
    }

    await tx.insert(barberShops).values({
      id: shopId,
      clerkUserId,
      shopName: profile.shopName.trim(),
      ownerName: profile.ownerName.trim(),
      phone: profile.phone.trim(),
      openingTime: profile.openingTime.trim(),
      closingTime: profile.closingTime.trim(),
    });

    const services = Array.isArray(body.services) && body.services.every(isService) ? body.services : defaultServices;
    if (services.length > 0) {
      await tx.insert(barberServices).values(services.map((service) => ({ ...service, shopId })));
    }

    const clients = Array.isArray(body.clients)
      ? body.clients.filter((client): client is BarberClient =>
          isRecord(client) && isText(client.id) && isText(client.name) && typeof client.phone === "string" && isText(client.createdAt))
      : [];
    if (clients.length > 0) {
      await tx.insert(barberClients).values(clients.map((client) => ({
        id: client.id,
        shopId,
        name: client.name.trim(),
        phone: client.phone.trim(),
        createdAt: new Date(client.createdAt),
      })));
    }

    const appointments = Array.isArray(body.appointments) ? body.appointments.filter(isAppointment) : [];
    if (appointments.length > 0) {
      await tx.insert(barberAppointments).values(
        appointments.map((appointment) => ({
          id: appointment.id,
          shopId,
          clientId: appointment.clientId ?? null,
          clientName: appointment.clientName,
          clientPhone: appointment.clientPhone,
          serviceId: appointment.serviceId,
          amount: appointment.amount,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentMethod: appointment.paymentMethod ?? null,
          completedAt: appointment.completedAt ? new Date(appointment.completedAt) : null,
        })),
      );
    }
  });

  const data = await buildShopData(clerkUserId);
  res.json(data);
});

router.get("/appointments", requireAuth, async (_req, res) => {
  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.json([]);
    return;
  }
  const appointments = await db
    .select()
    .from(barberAppointments)
    .where(eq(barberAppointments.shopId, shop.id))
    .orderBy(asc(barberAppointments.date), asc(barberAppointments.time));
  res.json(appointments.map(serializeAppointment));
});

router.post("/appointments", requireAuth, async (req, res) => {
  const body = req.body as { clientId?: unknown; clientName?: unknown; clientPhone?: unknown; serviceId?: unknown; amount?: unknown; date?: unknown; time?: unknown };
  const { clientId, clientName, clientPhone, serviceId, amount, date, time } = body;
  if (
    (clientId !== undefined && !isText(clientId)) ||
    !isText(clientName) ||
    typeof clientPhone !== "string" ||
    !isText(serviceId) ||
    !Number.isInteger(amount) ||
    !isText(date) ||
    !isText(time)
  ) {
    res.status(400).json({ error: "Invalid appointment data" });
    return;
  }
  const normalizedAmount = amount as number;

  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.status(400).json({ error: "Configure the barbershop before creating appointments" });
    return;
  }

  const selectedClient = clientId
    ? await db.select().from(barberClients).where(and(eq(barberClients.id, clientId), eq(barberClients.shopId, shop.id))).limit(1).then((rows) => rows[0])
    : undefined;
  if (clientId && !selectedClient) {
    res.status(400).json({ error: "Client not found" });
    return;
  }

  const service = await db
    .select()
    .from(barberServices)
    .where(and(eq(barberServices.id, serviceId), eq(barberServices.shopId, shop.id)))
    .limit(1);
  if (!service[0]) {
    res.status(400).json({ error: "Service not found" });
    return;
  }

  const conflict = await db
    .select({ id: barberAppointments.id })
    .from(barberAppointments)
    .where(and(eq(barberAppointments.shopId, shop.id), eq(barberAppointments.date, date), eq(barberAppointments.time, time), eq(barberAppointments.status, "scheduled")))
    .limit(1);
  if (conflict[0]) {
    res.status(409).json({ error: "This time is already booked" });
    return;
  }

  const id = randomUUID();
  const inserted = await db
    .insert(barberAppointments)
    .values({
      id,
      shopId: shop.id,
      clientId: selectedClient?.id ?? null,
      clientName: selectedClient?.name ?? clientName.trim(),
      clientPhone: selectedClient?.phone ?? clientPhone.trim(),
      serviceId,
      amount: normalizedAmount,
      date: date.trim(),
      time: time.trim(),
      status: "scheduled",
    })
    .returning();
  res.status(201).json(serializeAppointment(inserted[0]));
});

router.post("/appointments/:id/complete", requireAuth, async (req, res) => {
  const body = req.body as { paymentMethod?: unknown };
  const paymentMethod = body.paymentMethod;
  if (typeof paymentMethod !== "string" || !paymentMethods.has(paymentMethod)) {
    res.status(400).json({ error: "Invalid payment method" });
    return;
  }

  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.status(404).json({ error: "Barbershop not found" });
    return;
  }
  const appointmentId = String(req.params.id);
  const updated = await db
    .update(barberAppointments)
    .set({ status: "completed", paymentMethod, completedAt: new Date() })
    .where(and(eq(barberAppointments.id, appointmentId), eq(barberAppointments.shopId, shop.id)))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(serializeAppointment(updated[0]));
});

router.patch("/appointments/:id", requireAuth, async (req, res) => {
  const body = req.body as {
    clientId?: unknown;
    clientName?: unknown;
    clientPhone?: unknown;
    serviceId?: unknown;
    amount?: unknown;
    date?: unknown;
    time?: unknown;
    paymentMethod?: unknown;
  };
  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.status(404).json({ error: "Barbershop not found" });
    return;
  }

  const appointmentId = String(req.params.id);
  const current = await db
    .select()
    .from(barberAppointments)
    .where(and(eq(barberAppointments.id, appointmentId), eq(barberAppointments.shopId, shop.id)))
    .limit(1);
  if (!current[0]) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const clientId = Object.prototype.hasOwnProperty.call(body, "clientId")
    ? body.clientId
    : current[0].clientId;
  if (clientId !== null && clientId !== undefined && !isText(clientId)) {
    res.status(400).json({ error: "Invalid client" });
    return;
  }
  const selectedClient = clientId
    ? await db.select().from(barberClients).where(and(eq(barberClients.id, clientId), eq(barberClients.shopId, shop.id))).limit(1).then((rows) => rows[0])
    : undefined;
  if (clientId && !selectedClient) {
    res.status(400).json({ error: "Client not found" });
    return;
  }
  const clientName = selectedClient?.name ?? body.clientName ?? current[0].clientName;
  const clientPhone = selectedClient?.phone ?? body.clientPhone ?? current[0].clientPhone;
  const serviceId = body.serviceId ?? current[0].serviceId;
  const amount = body.amount ?? current[0].amount;
  const date = body.date ?? current[0].date;
  const time = body.time ?? current[0].time;
  const paymentMethod = body.paymentMethod ?? current[0].paymentMethod;
  if (
    !isText(clientName) ||
    typeof clientPhone !== "string" ||
    !isText(serviceId) ||
    !Number.isInteger(amount) ||
    !isText(date) ||
    !isText(time) ||
    (paymentMethod !== null && (typeof paymentMethod !== "string" || !paymentMethods.has(paymentMethod)))
  ) {
    res.status(400).json({ error: "Invalid appointment data" });
    return;
  }

  const service = await db
    .select({ id: barberServices.id })
    .from(barberServices)
    .where(and(eq(barberServices.id, serviceId), eq(barberServices.shopId, shop.id)))
    .limit(1);
  if (!service[0]) {
    res.status(400).json({ error: "Service not found" });
    return;
  }

  const conflict = await db
    .select({ id: barberAppointments.id })
    .from(barberAppointments)
    .where(
      and(
        eq(barberAppointments.shopId, shop.id),
        eq(barberAppointments.date, date),
        eq(barberAppointments.time, time),
        eq(barberAppointments.status, "scheduled"),
        ne(barberAppointments.id, appointmentId),
      ),
    )
    .limit(1);
  if (conflict[0]) {
    res.status(409).json({ error: "This time is already booked" });
    return;
  }

  const updated = await db
    .update(barberAppointments)
    .set({
      clientId: selectedClient?.id ?? null,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId,
      amount: amount as number,
      date: date.trim(),
      time: time.trim(),
      paymentMethod,
    })
    .where(and(eq(barberAppointments.id, appointmentId), eq(barberAppointments.shopId, shop.id)))
    .returning();
  res.json(serializeAppointment(updated[0]));
});

router.post("/services", requireAuth, async (req, res) => {
  const body = req.body as { name?: unknown; duration?: unknown; price?: unknown };
  if (!isText(body.name) || !Number.isInteger(body.duration) || !Number.isInteger(body.price) || (body.duration as number) <= 0 || (body.price as number) < 0) {
    res.status(400).json({ error: "Invalid service data" });
    return;
  }

  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.status(404).json({ error: "Barbershop not found" });
    return;
  }

  const inserted = await db
    .insert(barberServices)
    .values({
      id: randomUUID(),
      shopId: shop.id,
      name: body.name.trim(),
      duration: body.duration as number,
      price: body.price as number,
      active: true,
    })
    .returning();
  res.status(201).json(inserted[0]);
});

router.post("/clients", requireAuth, async (req, res) => {
  const body = req.body as { name?: unknown; phone?: unknown };
  if (!isText(body.name) || typeof body.phone !== "string") {
    res.status(400).json({ error: "Invalid client data" });
    return;
  }
  const clientName = body.name.trim();
  const clientPhone = body.phone.trim();

  const shop = await findShop(res.locals.clerkUserId);
  if (!shop) {
    res.status(404).json({ error: "Barbershop not found" });
    return;
  }

  const inserted = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(barberClients)
      .values({
        id: randomUUID(),
        shopId: shop.id,
        name: clientName,
        phone: clientPhone,
      })
      .returning();
    const client = rows[0];
    const unlinkedAppointments = await tx
      .select()
      .from(barberAppointments)
      .where(and(eq(barberAppointments.shopId, shop.id), isNull(barberAppointments.clientId)));
    const normalizedPhone = client.phone.replace(/\D/g, "");
    const normalizedName = client.name.trim().toLocaleLowerCase("pt-BR");
    const matchingIds = unlinkedAppointments
      .filter((appointment) =>
        normalizedPhone
          ? appointment.clientPhone.replace(/\D/g, "") === normalizedPhone
          : appointment.clientName.trim().toLocaleLowerCase("pt-BR") === normalizedName)
      .map((appointment) => appointment.id);
    if (matchingIds.length > 0) {
      await tx.update(barberAppointments).set({ clientId: client.id }).where(inArray(barberAppointments.id, matchingIds));
    }
    return rows;
  });
  res.status(201).json({ ...inserted[0], createdAt: inserted[0].createdAt.toISOString() });
});

router.delete("/account", requireAuth, async (req, res) => {
  const body = req.body as { confirmation?: unknown };
  if (body.confirmation !== "EXCLUIR") {
    res.status(400).json({ error: "Deletion confirmation required" });
    return;
  }

  const clerkUserId = res.locals.clerkUserId as string;
  const shop = await findShop(clerkUserId);

  await db.transaction(async (tx) => {
    if (shop) {
      await tx.delete(barberAppointments).where(eq(barberAppointments.shopId, shop.id));
      await tx.delete(barberClients).where(eq(barberClients.shopId, shop.id));
      await tx.delete(barberServices).where(eq(barberServices.shopId, shop.id));
      await tx.delete(barberShops).where(eq(barberShops.id, shop.id));
    }
    await clerkClient.users.deleteUser(clerkUserId);
  });

  res.json({ success: true });
});

export default router;