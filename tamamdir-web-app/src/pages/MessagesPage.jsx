import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Send, Image, Plus, MoreVertical, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import Navbar from '../components/Navbar'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function formatMsgTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatConvTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const requestedConvId = searchParams.get('conv')

  const [convs, setConvs] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [pendingOrder, setPendingOrder] = useState(null)
  const [tamamdirDone, setTamamdirDone] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConv = useCallback(async (conv) => {
    setActiveConv(conv)
    setMessages([])
    setTamamdirDone(false)
    setPendingOrder(null)
    setLoadingMsgs(true)

    try {
      const [msgs, orders] = await Promise.all([
        api.get(`/api/messages/conversations/${conv.id}`),
        api.get('/api/orders?role=provider&status=pending').catch(() => []),
      ])
      setMessages(msgs)
      const match = Array.isArray(orders)
        ? orders.find(o => o.buyer_id === conv.other_id)
        : null
      setPendingOrder(match ?? null)
    } catch {
      // non-fatal: conversation stays open with empty messages
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  // Fetch conversation list on mount; honour ?conv= param from ServiceDetailPage
  useEffect(() => {
    setLoadingConvs(true)
    api.get('/api/messages/conversations')
      .then(data => {
        setConvs(data)
        if (data.length === 0) return
        const target = requestedConvId
          ? data.find(c => c.id === requestedConvId) ?? data[0]
          : data[0]
        selectConv(target)
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false))
  }, [selectConv, requestedConvId])

  const handleSend = async () => {
    if (!message.trim() || !activeConv || sending) return
    const text = message.trim()
    setMessage('')
    setSending(true)
    try {
      const msg = await api.post(`/api/messages/conversations/${activeConv.id}`, { content: text })
      setMessages(prev => [...prev, msg])
      setConvs(prev => prev.map(c =>
        c.id === activeConv.id ? { ...c, last_message: text, last_msg_at: msg.created_at } : c
      ))
    } catch {
      setMessage(text)  // restore on failure
    } finally {
      setSending(false)
    }
  }

  const handleTamamdir = async () => {
    if (!pendingOrder || accepting) return
    setAccepting(true)
    try {
      await api.patch(`/api/orders/${pendingOrder.id}/accept`)
      setTamamdirDone(true)
      setPendingOrder(null)
    } catch {
      // keep button visible so user can retry
    } finally {
      setAccepting(false)
    }
  }

  if (loadingConvs) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Conversation list ── */}
        <div className="w-80 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-5 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Chats</h2>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10 px-4">No conversations yet.</p>
            )}
            {convs.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv)}
                className={cn(
                  'w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50',
                  activeConv?.id === conv.id && 'bg-green-pale border-l-2 border-l-green-primary'
                )}
              >
                <div className="relative shrink-0">
                  {conv.other_avatar
                    ? <img src={conv.other_avatar} alt={conv.other_name} className="w-11 h-11 rounded-full object-cover" />
                    : (
                      <div className="w-11 h-11 rounded-full bg-green-pale flex items-center justify-center">
                        <span className="text-green-primary font-bold text-sm">{conv.other_name?.[0] ?? '?'}</span>
                      </div>
                    )
                  }
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-light rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{conv.other_name}</p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatConvTime(conv.last_msg_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{conv.last_message || 'No messages yet'}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 bg-green-primary text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat window ── */}
        {activeConv ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeConv.other_avatar
                    ? <img src={activeConv.other_avatar} alt={activeConv.other_name} className="w-10 h-10 rounded-full object-cover" />
                    : (
                      <div className="w-10 h-10 rounded-full bg-green-pale flex items-center justify-center">
                        <span className="text-green-primary font-bold text-sm">{activeConv.other_name?.[0] ?? '?'}</span>
                      </div>
                    )
                  }
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-light rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activeConv.other_name}</p>
                  {pendingOrder && (
                    <p className="text-xs text-green-primary font-medium">
                      Pending: <span className="font-semibold">{pendingOrder.service_title}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {tamamdirDone ? (
                  <div className="flex items-center gap-2 bg-green-pale text-green-primary text-sm font-semibold px-4 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    Order Accepted!
                  </div>
                ) : pendingOrder && (
                  <button
                    onClick={handleTamamdir}
                    disabled={accepting}
                    className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-green-dark transition-all duration-200 hover:scale-105 active:scale-95 shadow-md disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {accepting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    Tamamdır! Accept Order
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/30">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-green-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                      TODAY
                    </span>
                  </div>

                  {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm pt-8">
                      No messages yet. Say hello!
                    </p>
                  )}

                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id
                    return (
                      <div key={msg.id} className={cn('flex items-end gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMe && (
                          activeConv.other_avatar
                            ? <img src={activeConv.other_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1" />
                            : (
                              <div className="w-8 h-8 rounded-full bg-green-pale flex items-center justify-center shrink-0 mb-1">
                                <span className="text-green-primary text-xs font-bold">{activeConv.other_name?.[0] ?? '?'}</span>
                              </div>
                            )
                        )}

                        <div className={cn(
                          'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed',
                          isMe
                            ? 'bg-green-primary text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                        )}>
                          {msg.content}
                          <div className={cn('text-xs mt-1', isMe ? 'text-green-light text-right' : 'text-gray-400')}>
                            {formatMsgTime(msg.created_at)}
                          </div>
                        </div>

                        {isMe && (
                          user?.avatar_url
                            ? <img src={user.avatar_url} alt="Me" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1" />
                            : (
                              <div className="w-8 h-8 rounded-full bg-green-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
                                {user?.full_name?.[0] ?? 'ME'}
                              </div>
                            )
                        )}
                      </div>
                    )
                  })}

                  {tamamdirDone && (
                    <div className="flex justify-center">
                      <div className="bg-green-pale text-green-primary text-sm font-semibold px-6 py-3 rounded-xl border border-green-light flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Order accepted — Tamamdır! 🎉
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
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
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
                    className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="w-10 h-10 bg-green-primary rounded-xl flex items-center justify-center hover:bg-green-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/30">
            <p className="text-gray-400 text-sm">Select a conversation to start messaging.</p>
          </div>
        )}

      </div>
    </div>
  )
}
