import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Service } from "../data/types";
import api from "../lib/api";
import { mapApiService, type ApiService } from "../lib/serviceMapper";

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  addService: (s: Service) => void;
  updateService: (s: Service) => void;
  refresh: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchServices() {
    try {
      setError(null);
      const data = await api.get("/api/services?limit=50");
      const arr: ApiService[] = Array.isArray(data) ? data : (data?.services ?? []);
      setServices(arr.map(mapApiService));
    } catch {
      setError("Hizmetler yüklenemedi.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function addService(s: Service) {
    setServices((prev) => [s, ...prev]);
  }

  function updateService(s: Service) {
    setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }

  return (
    <ServicesContext.Provider value={{ services, loading, error, addService, updateService, refresh: fetchServices }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}

export { mapApiService };
