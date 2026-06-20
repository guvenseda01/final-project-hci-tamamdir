import type { Service } from "../data/types";

export interface ApiService {
  id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  category_name: string;
  category_slug?: string;
  provider_id: string;
  provider_name: string;
  provider_avatar: string | null;
  provider_verified?: 0 | 1;
  provider_department?: string | null;
  rating: number;
  review_count: number;
  order_count: number;
  delivery_days: number;
  cover_image?: string | null;
  is_active?: 0 | 1 | boolean;
  images?: { id: string; image_url: string; is_cover: 0 | 1 | boolean }[];
}

function unitLabel(unit: string) {
  const map: Record<string, string> = {
    hour: "sa",
    session: "seans",
    day: "gün",
    piece: "adet",
    item: "adet",
    week: "hafta",
  };
  return map[unit] ?? unit;
}

function resolveImage(s: ApiService): string {
  if (s.cover_image) return s.cover_image;
  const cover = s.images?.find((i) => i.is_cover === 1 || i.is_cover === true);
  if (cover) return cover.image_url;
  if (s.images?.[0]) return s.images[0].image_url;
  return `https://picsum.photos/seed/${s.id}/600/400`;
}

function mapStatus(isActive: 0 | 1 | boolean | undefined): Service["status"] {
  if (isActive === 1 || isActive === true) return "active";
  return "paused";
}

export function formatPrice(price: number, priceUnit: string): string {
  if (priceUnit === "item" || priceUnit === "piece") return `₺${price}`;
  return `₺${price}/${unitLabel(priceUnit)}`;
}

export function mapApiService(s: ApiService): Service {
  const priceUnit = s.price_unit ?? "session";
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    price: formatPrice(s.price, priceUnit),
    priceNum: Number(s.price) || 0,
    priceUnit,
    category: s.category_name,
    providerId: s.provider_id,
    providerName: s.provider_name,
    providerDepartment: s.provider_department ?? "",
    providerAvatar: s.provider_avatar ?? `https://i.pravatar.cc/150?u=${s.provider_id}`,
    providerVerified: s.provider_verified === 1,
    rating: s.rating ?? 0,
    reviewCount: s.review_count ?? 0,
    orderCount: s.order_count ?? 0,
    image: resolveImage(s),
    tags: [s.category_name],
    deliveryDays: s.delivery_days ?? 1,
    location: "",
    status: mapStatus(s.is_active),
    coverImageId: s.images?.find((i) => i.is_cover === 1 || i.is_cover === true)?.id,
  };
}
