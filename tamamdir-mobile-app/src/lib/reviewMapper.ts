import type { Review } from "../data/types";
import { resolveMediaUrl } from "./mediaUrl";

export interface ApiReview {
  id: string;
  service_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function mapReview(r: ApiReview): Review {
  return {
    id: r.id,
    serviceId: r.service_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    reviewerAvatar: resolveMediaUrl(r.reviewer_avatar),
    rating: Number(r.rating) || 0,
    comment: r.comment ?? "",
    date: new Date(r.created_at).toLocaleDateString("tr-TR"),
  };
}

export function mapReviews(data: unknown): Review[] {
  return Array.isArray(data) ? data.map((r) => mapReview(r as ApiReview)) : [];
}
