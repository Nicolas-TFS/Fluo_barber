import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

export type PaymentMethod = 'pix' | 'cash' | 'credit_card' | 'debit_card';

export type Appointment = {
  id: string;
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

type StoreData = {
  profile: ShopProfile | null;
  services: Service[];
  appointments: Appointment[];
};

type AppContextValue = StoreData & {
  ready: boolean;
  saveProfile: (profile: ShopProfile) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<void>;
  completeAppointment: (id: string, paymentMethod: PaymentMethod) => Promise<void>;
};

const STORAGE_KEY = 'barber-app-store-v1';
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData>({
    profile: null,
    services: [],
    appointments: [],
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setData(JSON.parse(stored) as StoreData);
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const persist = async (next: StoreData) => {
    setData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveProfile = async (profile: ShopProfile) => {
    const services =
      data.services.length > 0
        ? data.services
        : [
            { id: 'service-cut', name: 'Corte', duration: 30, price: 35, active: true },
            { id: 'service-beard', name: 'Barba', duration: 30, price: 25, active: true },
            { id: 'service-combo', name: 'Corte + Barba', duration: 60, price: 50, active: true },
          ];
    await persist({ ...data, profile, services });
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'status'>) => {
    await persist({
      ...data,
      appointments: [
        ...data.appointments,
        {
          ...appointment,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          status: 'scheduled',
        },
      ],
    });
  };

  const completeAppointment = async (id: string, paymentMethod: PaymentMethod) => {
    await persist({
      ...data,
      appointments: data.appointments.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: 'completed', paymentMethod, completedAt: new Date().toISOString() }
          : appointment,
      ),
    });
  };

  const value = useMemo(
    () => ({ ...data, ready, saveProfile, addAppointment, completeAppointment }),
    [data, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useShopStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useShopStore must be used inside AppProvider');
  return context;
}