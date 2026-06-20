import { useState } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import ChatView from "./ChatView";
import type { Conversation } from "../data/types";

const CONVERSATIONS: Conversation[] = [];

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  if (activeChat) {
    return <ChatView conversation={activeChat} onBack={() => setActiveChat(null)} />;
  }

  const filtered = CONVERSATIONS.filter(
    (c) =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar
        rightContent={
          <div className="flex gap-1">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-500">notifications</span>
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-500">settings</span>
            </button>
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
              onClick={() => setActiveChat(conv)}
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
