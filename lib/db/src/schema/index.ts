import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const barberShops = pgTable(
  "barber_shops",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    shopName: text("shop_name").notNull(),
    ownerName: text("owner_name").notNull(),
    phone: text("phone").notNull().default(""),
    openingTime: text("opening_time").notNull(),
    closingTime: text("closing_time").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clerkUserIdUnique: uniqueIndex("barber_shops_clerk_user_id_unique").on(table.clerkUserId),
  }),
);

export const barberServices = pgTable("barber_services", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  active: boolean("active").notNull().default(true),
});

export const barberClients = pgTable("barber_clients", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const barberAppointments = pgTable("barber_appointments", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").notNull(),
  clientId: text("client_id"),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull().default(""),
  serviceId: text("service_id").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("scheduled"),
  paymentMethod: text("payment_method"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BarberShop = typeof barberShops.$inferSelect;
export type BarberService = typeof barberServices.$inferSelect;
export type BarberClient = typeof barberClients.$inferSelect;
export type BarberAppointment = typeof barberAppointments.$inferSelect;