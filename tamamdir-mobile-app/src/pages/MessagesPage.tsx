import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ProfileMenuDropdown from "../components/ProfileMenuDropdown";
import BottomNav from "../components/BottomNav";
import ChatView from "./ChatView";
import type { Conversation } from "../data/types";
import api from "../lib/api";

type ServiceContext = { id: string; title: string; price: string; image: string; providerId?: string };

function saveServiceContext(convId: string, ctx: ServiceContext) {
  try {
    const all = JSON.parse(localStorage.getItem("conv_service_ctx") ?? "{}");
    all[convId] = ctx;
    localStorage.setItem("conv_service_ctx", JSON.stringify(all));
  } catch {}
}

function loadServiceContext(convId: string): ServiceContext | null {
  try {
    const all = JSON.parse(localStorage.getItem("conv_service_ctx") ?? "{}");
    return all[convId] ?? null;
  } catch { return null; }
}

export default function MessagesPage() {
  const location = useLocation();
  const locationState = (location.state as any) ?? {};
  const [search, setSearch] = useState("");

  const [activeChat, setActiveChat] = useState<Conversation | null>(
    locationState.openConversation ?? null
  );
  const [activeChatService, setActiveChatService] = useState<ServiceContext | null>(() => {
    if (locationState.serviceContext && locationState.openConversation?.id) {
      saveServiceContext(locationState.openConversation.id, locationState.serviceContext);
      return locationState.serviceContext;
    }
    return null;
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    api.get('/api/messages/conversations')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setConversations(list.map((c: any) => ({
          id: c.id,
          participantId: c.other_id ?? "",
          participantName: c.other_name ?? "",
          participantAvatar: c.other_avatar ?? "",
          lastMessage: c.last_message ?? "",
          lastTime: (c.last_msg_at ?? c.last_message_at)
            ? new Date(c.last_msg_at ?? c.last_message_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
            : "",
          unread: (c.unread_count ?? 0) > 0,
          messages: [],
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const convId = locationState.openConversationId as string | undefined;
    if (!convId || conversations.length === 0) return;
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setActiveChat(conv);
      setActiveChatService(loadServiceContext(convId));
    }
  }, [locationState.openConversationId, conversations]);

  if (activeChat) {
    return (
      <ChatView
        conversation={activeChat}
        serviceContext={activeChatService ?? undefined}
        onBack={() => { setActiveChat(null); setActiveChatService(null); }}
      />
    );
  }

  const filtered = conversations.filter(
    (c) =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="font-bold text-xl text-on-surface">Konuşmalar</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">Hizmet taleplerinizden haberdar olun</p>
        </div>

        {/* Search */}
        <div className="relative mb-lg">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary/30 transition-all outline-none"
            placeholder="Konuşma ara..."
          />
        </div>

        {/* Conversation List */}
        <div className="flex flex-col gap-base">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => { setActiveChat(conv); setActiveChatService(loadServiceContext(conv.id)); }}
              className="flex items-center gap-md p-md bg-surface-container-lowest rounded-xl shadow-card hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98] duration-150"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={conv.participantAvatar}
                  alt={conv.participantName}
                  className={`w-14 h-14 rounded-full object-cover ${conv.unread ? "border-2 border-primary-container" : ""}`}
                />
                {conv.unread && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-container border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-sm text-on-surface truncate">{conv.participantName}</h3>
                  <span className={`text-[10px] font-bold ${conv.unread ? "text-primary-container" : "text-on-surface-variant"}`}>
                    {conv.lastTime}
                  </span>
                </div>
                <p className={`text-xs truncate ${conv.unread ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread && (
                <div className="w-2.5 h-2.5 bg-primary-container rounded-full flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </main>

      {/* FAB */}
      <button
        className="fixed right-4 bottom-24 w-14 h-14 bg-gradient-to-br from-primary-container to-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined fill-icon">edit_square</span>
      </button>

      <BottomNav />
    </div>
  );
}
