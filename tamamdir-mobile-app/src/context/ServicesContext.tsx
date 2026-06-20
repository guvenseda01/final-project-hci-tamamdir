import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Service } from "../data/types";
import api from "../lib/api";
import { SERVICES as MOCK_SERVICES } from "../data/mockData";

interface ApiService {
  id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  category_name: string;
  category_slug: string;
  provider_id: string;
  provider_name: string;
  provider_avatar: string | null;
  provider_verified: 0 | 1;
  provider_department: string | null;
  rating: number;
  review_count: number;
  order_count: number;
  delivery_days: number;
  cover_image: string | null;
}

function mapService(s: ApiService): Service {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    price: `₺${s.price}${s.price_unit !== 'item' ? `/${unitLabel(s.price_unit)}` : ''}`,
    priceNum: s.price,
    category: s.category_name,
    providerId: s.provider_id,
    providerName: s.provider_name,
    providerDepartment: s.provider_department ?? "",
    providerAvatar: s.provider_avatar ?? `https://i.pravatar.cc/150?u=${s.provider_id}`,
    providerVerified: s.provider_verified === 1,
    rating: s.rating ?? 0,
    reviewCount: s.review_count ?? 0,
    image: s.cover_image ?? `https://picsum.photos/seed/${s.id}/600/400`,
    tags: [s.category_name],
    deliveryDays: s.delivery_days,
    location: "",
    status: "active",
  };
}

function unitLabel(unit: string) {
  const map: Record<string, string> = { hour: 'sa', session: 'seans', day: 'gün', piece: 'adet' };
  return map[unit] ?? unit;
}

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
      const data = await api.get('/api/services?limit=50');
      setServices((data.services as ApiService[]).map(mapService));
    } catch {
      setServices(MOCK_SERVICES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchServices(); }, []);

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
