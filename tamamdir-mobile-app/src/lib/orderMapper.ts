import type { ServiceHistory } from "../data/types";

export type OrderAction = "accept" | "start" | "complete" | "cancel";

export interface OrderActionButton {
  action: OrderAction;
  label: string;
  primary?: boolean;
  danger?: boolean;
}

export function mapOrder(o: Record<string, unknown>, userId?: string): ServiceHistory {
  const isBuyer = o.buyer_id === userId;
  const rawStatus = String(o.status ?? "pending");
  const status = (
    ["completed", "pending", "cancelled", "accepted", "in_progress"].includes(rawStatus)
      ? rawStatus
      : "pending"
  ) as ServiceHistory["status"];

  return {
    id: String(o.id),
    serviceId: String(o.service_id ?? ""),
    serviceTitle: String(o.service_title ?? o.title ?? "Hizmet"),
    amount: `₺${Number(o.price_at_order ?? o.amount ?? o.price ?? 0)}`,
    partnerName: isBuyer ? String(o.provider_name ?? "") : String(o.buyer_name ?? ""),
    partnerAvatar: isBuyer ? String(o.provider_avatar ?? "") : String(o.buyer_avatar ?? ""),
    status,
    date: o.created_at ? new Date(String(o.created_at)).toLocaleDateString("tr-TR") : "",
    type: isBuyer ? "requested" : "provided",
    hasReview: Boolean(o.review_id),
    note: o.note ? String(o.note) : undefined,
  };
}

export function getOrderActions(item: ServiceHistory): OrderActionButton[] {
  const actions: OrderActionButton[] = [];
  const cancellable = ["pending", "accepted", "in_progress"].includes(item.status);

  if (item.type === "provided") {
    if (item.status === "pending") {
      actions.push({ action: "accept", label: "Kabul Et", primary: true });
    } else if (item.status === "accepted") {
      actions.push({ action: "start", label: "İşe Başla", primary: true });
    } else if (item.status === "in_progress") {
      actions.push({ action: "complete", label: "Tamamla", primary: true });
    }
  }

  if (cancellable) {
    actions.push({ action: "cancel", label: "İptal Et", danger: true });
  }

  return actions;
}

export const ORDER_STATUS_LABEL: Record<
  ServiceHistory["status"],
  { text: string; className: string }
> = {
  completed: { text: "TAMAMLANDI", className: "bg-emerald-50 text-emerald-700" },
  pending: { text: "BEKLEMEDE", className: "bg-amber-50 text-amber-700" },
  accepted: { text: "KABUL EDİLDİ", className: "bg-blue-50 text-blue-700" },
  in_progress: { text: "DEVAM EDİYOR", className: "bg-sky-50 text-sky-700" },
  cancelled: { text: "İPTAL", className: "bg-red-50 text-red-700" },
};
