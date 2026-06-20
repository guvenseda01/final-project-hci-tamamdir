import { createContext, useContext, useState, type ReactNode } from "react";
import type { Service } from "../data/types";
import { SERVICES } from "../data/mockData";

interface ServicesContextType {
  services: Service[];
  addService: (s: Service) => void;
  updateService: (s: Service) => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([...SERVICES]);

  function addService(s: Service) {
    setServices((prev) => [s, ...prev]);
  }

  function updateService(s: Service) {
    setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }

  return (
    <ServicesContext.Provider value={{ services, addService, updateService }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}
