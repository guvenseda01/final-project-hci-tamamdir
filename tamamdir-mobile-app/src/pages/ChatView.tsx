import { useState, useRef, useEffect } from "react";
import type { Conversation, Message } from "../data/types";
import { CURRENT_USER } from "../data/mockData";

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text,
      senderId: CURRENT_USER.id,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16 flex items-center px-4 max-w-md mx-auto">
        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-slate-100 active:scale-95 transition-all mr-2">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <img src={conversation.participantAvatar} alt={conversation.participantName} className="w-8 h-8 rounded-full object-cover mr-2" />
        <div className="flex-1">
          <p className="font-bold text-sm text-on-surface">{conversation.participantName}</p>
          <p className="text-[10px] text-primary-container font-bold">Çevrimiçi</p>
        </div>
      </header>

      <div className="flex-1 pt-20 pb-20 overflow-y-auto px-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-on-primary rounded-br-sm" : "bg-white text-on-surface rounded-bl-sm shadow-card"}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-emerald-100" : "text-outline"}`}>{msg.timestamp}</p>
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
