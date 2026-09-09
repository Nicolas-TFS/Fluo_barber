import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  completeBarberAppointment,
  createBarberAppointment,
  createBarberClient,
  createBarberService,
  deleteBarberAccount,
  getBarberShop,
  saveBarberShop,
  setAuthTokenGetter,
  updateBarberAppointment,
} from '@workspace/api-client-react';

export type ShopProfile = {
  shopName: string;
  ownerName: string;
  phone: string;
  openingTime: string;
  closingTime: string;
};

export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type PaymentMethod = 'pix' | 'cash' | 'credit_card' | 'debit_card';

export type Appointment = {
  id: string;
  clientId?: string | null;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  amount: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  completedAt?: string;
};

export type AppointmentUpdate = Partial<Pick<Appointment, 'clientId' | 'clientName' | 'clientPhone' | 'serviceId' | 'amount' | 'date' | 'time' | 'paymentMethod'>>;

type StoreData = {
  profile: ShopProfile | null;
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
};

type AppContextValue = StoreData & {
  ready: boolean;
  saveProfile: (profile: ShopProfile) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'clientId'> & { clientId?: string }) => Promise<void>;
  completeAppointment: (id: string, paymentMethod: PaymentMethod) => Promise<void>;
  updateAppointment: (id: string, update: AppointmentUpdate) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'active'>) => Promise<void>;
  addClient: (client: Pick<Client, 'name' | 'phone'>) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const STORAGE_KEY = 'barber-app-store-v1';
const scopedStorageKey = (userId: string) => `${STORAGE_KEY}:${userId}`;
const emptyStore: StoreData = { profile: null, services: [], clients: [], appointments: [] };
const AppContext = createContext<AppContextValue | null>(null);

const starterServices: Service[] = [
  { id: 'service-cut', name: 'Corte', duration: 30, price: 35, active: true },
  { id: 'service-beard', name: 'Barba', duration: 30, price: 25, active: true },
  { id: 'service-combo', name: 'Corte + Barba', duration: 60, price: 50, active: true },
];

function normalizeStore(value: Partial<StoreData>): StoreData {
  const services = Array.isArray(value.services) ? value.services : [];
  return {
    profile: value.profile ?? null,
    services,
    clients: Array.isArray(value.clients) ? value.clients : [],
    appointments: Array.isArray(value.appointments)
      ? value.appointments.map((appointment) => ({
          ...appointment,
          amount: appointment.amount || services.find((service) => service.id === appointment.serviceId)?.price || 0,
        })) as Appointment[]
      : [],
  };
}

function toStoreData(remote: Awaited<ReturnType<typeof getBarberShop>>): StoreData {
  return normalizeStore({
    ...remote,
    appointments: remote.appointments.map((appointment) => ({
      ...appointment,
      completedAt: appointment.completedAt ?? undefined,
    })),
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const [data, setData] = useState<StoreData>(emptyStore);
  const [cacheReady, setCacheReady] = useState(false);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!authLoaded) return;
    let active = true;
    setReady(false);
    setCacheReady(false);

    const loadCache = async () => {
      if (!isSignedIn || !userId) {
        if (active) {
          setData(emptyStore);
          setCacheReady(true);
        }
        return;
      }

      const scopedStored = await AsyncStorage.getItem(scopedStorageKey(userId));
      await AsyncStorage.removeItem(STORAGE_KEY);
      if (!active) return;
      if (scopedStored) {
        setData(normalizeStore(JSON.parse(scopedStored) as Partial<StoreData>));
      } else {
        setData(emptyStore);
      }
      setCacheReady(true);
    };

    void loadCache().catch(() => {
      if (active) {
        setData(emptyStore);
        setCacheReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [authLoaded, isSignedIn, userId]);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    if (!cacheReady || !authLoaded) return;
    if (!isSignedIn || !userId) {
      setReady(true);
      return;
    }

    let active = true;
    const sync = async () => {
      try {
        const remote = await getBarberShop();
        if (active) {
          const next = toStoreData(remote);
          setData(next);
          void AsyncStorage.setItem(scopedStorageKey(userId), JSON.stringify(next));
        }
      } catch (error) {
        const status = (error as { status?: number }).status;
        const localData = dataRef.current;
        if (status === 404 && localData.profile) {
          const services = localData.services.length > 0 ? localData.services : starterServices;
          const remote = await saveBarberShop({
            profile: localData.profile,
            services,
            clients: localData.clients,
            appointments: localData.appointments,
          });
          if (active) {
            const next = toStoreData(remote);
            setData(next);
            void AsyncStorage.setItem(scopedStorageKey(userId), JSON.stringify(next));
          }
        }
      } finally {
        if (active) setReady(true);
      }
    };
    void sync();
    return () => {
      active = false;
    };
  }, [authLoaded, cacheReady, isSignedIn, userId]);

  const persistCache = async (next: StoreData) => {
    setData(next);
    if (userId) await AsyncStorage.setItem(scopedStorageKey(userId), JSON.stringify(next));
  };

  const saveProfile = async (profile: ShopProfile) => {
    const services =
      data.services.length > 0
        ? data.services
        : starterServices;
    const remote = await saveBarberShop({ profile, services, clients: data.clients, appointments: data.appointments });
    await persistCache(toStoreData(remote));
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'status' | 'clientId'> & { clientId?: string }) => {
    const created = await createBarberAppointment(appointment);
    await persistCache({
      ...data,
      appointments: [...data.appointments, { ...created, completedAt: created.completedAt ?? undefined }],
    });
  };

  const completeAppointment = async (id: string, paymentMethod: PaymentMethod) => {
    const completed = await completeBarberAppointment(id, { paymentMethod });
    await persistCache({
      ...data,
      appointments: data.appointments.map((appointment) => appointment.id === id ? { ...completed, completedAt: completed.completedAt ?? undefined } : appointment),
    });
  };

  const updateAppointment = async (id: string, update: AppointmentUpdate) => {
    const updated = await updateBarberAppointment(id, update);
    await persistCache({
      ...data,
      appointments: data.appointments.map((appointment) =>
        appointment.id === id ? { ...updated, completedAt: updated.completedAt ?? undefined } : appointment,
      ),
    });
  };

  const addService = async (service: Omit<Service, 'id' | 'active'>) => {
    const created = await createBarberService(service);
    await persistCache({ ...data, services: [...data.services, created] });
  };

  const addClient = async (client: Pick<Client, 'name' | 'phone'>) => {
    await createBarberClient(client);
    const remote = await getBarberShop();
    await persistCache(toStoreData(remote));
  };

  const deleteAccount = async () => {
    await deleteBarberAccount({ confirmation: 'EXCLUIR' });
    if (userId) {
      await Promise.all([
        AsyncStorage.removeItem(scopedStorageKey(userId)),
        AsyncStorage.removeItem(STORAGE_KEY),
      ]);
    }
    setData(emptyStore);
  };

  const value = useMemo(
    () => ({ ...data, ready, saveProfile, addAppointment, completeAppointment, updateAppointment, addService, addClient, deleteAccount }),
    [data, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useShopStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useShopStore must be used inside AppProvider');
  return context;
}