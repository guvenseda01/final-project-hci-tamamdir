import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import UserAvatar from "../components/UserAvatar";
import ServiceImage from "../components/ServiceImage";
import { formatPrice } from "../lib/serviceMapper";
import {
  mergeTamamdirStatus,
  needsFeedbackPrompt,
  getCancelModalCopy,
  formatBanUntil,
  isServiceLive,
  type TamamdirStatus,
} from "../lib/tamamdirStatus";
import { getSocket, joinConversation, leaveConversation } from "../lib/socket";
import TamamdirButton from "../components/TamamdirButton";
import LeaveFeedbackModal from "../components/LeaveFeedbackModal";
import ReportModal from "../components/ReportModal";
import Toast from "../components/Toast";

export interface ChatConversationMeta {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  service_id?: string | null;
  service_title?: string | null;
  service_price?: number | null;
  service_price_unit?: string | null;
}

interface ApiMessage {
  id: string;
  content?: string;
  sender_id: string;
  created_at?: string;
}

interface ActiveService {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  provider_id: string;
  is_active?: number | boolean;
  images?: { image_url: string; is_cover?: number | boolean }[];
}

interface ChatViewProps {
  conversation: ChatConversationMeta;
  initialServiceId?: string | null;
  onBack: () => void;
  onListRefresh?: () => void;
}

