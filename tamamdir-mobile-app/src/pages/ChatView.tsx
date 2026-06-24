import { useState, useRef, useEffect, useCallback } from "react";
import type { Conversation, Message } from "../data/types";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import TamamdirButton from "../components/TamamdirButton";
import Toast from "../components/Toast";

interface ServiceContext {
  id: string;
  title: string;
  price: string;
  image: string;
  providerId?: string;
}

interface ChatOrder {
  id: string;
  service_id: string;
  service_title: string;
  buyer_id: string;
  status: string;
}

interface ChatViewProps {
  conversation: Conversation;
  serviceContext?: ServiceContext;
  onBack: () => void;
}

function matchesConversationOrder(o: ChatOrder, participantId: string, serviceId?: string) {
  if (o.buyer_id !== participantId) return false;
  if (serviceId && o.service_id !== serviceId) return false;
  return true;
}

export default function ChatView({ conversation, serviceContext, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [input, setInput] = useState("");
  const [pendingOrder, setPendingOrder] = useState<ChatOrder | null>(null);
  const [activeOrder, setActiveOrder] = useState<ChatOrder | null>(null);
  const [acceptDone, setAcceptDone] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const serviceId = serviceContext?.id;
  const isProviderView = Boolean(
    serviceContext?.providerId
      ? user?.id === serviceContext.providerId
      : pendingOrder && user?.id !== pendingOrder.buyer_id
  );
  const isBuyerView = Boolean(
    serviceContext?.providerId
      ? user?.id !== serviceContext.providerId
      : !isProviderView
  );

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.get(`/api/messages/conversations/${conversation.id}`);
      const list = Array.isArray(data) ? data : [];
      setMessages(
        list.map((m: { id: string; content?: string; sender_id: string; created_at?: string }) => ({
          id: m.id,
          text: m.content ?? "",
          senderId: m.sender_id,
          timestamp: m.created_at
            ? new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
            : "",
        }))
      );
    } catch {
      setMessages([]);
    }
  }, [conversation.id]);

  const loadOrderState = useCallback(async () => {
    if (!user) return;

    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get("/api/orders?role=provider&status=pending").catch(() => []),
        api.get("/api/orders?role=all").catch(() => []),
      ]);

      const pendingList = Array.isArray(pendingRes) ? pendingRes : [];
      const allList = Array.isArray(allRes) ? allRes : [];

      const pendingMatch = pendingList.find((o: ChatOrder) =>
        matchesConversationOrder(o, conversation.participantId, serviceId)
      );
      setPendingOrder(pendingMatch ?? null);

      const inProgress = allList.find(
        (o: ChatOrder) =>
          matchesConversationOrder(o, conversation.participantId, serviceId) &&
          ["accepted", "in_progress"].includes(o.status)
      );
      setActiveOrder(inProgress ?? null);

      if (serviceId && isBuyerView) {
        const buyerActive = allList.find(
          (o: ChatOrder) =>
            o.buyer_id === user.id &&
            o.service_id === serviceId &&
            !["cancelled", "completed"].includes(o.status)
        );
        if (buyerActive && !inProgress && !pendingMatch) {
          setActiveOrder(buyerActive);
        } else if (buyerActive) {
          setActiveOrder(buyerActive);
        }
      }
    } catch {
      setPendingOrder(null);
    }
  }, [user, conversation.participantId, serviceId, isBuyerView]);

  useEffect(() => {
    loadMessages();
    loadOrderState();
  }, [loadMessages, loadOrderState]);

  useEffect(() => {
    const interval = setInterval(loadOrderState, 8000);
    return () => clearInterval(interval);
  }, [loadOrderState]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, acceptDone, pendingOrder, activeOrder]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const optimistic: Message = {
      id: `m${Date.now()}`,
      text,
      senderId: user?.id ?? "",
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      await api.post(`/api/messages/conversations/${conversation.id}`, { content: text });
      await loadMessages();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
      setToastMessage("Mesaj gönderilemedi.");
      setToastVisible(true);
    }
  }

  async function handlePlaceOrder() {
    if (!serviceContext || placingOrder || pendingOrder || activeOrder) return;
    setPlacingOrder(true);
    try {
      const created = await api.post("/api/orders", { service_id: serviceContext.id });
      setPendingOrder(created as ChatOrder);
      setToastMessage("Sipariş talebin gönderildi. Sağlayıcı onaylayınca bilgilendirileceksin.");
      setToastVisible(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Sipariş oluşturulamadı.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setPlacingOrder(false);
    }
  }

  async function handleCancelOrder() {
    const orderId = activeOrder?.id ?? pendingOrder?.id;
    if (!orderId || orderActionLoading) return;
    if (!window.confirm("Bu siparişi iptal etmek istediğine emin misin?")) return;
    setOrderActionLoading(true);
    try {
      await api.patch(`/api/orders/${orderId}/cancel`);
      setPendingOrder(null);
      setActiveOrder(null);
      setAcceptDone(false);
      setToastMessage("Sipariş iptal edildi.");
      setToastVisible(true);
      await loadOrderState();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "İptal edilemedi.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setOrderActionLoading(false);
    }
  }

  async function runProviderAction(action: "accept" | "start" | "complete") {
    const orderId =
      action === "accept" ? pendingOrder?.id : activeOrder?.id;
    if (!orderId || orderActionLoading) return;

    setOrderActionLoading(true);
    try {
      const updated = await api.patch(`/api/orders/${orderId}/${action}`);
      const order = updated as ChatOrder;

      if (action === "accept") {
        setAcceptDone(true);
        setPendingOrder(null);
        setActiveOrder(order);
        setToastMessage("Sipariş kabul edildi!");
      } else if (action === "start") {
        setActiveOrder(order);
        setToastMessage("Sipariş başlatıldı.");
      } else {
        setActiveOrder(null);
        setToastMessage("Sipariş tamamlandı! Alıcı yorum bırakabilir.");
      }
      setToastVisible(true);
      await loadOrderState();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "İşlem yapılamadı.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setOrderActionLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const displayOrder = activeOrder ?? pendingOrder;
  const showBuyerOrderButton =
    isBuyerView &&
    serviceContext &&
    !pendingOrder &&
    !activeOrder &&
    !placingOrder;

  const showProviderAccept =
    isProviderView && pendingOrder && !acceptDone && pendingOrder.status === "pending";
  const showProviderStart =
    isProviderView && activeOrder?.status === "accepted";
  const showProviderComplete =
    isProviderView && activeOrder?.status === "in_progress";
  const showCancelOrder =
    displayOrder &&
    ["pending", "accepted", "in_progress"].includes(displayOrder.status);

  const hasHeaderActions =
    showBuyerOrderButton ||
    showProviderAccept ||
    showProviderStart ||
    showProviderComplete ||
    showCancelOrder;

  const buyerStatusText =
    displayOrder?.status === "pending"
      ? "Sipariş onay bekliyor"
      : displayOrder?.status === "accepted"
        ? "Sipariş kabul edildi"
        : displayOrder?.status === "in_progress"
          ? "Hizmet devam ediyor"
          : null;

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto flex flex-col">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <header className="bg-white border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
        <div className="h-16 flex items-center px-4">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-slate-100 active:scale-95 transition-all mr-2"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <img
            src={conversation.participantAvatar}
            alt={conversation.participantName}
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-on-surface truncate">{conversation.participantName}</p>
            {showProviderAccept && pendingOrder && (
              <p className="text-[10px] text-primary font-bold truncate">
                Bekleyen: {pendingOrder.service_title}
              </p>
            )}
            {isBuyerView && buyerStatusText && (
              <p className="text-[10px] text-primary font-bold">{buyerStatusText}</p>
            )}
          </div>
        </div>

        {hasHeaderActions && (
          <div className="px-4 pb-3 space-y-2">
            {showProviderAccept && (
              <TamamdirButton
                label={orderActionLoading ? "Kabul ediliyor..." : "Tamamdır! Siparişi Kabul Et"}
                onClick={() => runProviderAction("accept")}
                disabled={orderActionLoading}
                className="h-12 text-sm"
              />
            )}
            {showProviderStart && (
              <TamamdirButton
                label={orderActionLoading ? "Başlatılıyor..." : "İşe Başla"}
                onClick={() => runProviderAction("start")}
                disabled={orderActionLoading}
                className="h-12 text-sm"
              />
            )}
            {showProviderComplete && (
              <TamamdirButton
                label={orderActionLoading ? "Tamamlanıyor..." : "Siparişi Tamamla"}
                onClick={() => runProviderAction("complete")}
                disabled={orderActionLoading}
                className="h-12 text-sm"
              />
            )}
            {showBuyerOrderButton && (
              <TamamdirButton
                label={placingOrder ? "Gönderiliyor..." : "Tamamdır! Sipariş Ver"}
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="h-12 text-sm"
              />
            )}
            {showCancelOrder && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={orderActionLoading}
                className="w-full h-11 rounded-xl border border-error/30 text-error font-bold text-sm disabled:opacity-60"
              >
                {orderActionLoading ? "İptal ediliyor..." : "Siparişi İptal Et"}
              </button>
            )}
          </div>
        )}
      </header>

      <div className={`flex-1 overflow-y-auto px-4 space-y-3 ${hasHeaderActions ? "pt-[148px] pb-20" : "pt-20 pb-20"}`}>
        {serviceContext && (
          <div className="mx-auto mt-2 mb-1 max-w-[85%]">
            <p className="text-[10px] text-outline text-center mb-1.5 uppercase tracking-widest font-bold">
              İlan hakkında
            </p>
            <div className="flex items-center gap-3 bg-white border border-outline-variant/20 rounded-2xl p-3 shadow-card">
              <img
                src={serviceContext.image}
                alt={serviceContext.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-on-surface leading-tight line-clamp-2">
                  {serviceContext.title}
                </p>
                <p className="text-primary font-bold text-sm mt-0.5">{serviceContext.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 mb-1">
              <div className="flex-1 h-px bg-outline-variant/20" />
              <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Mesajlar</p>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>
          </div>
        )}

        {acceptDone && (
          <div className="flex justify-center my-2">
            <div className="bg-primary/10 text-primary text-sm font-bold px-4 py-3 rounded-xl border border-primary/20 flex items-center gap-2">
              <span className="material-symbols-outlined fill-icon text-base">check_circle</span>
              Sipariş kabul edildi — Tamamdır!
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "bg-primary text-on-primary rounded-br-sm"
                    : "bg-white text-on-surface rounded-bl-sm shadow-card"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-emerald-100" : "text-outline"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2 max-w-md mx-auto z-50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border-none"
          placeholder="Mesaj yaz..."
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-btn-primary active:scale-90 transition-all disabled:opacity-40"
        >
          <span className="material-symbols-outlined fill-icon text-sm">send</span>
        </button>
      </div>
    </div>
  );
}
