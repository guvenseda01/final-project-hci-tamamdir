export interface TamamdirStatus {
  service_id?: string | null;
  service_title?: string | null;
  my_confirmed?: boolean;
  other_confirmed?: boolean;
  both_confirmed?: boolean;
  order_id?: string | null;
  order_status?: string | null;
  cancel_count?: number;
  customer_cancel_count?: number;
  provider_cancel_count?: number;
  cancel_limit?: number;
  is_customer?: boolean;
  my_cancel_count?: number;
  my_cancels_remaining?: number;
  will_be_banned_if_cancel?: boolean;
  is_banned?: boolean;
  banned_until?: string | null;
  banned_user_id?: string | null;
  i_am_banned?: boolean;
  can_unban?: boolean;
  buyer_id?: string | null;
  provider_id?: string | null;
  my_review_submitted?: boolean;
  other_review_submitted?: boolean;
  can_leave_review?: boolean;
  both_reviews_submitted?: boolean;
  my_existing_review?: { rating: number; comment?: string | null } | null;
}

export function mergeTamamdirStatus(
  prev: TamamdirStatus | null,
  payload: Record<string, unknown>,
  userId?: string,
  otherId?: string | null
): TamamdirStatus {
  const ids = (payload.confirmed_user_ids as string[] | undefined) ?? [];
  const bothConfirmed = Boolean(payload.both_confirmed);
  const orderId = bothConfirmed ? ((payload.order_id as string | null) ?? null) : null;
  const myReviewSubmitted = bothConfirmed ? Boolean(payload.my_review_submitted) : false;

  return {
    service_id: (payload.service_id as string) ?? prev?.service_id,
    service_title: (payload.service_title as string) ?? prev?.service_title,
    my_confirmed: (payload.my_confirmed as boolean) ?? ids.includes(userId ?? ""),
    other_confirmed:
      (payload.other_confirmed as boolean) ??
      (otherId ? ids.includes(otherId) : ids.length >= 2),
    both_confirmed: bothConfirmed,
    order_id: orderId,
    order_status: bothConfirmed
      ? ((payload.order_status as string) ?? prev?.order_status ?? null)
      : null,
    cancel_count: (payload.cancel_count as number) ?? prev?.cancel_count ?? 0,
    customer_cancel_count:
      (payload.customer_cancel_count as number) ?? prev?.customer_cancel_count ?? 0,
    provider_cancel_count:
      (payload.provider_cancel_count as number) ?? prev?.provider_cancel_count ?? 0,
    cancel_limit: (payload.cancel_limit as number) ?? 2,
    is_customer: (payload.is_customer as boolean) ?? prev?.is_customer,
    my_cancel_count: (payload.my_cancel_count as number) ?? prev?.my_cancel_count ?? 0,
    my_cancels_remaining:
      (payload.my_cancels_remaining as number) ?? prev?.my_cancels_remaining,
    will_be_banned_if_cancel: Boolean(payload.will_be_banned_if_cancel),
    is_banned: Boolean(payload.is_banned),
    banned_until: (payload.banned_until as string | null) ?? null,
    banned_user_id: (payload.banned_user_id as string | null) ?? null,
    i_am_banned: Boolean(payload.i_am_banned),
    can_unban: Boolean(payload.can_unban),
    buyer_id: (payload.buyer_id as string) ?? prev?.buyer_id,
    provider_id: (payload.provider_id as string) ?? prev?.provider_id,
    my_review_submitted: myReviewSubmitted,
    other_review_submitted: bothConfirmed
      ? Boolean(payload.other_review_submitted ?? prev?.other_review_submitted)
      : false,
    can_leave_review: bothConfirmed && Boolean(orderId) && !myReviewSubmitted,
    both_reviews_submitted: Boolean(payload.both_reviews_submitted),
    my_existing_review:
      (payload.my_existing_review as TamamdirStatus["my_existing_review"]) ??
      prev?.my_existing_review ??
      null,
  };
}

export function needsFeedbackPrompt(status: TamamdirStatus | null) {
  return Boolean(status?.both_confirmed && status?.order_id && !status?.my_review_submitted);
}

export function getCancelModalCopy(status: TamamdirStatus | null) {
  if (!status?.is_customer) {
    return {
      body: "Bu hizmet anlaşmasını iptal etmek istediğine emin misin?",
      note: "Sağlayıcılar iptal nedeniyle banlanmaz. Müşteri deneyimini yorumlayabilir.",
    };
  }

  const used = status.customer_cancel_count ?? 0;
  const limit = status.cancel_limit ?? 2;

  if (status.will_be_banned_if_cancel) {
    return {
      body: "Bu hizmet anlaşmasını iptal etmek istediğine emin misin?",
      note: `Müşteriler en fazla ${limit} kez iptal edebilir (${used}/${limit} kullanıldı). Bu son iptalin — 1 hafta bu hizmetten banlanırsın.`,
    };
  }

  const leftAfter = Math.max(0, (status.my_cancels_remaining ?? limit - used) - 1);
  return {
    body: "Bu hizmet anlaşmasını iptal etmek istediğine emin misin?",
    note: `Müşteriler en fazla ${limit} kez iptal edebilir (${used}/${limit} kullanıldı). Bu iptalden sonra banlanmadan önce ${leftAfter} iptal hakkın kalır.`,
  };
}

export function formatBanUntil(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isServiceLive(service: { is_active?: number | boolean | null } | null) {
  return service && service.is_active !== 0 && service.is_active !== false;
}