function formatMsgTime(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatView({
  conversation,
  initialServiceId,
  onBack,
  onListRefresh,
}: ChatViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeServiceId, setActiveServiceId] = useState<string | null>(
    initialServiceId ?? conversation.service_id ?? null
  );
  const [activeService, setActiveService] = useState<ActiveService | null>(null);
  const [tamamdirStatus, setTamamdirStatus] = useState<TamamdirStatus | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);
  const [tamamdirSubmitting, setTamamdirSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [unbanSubmitting, setUnbanSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef(conversation.id);
  const serviceIdRef = useRef(activeServiceId);
  const prevConvRef = useRef<string | null>(null);

  convIdRef.current = conversation.id;
  serviceIdRef.current = activeServiceId;

  const fetchTamamdirStatus = useCallback(
    async (convId: string, serviceId: string) => {
      try {
        const status = await api.get(
          `/api/messages/conversations/${convId}/tamamdir?service_id=${serviceId}`
        );
        if (convIdRef.current !== convId) return;
        setTamamdirStatus((prev) =>
          mergeTamamdirStatus(prev, status, user?.id, conversation.participantId)
        );
      } catch {
        if (convIdRef.current === convId) setTamamdirStatus(null);
      }
    },
    [user?.id, conversation.participantId]
  );

  const loadChat = useCallback(async () => {
    const convId = conversation.id;
    setLoadingMsgs(true);
    setTamamdirStatus(null);
    setShowCancelConfirm(false);
    setShowFeedbackModal(false);

    try {
      const msgs = await api.get(`/api/messages/conversations/${convId}`);
      if (convIdRef.current !== convId) return;
      setMessages(Array.isArray(msgs) ? msgs : []);

      let resolvedServiceId = initialServiceId ?? conversation.service_id ?? null;

      if (!resolvedServiceId) {
        const ctx = await api.get(
          `/api/messages/conversations/${convId}/service-context`
        );
        if (convIdRef.current !== convId) return;
        if (ctx?.service_id) resolvedServiceId = ctx.service_id;
      }

      if (resolvedServiceId) {
        setActiveServiceId(resolvedServiceId);
        serviceIdRef.current = resolvedServiceId;
        await fetchTamamdirStatus(convId, resolvedServiceId);
      }
    } catch {
      if (convIdRef.current === convId) setMessages([]);
    } finally {
      if (convIdRef.current === convId) setLoadingMsgs(false);
    }
  }, [conversation.id, conversation.service_id, initialServiceId, fetchTamamdirStatus]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!activeServiceId) {
      setActiveService(null);
      return;
    }
    let cancelled = false;
    api
      .get(`/api/services/${activeServiceId}`)
      .then((data: ActiveService) => {
        if (!cancelled) setActiveService(data);
      })
      .catch(() => {
        if (!cancelled) setActiveService(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeServiceId]);

  useEffect(() => {
    if (!conversation.participantId) return;
    api
      .get(`/api/users/${conversation.participantId}/block-status`)
      .then((data: { blocked?: boolean }) => setIsUserBlocked(!!data.blocked))
      .catch(() => setIsUserBlocked(false));
  }, [conversation.participantId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tamamdirStatus, showFeedbackThanks]);

  useEffect(() => {
    if (!conversation.id) return;
    if (prevConvRef.current && prevConvRef.current !== conversation.id) {
      leaveConversation(prevConvRef.current);
    }
    joinConversation(conversation.id);
    prevConvRef.current = conversation.id;
    return () => {
      if (prevConvRef.current) leaveConversation(prevConvRef.current);
    };
  }, [conversation.id]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg: ApiMessage & { conversation_id: string }) => {
      if (msg.conversation_id === convIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
      onListRefresh?.();
    };

    const onTamamdirUpdate = (payload: Record<string, unknown> & {
      conversation_id?: string;
      service_id?: string;
    }) => {
      if (payload.conversation_id && payload.conversation_id !== convIdRef.current) return;
      if (
        payload.service_id &&
        serviceIdRef.current &&
        payload.service_id !== serviceIdRef.current
      ) {
        return;
      }
      if (payload.service_id && payload.service_id !== serviceIdRef.current) {
        setActiveServiceId(payload.service_id as string);
        serviceIdRef.current = payload.service_id as string;
      }
      setTamamdirStatus((prev) =>
        mergeTamamdirStatus(prev, payload, user.id, conversation.participantId)
      );
      if (!payload.both_confirmed) setShowCancelConfirm(false);
    };

    socket.on("message:new", onNewMessage);
    socket.on("tamamdir:update", onTamamdirUpdate);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("tamamdir:update", onTamamdirUpdate);
    };
  }, [user?.id, conversation.participantId, onListRefresh]);

  async function sendMessage() {
    const text = input.trim();
    const blocked =
      tamamdirStatus?.i_am_banned ||
      (activeService != null && !isServiceLive(activeService) && activeService.provider_id !== user?.id) ||
      isUserBlocked;
    if (!text || sending || blocked) return;
    setSending(true);
    setInput("");
    try {
      const msg = await api.post(`/api/messages/conversations/${conversation.id}`, {
        content: text,
      });
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg as ApiMessage]
      );
      onListRefresh?.();
    } catch {
      setInput(text);
      setToastMessage("Mesaj gönderilemedi.");
      setToastVisible(true);
    } finally {
      setSending(false);
    }
  }

  async function handleTamamdir() {
    if (!activeServiceId || tamamdirSubmitting) return;
    if (tamamdirStatus?.my_confirmed || tamamdirStatus?.both_confirmed) return;

    setTamamdirSubmitting(true);
    try {
      const status = await api.post(
        `/api/messages/conversations/${conversation.id}/tamamdir`,
        { service_id: activeServiceId }
      );
      setTamamdirStatus((prev) =>
        mergeTamamdirStatus(prev, status, user?.id, conversation.participantId)
      );
      if (status.both_confirmed) {
        await fetchTamamdirStatus(conversation.id, activeServiceId);
        setToastMessage("Anlaşma tamam! Geri bildirim bırakabilirsin.");
        setToastVisible(true);
      } else {
        setToastMessage("Tamamdır onayın gönderildi.");
        setToastVisible(true);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; data?: Record<string, unknown> };
      if (e.status === 403 && e.data) {
        setTamamdirStatus((prev) =>
          mergeTamamdirStatus(prev, e.data!, user?.id, conversation.participantId)
        );
      }
      const msg =
        (e.data?.error as string) ??
        (err as { message?: string }).message ??
        "Tamamdır gönderilemedi.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setTamamdirSubmitting(false);
    }
  }

  async function handleConfirmCancel() {
    if (!activeServiceId || cancelSubmitting) return;
    setCancelSubmitting(true);
    try {
      const status = await api.post(
        `/api/messages/conversations/${conversation.id}/tamamdir/cancel`,
        { service_id: activeServiceId }
      );
      setTamamdirStatus((prev) =>
        mergeTamamdirStatus(prev, status, user?.id, conversation.participantId)
      );
      setShowCancelConfirm(false);
      setToastMessage("Anlaşma iptal edildi.");
      setToastVisible(true);
    } catch {
      setToastMessage("İptal edilemedi.");
      setToastVisible(true);
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function handleUnban() {
    if (!activeServiceId || unbanSubmitting) return;
    setUnbanSubmitting(true);
    try {
      const status = await api.post(
        `/api/messages/conversations/${conversation.id}/tamamdir/unban`,
        { service_id: activeServiceId }
      );
      setTamamdirStatus((prev) =>
        mergeTamamdirStatus(prev, status, user?.id, conversation.participantId)
      );
      setToastMessage("Ban kaldırıldı.");
      setToastVisible(true);
    } catch {
      setToastMessage("Ban kaldırılamadı.");
      setToastVisible(true);
    } finally {
      setUnbanSubmitting(false);
    }
  }

  async function toggleBlockUser() {
    if (!conversation.participantId || blockBusy) return;
    setBlockBusy(true);
    try {
      if (isUserBlocked) {
        await api.del(`/api/users/${conversation.participantId}/block`);
        setIsUserBlocked(false);
        setToastMessage("Engel kaldırıldı.");
      } else {
        await api.post(`/api/users/${conversation.participantId}/block`);
        setIsUserBlocked(true);
        setToastMessage("Kullanıcı engellendi.");
        onBack();
      }
      setShowMenu(false);
      setToastVisible(true);
    } catch {
      setToastMessage("İşlem başarısız.");
      setToastVisible(true);
    } finally {
      setBlockBusy(false);
    }
  }

  const serviceCover =
    activeService?.images?.find((i) => i.is_cover)?.image_url ??
    activeService?.images?.[0]?.image_url ??
    null;

  const isServiceProvider = activeService?.provider_id === user?.id;
  const isServiceInactive = activeService != null && !isServiceLive(activeService);
  const hasOngoingArrangement = Boolean(
    tamamdirStatus?.my_confirmed ||
      tamamdirStatus?.both_confirmed ||
      tamamdirStatus?.other_confirmed
  );
  const customerMessagingBlocked = isServiceInactive && !isServiceProvider;
  const messagingDisabled = Boolean(
    tamamdirStatus?.i_am_banned || customerMessagingBlocked || isUserBlocked
  );

  const cancelCopy = getCancelModalCopy(tamamdirStatus);

  const headerPadding = activeServiceId ? "pt-[220px]" : "pt-16";

  function renderTamamdirAction() {
    if (!activeServiceId) return null;
    if (isServiceInactive && !hasOngoingArrangement) return null;

    if (tamamdirStatus?.is_banned && tamamdirStatus?.can_unban) {
      return (
        <button
          type="button"
          onClick={handleUnban}
          disabled={unbanSubmitting}
          className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-60"
        >
          {unbanSubmitting ? "Kaldırılıyor..." : "Ban kaldır"}
        </button>
      );
    }

    if (tamamdirStatus?.is_banned) return null;

    if (
      tamamdirStatus?.both_confirmed &&
      tamamdirStatus?.my_review_submitted &&
      !tamamdirStatus?.other_review_submitted
    ) {
      return (
        <p className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-xl text-center">
          {conversation.participantName} geri bildirimini bekliyoruz
        </p>
      );
    }

    if (tamamdirStatus?.both_confirmed && !tamamdirStatus?.my_review_submitted) {
      return (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-sm"
          >
            {tamamdirStatus?.my_existing_review ? "Geri bildirimi güncelle" : "Geri bildirim bırak"}
          </button>
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full h-11 rounded-xl border border-amber-300 text-amber-800 font-bold text-sm"
          >
            İptal et
          </button>
        </div>
      );
    }

    if (tamamdirStatus?.my_confirmed && !tamamdirStatus?.both_confirmed) {
      return (
        <p className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-xl text-center">
          {conversation.participantName} onayını bekliyoruz
        </p>
      );
    }

    if (isServiceInactive) return null;

    return (
      <TamamdirButton
        label={tamamdirSubmitting ? "Gönderiliyor..." : "Tamamdır!"}
        onClick={handleTamamdir}
        disabled={tamamdirSubmitting || !!tamamdirStatus?.my_confirmed}
        className="h-12 text-sm"
      />
    );
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto flex flex-col">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <header className="bg-white border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
        <div className="h-14 flex items-center px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-slate-100 active:scale-95 mr-2"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <UserAvatar
            src={conversation.participantAvatar}
            userId={conversation.participantId}
            name={conversation.participantName}
            alt={conversation.participantName}
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <p className="font-bold text-sm text-on-surface truncate flex-1">
            {conversation.participantName}
          </p>
          <button type="button" onClick={() => setShowMenu((v) => !v)} className="p-1">
            <span className="material-symbols-outlined text-outline">more_vert</span>
          </button>
          {showMenu && (
            <div className="absolute right-4 top-12 bg-white border border-outline-variant/20 rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
              <button
                type="button"
                disabled={blockBusy}
                onClick={toggleBlockUser}
                className="w-full text-left px-4 py-3 text-sm text-error font-medium"
              >
                {isUserBlocked ? "Engeli kaldır" : "Kullanıcıyı engelle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full text-left px-4 py-3 text-sm text-on-surface font-medium"
              >
                Sohbeti şikayet et
              </button>
            </div>
          )}
        </div>

        {(activeServiceId || conversation.service_title) && (
          <div className="px-4 pb-3 space-y-2 border-t border-slate-50">
            <button
              type="button"
              onClick={() => activeServiceId && navigate(`/services/${activeServiceId}`)}
              className="flex items-center gap-3 w-full text-left"
            >
              {serviceCover ? (
                <ServiceImage
                  src={serviceCover}
                  serviceId={activeServiceId ?? undefined}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">storefront</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase text-outline tracking-wide">
                  {isServiceProvider ? "Verdiğin hizmet" : "Talep edilen hizmet"}
                </p>
                <p className="font-bold text-sm text-on-surface line-clamp-2 leading-tight">
                  {activeService?.title ??
                    tamamdirStatus?.service_title ??
                    conversation.service_title ??
                    "Yükleniyor…"}
                </p>
                {(activeService?.price != null || conversation.service_price != null) && (
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {formatPrice(
                      activeService?.price ?? conversation.service_price ?? 0,
                      activeService?.price_unit ?? conversation.service_price_unit ?? "session"
                    )}
                  </p>
                )}
                {isServiceInactive && (
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Arşivlendi</span>
                )}
              </div>
            </button>
            {renderTamamdirAction()}
          </div>
        )}
      </header>

      <div className={`flex-1 overflow-y-auto px-4 space-y-3 ${headerPadding} pb-36`}>
        {loadingMsgs ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">
              progress_activity
            </span>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <p className="text-center text-outline text-sm py-8">Henüz mesaj yok. Merhaba de!</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-primary text-on-primary rounded-br-sm"
                        : "bg-white text-on-surface rounded-bl-sm shadow-card"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${isMe ? "text-emerald-100" : "text-outline"}`}
                    >
                      {formatMsgTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {tamamdirStatus?.i_am_banned && (
        <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-4 py-2 bg-red-50 border-t border-red-100 z-50">
          <p className="text-xs font-bold text-red-600 text-center">
            {formatBanUntil(tamamdirStatus.banned_until)} tarihine kadar bu hizmetten banlandın
          </p>
        </div>
      )}

      {tamamdirStatus?.other_confirmed &&
        !tamamdirStatus?.my_confirmed &&
        !tamamdirStatus?.both_confirmed &&
        !tamamdirStatus?.is_banned &&
        !isServiceInactive && (
          <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-4 py-2 bg-green-50 border-t border-green-100 z-50">
            <p className="text-xs font-bold text-primary text-center">
              {conversation.participantName} Tamamdır dedi! Sen de Tamamdır&apos;a tıkla.
            </p>
          </div>
        )}

      {needsFeedbackPrompt(tamamdirStatus) && !tamamdirStatus?.is_banned && (
        <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-4 py-2 bg-green-50 border-t border-green-100 z-50">
          <p className="text-xs font-bold text-primary text-center">
            Anlaşma tamam — lütfen geri bildirim bırak
          </p>
        </div>
      )}

      {isServiceInactive && !hasOngoingArrangement && (
        <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-4 py-2 bg-amber-50 border-t border-amber-100 z-50">
          <p className="text-xs font-bold text-amber-700 text-center">
            {isServiceProvider
              ? "Bu ilan arşivlendi. Yeni anlaşmalar için hizmeti yeniden aktifleştir."
              : "Bu hizmet şu an aktif değil."}
          </p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2 max-w-md mx-auto z-50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !messagingDisabled) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={messagingDisabled}
          className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border-none disabled:opacity-50"
          placeholder={
            tamamdirStatus?.i_am_banned
              ? "Banlısın — mesaj gönderemezsin"
              : customerMessagingBlocked
                ? "Hizmet aktif değil"
                : "Mesaj yaz..."
          }
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !input.trim() || messagingDisabled}
          className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-btn-primary active:scale-90 transition-all disabled:opacity-40"
        >
          <span className="material-symbols-outlined fill-icon text-sm">
            {sending ? "progress_activity" : "send"}
          </span>
        </button>
      </div>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4"
          onClick={() => !cancelSubmitting && setShowCancelConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-on-surface">İptal onayı</h3>
            <p className="text-sm text-on-surface-variant">{cancelCopy.body}</p>
            <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">{cancelCopy.note}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-outline-variant/30 font-bold text-sm"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelSubmitting}
                className="flex-1 h-11 rounded-xl bg-error text-white font-bold text-sm disabled:opacity-60"
              >
                {cancelSubmitting ? "İptal ediliyor..." : "İptal et"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LeaveFeedbackModal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSuccess={() => {
          setShowFeedbackThanks(true);
          if (activeServiceId) {
            fetchTamamdirStatus(conversation.id, activeServiceId);
          }
          setTimeout(() => setShowFeedbackThanks(false), 2500);
        }}
        orderId={tamamdirStatus?.order_id ?? ""}
        isCustomer={!!tamamdirStatus?.is_customer}
        revieweeName={conversation.participantName}
        serviceTitle={
          activeService?.title ?? tamamdirStatus?.service_title ?? conversation.service_title ?? ""
        }
        initialRating={tamamdirStatus?.my_existing_review?.rating ?? 0}
        initialComment={tamamdirStatus?.my_existing_review?.comment ?? ""}
        isUpdate={!!tamamdirStatus?.my_existing_review}
      />

      {showFeedbackThanks && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl px-8 py-6 text-center shadow-xl">
            <span className="material-symbols-outlined text-primary text-5xl fill-icon">
              check_circle
            </span>
            <p className="font-bold text-on-surface mt-3">Teşekkürler!</p>
            <p className="text-sm text-outline mt-1">Geri bildirimin kaydedildi.</p>
          </div>
        </div>
      )}

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="conversation"
        targetId={conversation.id}
        targetLabel={conversation.participantName}
      />
    </div>
  );
}
