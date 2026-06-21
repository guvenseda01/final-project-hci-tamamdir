import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ProfileMenuDropdown from "../components/ProfileMenuDropdown";
import BottomNav from "../components/BottomNav";
import UserAvatar from "../components/UserAvatar";
import ChatView, { type ChatConversationMeta } from "./ChatView";
import { usePreferences } from "../context/PreferencesContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import api from "../lib/api";

type RoleFilter = "all" | "provider" | "customer";

type ConversationListItem = ChatConversationMeta & {
  lastMessage: string;
  lastTime: string;
  lastMsgAt?: string;
  unread: boolean;
  my_role?: string;
};

function mapConversation(c: Record<string, unknown>, locale: string): ConversationListItem {
  const lastAt = (c.last_msg_at ?? c.last_message_at) as string | undefined;
  return {
    id: String(c.id),
    participantId: String(c.other_id ?? ""),
    participantName: String(c.other_name ?? ""),
    participantAvatar: (c.other_avatar as string | null) ?? null,
    service_id: (c.service_id as string) ?? null,
    service_title: (c.service_title as string) ?? null,
    service_price: c.service_price != null ? Number(c.service_price) : null,
    service_price_unit: (c.service_price_unit as string) ?? null,
    lastMessage: String(c.last_message ?? ""),
    lastTime: lastAt
      ? new Date(lastAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
      : "",
    lastMsgAt: lastAt,
    unread: Number(c.unread_count ?? 0) > 0,
    my_role: (c.my_role as string) ?? undefined,
  };
}

export default function MessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, preferences } = usePreferences();
  const locationState = (location.state as Record<string, unknown>) ?? {};
  const pendingDeepLinkRef = useRef<string | null>(null);
  const pendingServiceIdRef = useRef<string | null>(null);
  const deepLinkConsumedRef = useRef(false);

  const locale =
    preferences.language === "tr"
      ? "tr-TR"
      : preferences.language === "de"
        ? "de-DE"
        : preferences.language === "es"
          ? "es-ES"
          : "en-US";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<ChatConversationMeta | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/messages/conversations");
      const list = Array.isArray(data) ? data : [];
      setConversations(list.map((c) => mapConversation(c, locale)));
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const convObj = locationState.openConversation as ChatConversationMeta | undefined;
    const convId =
      (locationState.openConversationId as string | undefined) ?? convObj?.id;
    const serviceIdFromNav =
      (locationState.serviceId as string | undefined) ??
      convObj?.service_id ??
      null;

    if (!convId || deepLinkConsumedRef.current) return;

    if (convObj) {
      setActiveChat(convObj);
      setActiveServiceId(serviceIdFromNav ?? convObj.service_id ?? null);
      deepLinkConsumedRef.current = true;
      navigate("/messages", { replace: true, state: {} });
      return;
    }

    pendingDeepLinkRef.current = convId;
    pendingServiceIdRef.current = serviceIdFromNav;
    navigate("/messages", { replace: true, state: {} });
  }, [locationState.openConversation, locationState.openConversationId, locationState.serviceId, navigate]);

  useEffect(() => {
    const convId = pendingDeepLinkRef.current;
    if (!convId || conversations.length === 0 || deepLinkConsumedRef.current) return;
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setActiveChat(conv);
      setActiveServiceId(pendingServiceIdRef.current ?? conv.service_id ?? null);
      pendingDeepLinkRef.current = null;
      pendingServiceIdRef.current = null;
      deepLinkConsumedRef.current = true;
    }
  }, [conversations]);

  useEffect(() => {
    if (!activeChat) {
      deepLinkConsumedRef.current = false;
    }
  }, [activeChat]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const onConvUpdated = ({
      id,
      last_message,
      last_msg_at,
    }: {
      id: string;
      last_message: string;
      last_msg_at: string;
    }) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === id
            ? {
                ...c,
                lastMessage: last_message,
                lastTime: last_msg_at
                  ? new Date(last_msg_at).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : c.lastTime,
                unread: activeChat?.id === id ? false : true,
                lastMsgAt: last_msg_at ?? c.lastMsgAt,
              }
            : c
        );
        return [...next].sort(
          (a, b) =>
            new Date(b.lastMsgAt ?? 0).getTime() - new Date(a.lastMsgAt ?? 0).getTime()
        );
      });
    };

    const onNewMessage = (msg: { conversation_id: string; content: string; created_at: string }) => {
      onConvUpdated({
        id: msg.conversation_id,
        last_message: msg.content,
        last_msg_at: msg.created_at,
      });
    };

    socket.on("conversation:updated", onConvUpdated);
    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("conversation:updated", onConvUpdated);
      socket.off("message:new", onNewMessage);
    };
  }, [user?.id, locale, activeChat?.id]);

  const filteredByRole =
    roleFilter === "all"
      ? conversations
      : conversations.filter((c) => c.my_role === roleFilter);

  const filtered = filteredByRole.filter(
    (c) =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()) ||
      (c.service_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (activeChat) {
    return (
      <ChatView
        conversation={activeChat}
        initialServiceId={activeServiceId ?? activeChat.service_id}
        onBack={() => {
          setActiveChat(null);
          setActiveServiceId(null);
          pendingDeepLinkRef.current = null;
          pendingServiceIdRef.current = null;
          deepLinkConsumedRef.current = false;
          navigate("/messages", { replace: true, state: {} });
          loadConversations();
        }}
        onListRefresh={loadConversations}
      />
    );
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar
        rightContent={
          <div className="flex items-center gap-1">
            <NotificationsDropdown />
            <ProfileMenuDropdown />
          </div>
        }
      />

      <main className="pt-20 px-gutter pb-24 max-w-md mx-auto">
        <div className="mb-gutter">
          <h2 className="font-bold text-xl text-on-surface">{t("messages.title")}</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">{t("messages.sub")}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-md">
          {(
            [
              { id: "all" as const, label: "Tümü" },
              { id: "provider" as const, label: "Sağlayıcı" },
              { id: "customer" as const, label: "Müşteri" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRoleFilter(opt.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                roleFilter === opt.id
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative mb-lg">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary/30 transition-all outline-none"
            placeholder={t("messages.searchPlaceholder")}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">
              progress_activity
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-outline text-sm py-8">Henüz sohbet yok.</p>
        ) : (
          <div className="flex flex-col gap-base">
            {filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveChat(conv);
                  setActiveServiceId(conv.service_id ?? null);
                }}
                className="flex items-center gap-md p-md bg-surface-container-lowest rounded-xl shadow-card hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98] duration-150"
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    src={conv.participantAvatar}
                    userId={conv.participantId}
                    name={conv.participantName}
                    alt={conv.participantName}
                    className={`w-14 h-14 rounded-full object-cover ${
                      conv.unread ? "border-2 border-primary-container" : ""
                    }`}
                  />
                  {conv.unread && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-container border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {conv.service_title && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-1 truncate max-w-full">
                      {conv.service_title}
                    </span>
                  )}
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-sm text-on-surface truncate">
                      {conv.participantName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold ${
                        conv.unread ? "text-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      {conv.lastTime}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate ${
                      conv.unread ? "text-on-surface font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {conv.lastMessage || "Henüz mesaj yok"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
