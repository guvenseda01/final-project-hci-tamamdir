import { useState } from 'react'
import {
  CheckCircle2, Send, Image, Plus, MoreVertical,
} from 'lucide-react'
import { conversations } from '../data/mockData'
import { cn } from '../lib/utils'
import Navbar from '../components/Navbar'

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState(conversations[0])
  const [message, setMessage] = useState('')
  const [tamamdirDone, setTamamdirDone] = useState(false)
  const [messages, setMessages] = useState(activeConv.messages)

  const handleSend = () => {
    if (!message.trim()) return
    setMessages([...messages, { id: Date.now(), from: 'me', text: message, time: 'Now' }])
    setMessage('')
  }

  const handleConvSelect = (conv) => {
    setActiveConv(conv)
    setMessages(conv.messages)
    setTamamdirDone(false)
  }

  const handleTamamdir = () => setTamamdirDone(true)

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

      {/* Chat list */}
      <div className="w-80 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Chats</h2>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleConvSelect(conv)}
              className={cn(
                'w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50',
                activeConv.id === conv.id && 'bg-green-pale border-l-2 border-l-green-primary'
              )}
            >
              <div className="relative shrink-0">
                <img src={conv.avatar} alt={conv.participant} className="w-11 h-11 rounded-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-light rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-sm text-gray-900 truncate">{conv.participant}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{conv.time}</span>
                </div>
                <p className="text-xs text-green-primary font-medium mb-0.5">{conv.service} • Discussion</p>
                <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-green-primary text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={activeConv.avatar} alt={activeConv.participant} className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-light rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{activeConv.participant}</p>
                {activeConv.isVerified && (
                  <span className="text-xs bg-green-pale text-green-primary font-semibold px-2 py-0.5 rounded-full">
                    VERIFIED STUDENT
                  </span>
                )}
              </div>
              <p className="text-xs text-green-primary font-medium">
                Service: <span className="font-semibold">{activeConv.service}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tamamdirDone ? (
              <div className="flex items-center gap-2 bg-green-pale text-green-primary text-sm font-semibold px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Service Confirmed!
              </div>
            ) : (
              <button
                onClick={handleTamamdir}
                className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-green-dark transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Tamamdır! Confirm Service
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/30">
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">TODAY</span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex items-end gap-3', msg.from === 'me' ? 'flex-row-reverse' : 'flex-row')}
            >
              {msg.from === 'them' && (
                <img
                  src={activeConv.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0 mb-1"
                />
              )}
              <div
                className={cn(
                  'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.from === 'me'
                    ? 'bg-green-primary text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                )}
              >
                {msg.text}
                <div className={cn('text-xs mt-1', msg.from === 'me' ? 'text-green-light text-right' : 'text-gray-400')}>
                  {msg.time}{msg.from === 'me' && ' • Read'}
                </div>
              </div>
              {msg.from === 'me' && (
                <div className="w-8 h-8 rounded-full bg-green-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
                  ME
                </div>
              )}
            </div>
          ))}

          {tamamdirDone && (
            <div className="flex justify-center">
              <div className="bg-green-pale text-green-primary text-sm font-semibold px-6 py-3 rounded-xl border border-green-light flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Service confirmed — Tamamdır! 🎉
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Image className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
              />
            </div>
            <button
              onClick={handleSend}
              className="w-10 h-10 bg-green-primary rounded-xl flex items-center justify-center hover:bg-green-dark transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  )
}
