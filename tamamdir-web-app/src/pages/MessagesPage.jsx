import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Send, Image, Plus, MoreVertical, Loader2, CheckCircle2, Ban, Flag } from 'lucide-react'
import { cn, formatPrice, resolveMediaUrl } from '../lib/utils'
import TamamdirLogo from '../components/TamamdirLogo'
import api from '../lib/api'
import { getSocket, joinConversation, leaveConversation, disconnectSocket } from '../lib/socket'
import LeaveFeedbackModal from '../components/LeaveFeedbackModal'
import FeedbackThanksPopup from '../components/FeedbackThanksPopup'
import ReportModal from '../components/ReportModal'
import { useAuth } from '../context/AuthContext'

function formatMsgTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatBanUntil(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const chatPanelHeaderClass = 'px-5 py-5 border-b border-amber-200 bg-amber-100'
const coffeeText = 'text-coffee'

function mergeTamamdirStatus(prev, payload, userId, otherId) {
  const ids = payload.confirmed_user_ids ?? []
  const bothConfirmed = payload.both_confirmed ?? false
  const orderId = bothConfirmed ? (payload.order_id ?? null) : null
  const myReviewSubmitted = bothConfirmed ? (payload.my_review_submitted ?? false) : false

  return {
    service_id: payload.service_id ?? prev?.service_id,
    service_title: payload.service_title ?? prev?.service_title,
    my_confirmed: payload.my_confirmed ?? ids.includes(userId),
    other_confirmed: payload.other_confirmed ?? (otherId ? ids.includes(otherId) : ids.length >= 2),
    both_confirmed: bothConfirmed,
    order_id: orderId,
    order_status: bothConfirmed ? (payload.order_status ?? prev?.order_status ?? null) : null,
    cancel_count: payload.cancel_count ?? prev?.cancel_count ?? 0,
    customer_cancel_count: payload.customer_cancel_count ?? prev?.customer_cancel_count ?? 0,
    provider_cancel_count: payload.provider_cancel_count ?? prev?.provider_cancel_count ?? 0,
    cancel_limit: payload.cancel_limit ?? 2,
    is_customer: payload.is_customer ?? prev?.is_customer,
    my_cancel_count: payload.my_cancel_count ?? prev?.my_cancel_count ?? 0,
    my_cancels_remaining: payload.my_cancels_remaining ?? prev?.my_cancels_remaining,
    will_be_banned_if_cancel: payload.will_be_banned_if_cancel ?? false,
    is_banned: payload.is_banned ?? false,
    banned_until: payload.banned_until ?? null,
    banned_user_id: payload.banned_user_id ?? null,
    i_am_banned: payload.i_am_banned ?? false,
    can_unban: payload.can_unban ?? false,
    buyer_id: payload.buyer_id ?? prev?.buyer_id,
    provider_id: payload.provider_id ?? prev?.provider_id,
    my_review_submitted: myReviewSubmitted,
    other_review_submitted: bothConfirmed
      ? (payload.other_review_submitted ?? prev?.other_review_submitted ?? false)
      : false,
    can_leave_review: bothConfirmed && orderId && !myReviewSubmitted,
    both_reviews_submitted: payload.both_reviews_submitted ?? false,
    my_existing_review: payload.my_existing_review ?? null,
  }
}

function needsFeedbackPrompt(status) {
  return status?.both_confirmed && status?.order_id && !status?.my_review_submitted
}

function getCancelModalCopy(tamamdirStatus) {
  if (!tamamdirStatus?.is_customer) {
    return {
      body: 'Are you sure you want to cancel this service arrangement?',
      note: 'Providers are not banned for cancelling. The customer may leave a review reflecting their experience.',
    }
  }

  const used = tamamdirStatus.customer_cancel_count ?? 0
  const limit = tamamdirStatus.cancel_limit ?? 2

  if (tamamdirStatus.will_be_banned_if_cancel) {
    return {
      body: 'Are you sure you want to cancel this service arrangement?',
      note: `Customers can cancel up to ${limit} times (${used}/${limit} used). This is your final cancellation — you will be banned from this service for 1 week.`,
    }
  }

  const leftAfter = Math.max(0, (tamamdirStatus.my_cancels_remaining ?? limit - used) - 1)
  return {
    body: 'Are you sure you want to cancel this service arrangement?',
    note: `Customers can cancel up to ${limit} times (${used}/${limit} used). After this cancellation you will have ${leftAfter} cancellation(s) left before a 1-week ban.`,
  }
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
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedConvId = searchParams.get('conv')
  const requestedServiceId = searchParams.get('service')

  const [convs, setConvs] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [activeServiceId, setActiveServiceId] = useState(null)
  const [activeService, setActiveService] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [tamamdirStatus, setTamamdirStatus] = useState(null)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [tamamdirSubmitting, setTamamdirSubmitting] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [unbanSubmitting, setUnbanSubmitting] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    setShowChatMenu(false)
    setShowReportModal(false)
  }, [activeConv?.id])
  const messagesEndRef = useRef(null)
  const activeConvIdRef = useRef(null)
  const prevConvIdRef = useRef(null)
  const activeServiceIdRef = useRef(null)
  const activeConvRef = useRef(null)
  const initialUrlHandledRef = useRef(false)

  activeConvIdRef.current = activeConv?.id ?? null
  activeServiceIdRef.current = activeServiceId
  activeConvRef.current = activeConv

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchTamamdirStatus = useCallback(async (convId, serviceId, otherId) => {
    if (!convId || !serviceId) {
      setTamamdirStatus(null)
      return
    }
    try {
      const status = await api.get(
        `/api/messages/conversations/${convId}/tamamdir?service_id=${serviceId}`
      )
      setTamamdirStatus(prev =>
        mergeTamamdirStatus(prev, status, user?.id, otherId ?? activeConvRef.current?.other_id)
      )
    } catch {
      setTamamdirStatus(null)
    }
  }, [user?.id])

  const fetchAllConversations = useCallback(async () => {
    return api.get('/api/messages/conversations')
  }, [])

  const filterConversationsByRole = useCallback((list, role) => {
    if (!role || role === 'all') return list
    return list.filter(c => c.my_role === role)
  }, [])

  const openConversationForService = useCallback(async (serviceId, knownConvs = []) => {
    const existing = knownConvs.find(c => c.service_id === serviceId)
    if (existing) return existing

    const service = await api.get(`/api/services/${serviceId}`)
    if (!service) return null

    if (service.provider_id === user?.id) {
      const all = knownConvs.length ? knownConvs : await fetchAllConversations()
      return all.find(c => c.service_id === serviceId) ?? null
    }

    return api.post('/api/messages/conversations', {
      recipient_id: service.provider_id,
      service_id: serviceId,
    })
  }, [user?.id, fetchAllConversations])

  const selectConv = useCallback(async (conv, serviceIdOverride) => {
    const convId = conv.id
    activeConvIdRef.current = convId
    setActiveConv(conv)
    setMessages([])
    setTamamdirStatus(null)
    setShowCancelConfirm(false)
    setShowFeedbackModal(false)
    setShowFeedbackThanks(false)
    setActiveService(null)

    const serviceId = conv.service_id ?? serviceIdOverride ?? null
    setActiveServiceId(serviceId)
    activeServiceIdRef.current = serviceId
    setLoadingMsgs(true)

    try {
      const msgs = await api.get(`/api/messages/conversations/${convId}`)
      if (activeConvIdRef.current !== convId) return
      setMessages(msgs)

      let resolvedServiceId = serviceId

      if (!resolvedServiceId && !serviceIdOverride) {
        const ctx = await api.get(
          `/api/messages/conversations/${convId}/service-context`
        )
        if (activeConvIdRef.current !== convId) return
        if (ctx?.service_id) {
          resolvedServiceId = ctx.service_id
          setActiveServiceId(ctx.service_id)
          activeServiceIdRef.current = ctx.service_id
        }
      }

      if (resolvedServiceId) {
        await fetchTamamdirStatus(convId, resolvedServiceId, conv.other_id)
      }
    } catch {
      if (activeConvIdRef.current === convId && serviceIdOverride) {
        setActiveServiceId(serviceIdOverride)
      }
    } finally {
      if (activeConvIdRef.current === convId) {
        setLoadingMsgs(false)
      }
    }
  }, [fetchTamamdirStatus])

  const handleSelectConv = (conv) => {
    const params = { conv: conv.id }
    if (conv.service_id) params.service = conv.service_id
    setSearchParams(params)
    selectConv(conv)
  }

  const handleSelectConvFromList = (convId) => {
    const conv = convs.find(c => c.id === convId)
    if (conv) handleSelectConv(conv)
  }

  useEffect(() => {
    if (requestedServiceId && !activeConv) {
      setActiveServiceId(requestedServiceId)
    }
  }, [requestedServiceId, activeConv?.id])

  useEffect(() => {
    if (!activeServiceId) {
      setActiveService(null)
      return
    }
    let cancelled = false
    api.get(`/api/services/${activeServiceId}`)
      .then(data => { if (!cancelled) setActiveService(data) })
      .catch(() => { if (!cancelled) setActiveService(null) })
    return () => { cancelled = true }
  }, [activeServiceId])

  useEffect(() => {
    let cancelled = false
    setLoadingConvs(true)

    const load = async () => {
      try {
        const all = await fetchAllConversations()
        if (cancelled) return

        let data = filterConversationsByRole(all, roleFilter)

        if (requestedServiceId && !all.some(c => c.service_id === requestedServiceId) && user) {
          const created = await openConversationForService(requestedServiceId, all)
          if (cancelled) return
          if (created) {
            const merged = [created, ...all.filter(c => c.id !== created.id)]
            data = filterConversationsByRole(merged, roleFilter)
            if (!data.some(c => c.id === created.id)) {
              data = [created, ...data]
            }
          }
        }

        setConvs(data)

        if (data.length === 0) {
          setActiveConv(null)
          setMessages([])
          return
        }

        if (!initialUrlHandledRef.current && (requestedConvId || requestedServiceId)) {
          initialUrlHandledRef.current = true

          let target = null
          if (requestedServiceId) {
            target = all.find(c => c.service_id === requestedServiceId)
          }
          if (!target && requestedConvId) {
            const byConv = all.find(c => c.id === requestedConvId)
            if (byConv && (!requestedServiceId || byConv.service_id === requestedServiceId)) {
              target = byConv
            }
          }
          if (!target && requestedServiceId) {
            target = await openConversationForService(requestedServiceId, all)
          }

          if (target) {
            const params = { conv: target.id }
            if (target.service_id) params.service = target.service_id
            setSearchParams(params)
            selectConv(target, target.service_id ?? requestedServiceId)
            return
          }

          if (requestedServiceId) {
            setActiveConv(null)
            setMessages([])
            return
          }
        }

        if (activeConvIdRef.current) {
          const current = data.find(c => c.id === activeConvIdRef.current)
          if (current) {
            setActiveConv(current)
            return
          }
        }

        const first = data[0]
        const params = { conv: first.id }
        if (first.service_id) params.service = first.service_id
        setSearchParams(params)
        selectConv(first)
      } catch {
        if (!cancelled) setConvs([])
      } finally {
        if (!cancelled) setLoadingConvs(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [
    roleFilter,
    fetchAllConversations,
    filterConversationsByRole,
    openConversationForService,
    selectConv,
    requestedConvId,
    requestedServiceId,
    user,
    setSearchParams,
  ])

  // Real-time: join active conversation room
  useEffect(() => {
    if (!activeConv?.id) return
    if (prevConvIdRef.current && prevConvIdRef.current !== activeConv.id) {
      leaveConversation(prevConvIdRef.current)
    }
    joinConversation(activeConv.id)
    prevConvIdRef.current = activeConv.id
    setConvs(prev => prev.map(c =>
      c.id === activeConv.id ? { ...c, unread_count: 0 } : c
    ))
  }, [activeConv?.id])

  // Real-time: socket listeners
  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return

    const onNewMessage = (msg) => {
      if (msg.conversation_id === activeConvIdRef.current) {
        setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
      }
      setConvs(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? {
              ...c,
              last_message: msg.content,
              last_msg_at: msg.created_at,
              unread_count: msg.conversation_id === activeConvIdRef.current ? 0 : c.unread_count,
            }
          : c
      ))
    }

    const onConvUpdated = ({ id, last_message, last_msg_at }) => {
      const isActive = id === activeConvIdRef.current
      setConvs(prev => {
        const next = prev.map(c =>
          c.id === id
            ? {
                ...c,
                last_message,
                last_msg_at,
                unread_count: isActive ? 0 : (c.unread_count ?? 0) + 1,
              }
            : c
        )
        return [...next].sort(
          (a, b) => new Date(b.last_msg_at ?? 0) - new Date(a.last_msg_at ?? 0)
        )
      })
    }

    const onTamamdirUpdate = (payload) => {
      if (payload.conversation_id && payload.conversation_id !== activeConvIdRef.current) return
      if (
        payload.service_id &&
        activeConvRef.current?.service_id &&
        payload.service_id !== activeConvRef.current.service_id
      ) {
        return
      }

      if (payload.service_id && payload.service_id !== activeServiceIdRef.current) {
        setActiveServiceId(payload.service_id)
        activeServiceIdRef.current = payload.service_id
      }

      setTamamdirStatus(prev =>
        mergeTamamdirStatus(prev, payload, user?.id, activeConvRef.current?.other_id)
      )
      if (!payload.both_confirmed) setShowCancelConfirm(false)
    }

    socket.on('message:new', onNewMessage)
    socket.on('conversation:updated', onConvUpdated)
    socket.on('tamamdir:update', onTamamdirUpdate)

    return () => {
      socket.off('message:new', onNewMessage)
      socket.off('conversation:updated', onConvUpdated)
      socket.off('tamamdir:update', onTamamdirUpdate)
      if (prevConvIdRef.current) leaveConversation(prevConvIdRef.current)
    }
  }, [user?.id])

  const handleSend = async () => {
    if (!message.trim() || !activeConv || sending || tamamdirStatus?.i_am_banned) return
    const text = message.trim()
    setMessage('')
    setSending(true)
    try {
      const msg = await api.post(`/api/messages/conversations/${activeConv.id}`, { content: text })
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
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
    if (!activeConv || !activeServiceId || tamamdirSubmitting) return
    if (tamamdirStatus?.my_confirmed || tamamdirStatus?.both_confirmed) return

    setTamamdirSubmitting(true)
    try {
      const status = await api.post(
        `/api/messages/conversations/${activeConv.id}/tamamdir`,
        { service_id: activeServiceId }
      )
      if (status.service_id && status.service_id !== activeServiceId) {
        setActiveServiceId(status.service_id)
        activeServiceIdRef.current = status.service_id
      }
      setTamamdirStatus(prev => mergeTamamdirStatus(prev, status, user?.id, activeConv?.other_id))
      if (status.both_confirmed && activeConv?.id && activeServiceId) {
        await fetchTamamdirStatus(activeConv.id, activeServiceId, activeConv?.other_id)
      }
    } catch (err) {
      if (err.status === 403 && err.data) {
        setTamamdirStatus(prev => mergeTamamdirStatus(prev, err.data, user?.id, activeConv?.other_id))
      }
    } finally {
      setTamamdirSubmitting(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!activeConv || !activeServiceId || cancelSubmitting) return

    setCancelSubmitting(true)
    try {
      const status = await api.post(
        `/api/messages/conversations/${activeConv.id}/tamamdir/cancel`,
        { service_id: activeServiceId }
      )
      setTamamdirStatus(prev => mergeTamamdirStatus(prev, status, user?.id, activeConv?.other_id))
      setShowCancelConfirm(false)
    } catch {
      // keep modal open so user can retry
    } finally {
      setCancelSubmitting(false)
    }
  }

  const handleUnban = async () => {
    if (!activeConv || !activeServiceId || unbanSubmitting) return

    setUnbanSubmitting(true)
    try {
      const status = await api.post(
        `/api/messages/conversations/${activeConv.id}/tamamdir/unban`,
        { service_id: activeServiceId }
      )
      setTamamdirStatus(prev => mergeTamamdirStatus(prev, status, user?.id, activeConv?.other_id))
    } catch {
      // non-fatal
    } finally {
      setUnbanSubmitting(false)
    }
  }

  const cancelModalCopy = getCancelModalCopy(tamamdirStatus)

  const serviceCover = activeService?.images?.find(i => i.is_cover)?.image_url
    ?? activeService?.images?.[0]?.image_url
    ?? null
  const isServiceProvider = activeService?.provider_id === user?.id

  const renderTamamdirAction = () => {
    if (!activeServiceId) return null

    if (tamamdirStatus?.is_banned && tamamdirStatus?.can_unban) {
      return (
        <button
          onClick={handleUnban}
          disabled={unbanSubmitting}
          className="text-sm font-semibold text-green-primary bg-white px-5 py-2.5 rounded-xl hover:bg-green-pale transition-colors disabled:opacity-60 shrink-0 shadow-md"
        >
          {unbanSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove ban'}
        </button>
      )
    }

    if (tamamdirStatus?.is_banned) return null

    if (tamamdirStatus?.both_confirmed && tamamdirStatus?.my_review_submitted && !tamamdirStatus?.other_review_submitted) {
      return (
        <div className="bg-amber-100 text-amber-700 text-sm font-medium px-5 py-2.5 rounded-xl border border-amber-200 shrink-0 shadow-sm">
          Waiting for {activeConv?.other_name}&apos;s feedback
        </div>
      )
    }

    if (tamamdirStatus?.both_confirmed && !tamamdirStatus?.my_review_submitted) {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="text-sm font-semibold text-green-primary bg-white px-4 py-2.5 rounded-xl hover:bg-green-pale transition-colors shadow-md"
          >
            {tamamdirStatus?.my_existing_review ? 'Update feedback' : 'Leave feedback'}
          </button>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelSubmitting}
            className="text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      )
    }
    if (tamamdirStatus?.my_confirmed && !tamamdirStatus?.both_confirmed) {
      return (
        <div className="bg-amber-100 text-amber-700 text-sm font-medium px-5 py-2.5 rounded-xl border border-amber-200 shrink-0 shadow-sm">
          Waiting for {activeConv?.other_name}&apos;s approval
        </div>
      )
    }
    return (
      <button
        onClick={handleTamamdir}
        disabled={tamamdirSubmitting}
        title="Confirm this service"
        className="flex items-center border-2 border-green-primary rounded-lg px-2 py-1 bg-transparent hover:bg-green-pale/40 transition-colors disabled:opacity-60 disabled:pointer-events-none shrink-0"
      >
        {tamamdirSubmitting ? (
          <Loader2 className="w-5 h-5 text-green-primary animate-spin" />
        ) : (
          <TamamdirLogo className="h-8" />
        )}
      </button>
    )
  }

  if (loadingConvs) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-amber-50 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-amber-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Conversation list ── */}
        <div className="w-80 shrink-0 border-r border-amber-100 flex flex-col bg-amber-50">
          <div className={chatPanelHeaderClass}>
            <h2 className={cn('text-xl font-bold', coffeeText)}>Chats</h2>
          </div>
          <div className="px-4 py-3 border-b border-amber-100 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'provider', label: 'Me as provider' },
                { id: 'customer', label: 'Me as customer' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRoleFilter(opt.id)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    roleFilter === opt.id
                      ? 'bg-green-primary text-white border-green-primary'
                      : 'bg-white text-gray-600 border-amber-200 hover:border-green-primary hover:text-green-primary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
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
                onClick={() => handleSelectConvFromList(conv.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-amber-100/80 transition-colors border-b border-amber-100/60',
                  activeConv?.id === conv.id && 'bg-amber-100 border-l-2 border-l-amber-400'
                )}
              >
                <div className="relative shrink-0">
                  {conv.other_avatar
                    ? <img src={resolveMediaUrl(conv.other_avatar)} alt={conv.other_name} className="w-11 h-11 rounded-full object-cover" />
                    : (
                      <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-green-primary font-bold text-sm">{conv.other_name?.[0] ?? '?'}</span>
                      </div>
                    )
                  }
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-light rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {conv.service_title && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-pale text-green-primary mb-1 truncate max-w-full">
                      {conv.service_title}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-coffee truncate">{conv.other_name}</p>
                    <span className="text-xs text-gray-400 shrink-0">
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

            {/* Vinted-style chat header */}
            <div className="bg-amber-50 border-b border-amber-100 shrink-0">
              <div className={cn('relative flex items-center justify-center', chatPanelHeaderClass)}>
                <p className={cn('text-xl font-semibold truncate max-w-[70%] text-center', coffeeText)}>
                  {activeConv.other_name}
                </p>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => setShowChatMenu(v => !v)}
                    className="p-2 rounded-lg hover:bg-amber-200/60 text-gray-400"
                    aria-label="Chat options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-amber-200 rounded-xl shadow-lg py-1 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChatMenu(false)
                          setShowReportModal(true)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 text-left"
                      >
                        <Flag className="w-4 h-4" />
                        Report conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(activeServiceId || activeConv?.service_title) && (
                <div className="flex items-center gap-3 px-4 py-3 border-t border-amber-100">
                  {activeServiceId ? (
                    <Link
                      to={`/services/${activeServiceId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                    >
                      {serviceCover ? (
                        <img
                          src={resolveMediaUrl(serviceCover)}
                          alt=""
                          className="w-14 h-14 rounded-md object-cover shrink-0 border border-amber-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                          <span className="text-coffee text-sm font-bold">S</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-coffee truncate leading-tight">
                          {isServiceProvider ? 'Service offered' : 'Requested service'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {activeService?.title ?? tamamdirStatus?.service_title ?? activeConv?.service_title ?? 'Loading…'}
                          {(activeService?.price != null || activeConv?.service_price != null) && (
                            <>
                              {' · '}
                              {formatPrice(
                                activeService?.price ?? activeConv?.service_price,
                                activeService?.price_unit ?? activeConv?.service_price_unit
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                        <span className="text-coffee text-sm font-bold">S</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-coffee truncate leading-tight">
                          Requested service
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {activeConv.service_title}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeServiceId && (
                    <div className="shrink-0">
                      {renderTamamdirAction()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-amber-50">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-green-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-amber-200">
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
                            ? <img src={resolveMediaUrl(activeConv.other_avatar)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1" />
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
                            : 'bg-amber-100 text-coffee border border-amber-200 rounded-bl-sm shadow-sm'
                        )}>
                          {msg.content}
                          <div className={cn('text-xs mt-1', isMe ? 'text-green-light text-right' : 'text-gray-400')}>
                            {formatMsgTime(msg.created_at)}
                          </div>
                        </div>

                        {isMe && (
                          user?.avatar_url
                            ? <img src={resolveMediaUrl(user.avatar_url)} alt="Me" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1" />
                            : (
                              <div className="w-8 h-8 rounded-full bg-green-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
                                {user?.full_name?.[0] ?? 'ME'}
                              </div>
                            )
                        )}
                      </div>
                    )
                  })}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Status banner — above input */}
            {tamamdirStatus?.i_am_banned && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-center justify-center gap-2">
                <Ban className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-600 text-center">
                  You were banned from this service until {formatBanUntil(tamamdirStatus.banned_until)}
                </p>
              </div>
            )}
            {tamamdirStatus?.is_banned && !tamamdirStatus?.i_am_banned && (
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Ban className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm font-semibold text-amber-700">
                    This customer is banned from this service until{' '}
                    {formatBanUntil(tamamdirStatus.banned_until)}
                  </p>
                </div>
                {tamamdirStatus.can_unban && (
                  <button
                    onClick={handleUnban}
                    disabled={unbanSubmitting}
                    className="text-xs font-semibold text-green-primary bg-white border border-green-primary px-3 py-1.5 rounded-lg hover:bg-green-pale shrink-0 disabled:opacity-60"
                  >
                    {unbanSubmitting ? 'Removing…' : 'Remove ban'}
                  </button>
                )}
              </div>
            )}
            {tamamdirStatus?.other_confirmed &&
              !tamamdirStatus?.my_confirmed &&
              !tamamdirStatus?.both_confirmed &&
              !tamamdirStatus?.is_banned && (
              <div className="px-6 py-4 bg-green-pale border-t border-green-100">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-green-primary shrink-0" />
                  <p className="text-sm font-semibold text-green-primary">
                    {activeConv?.other_name} said Tamamdır! Go click Tamamdır to arrange a deal.
                  </p>
                </div>
              </div>
            )}
            {needsFeedbackPrompt(tamamdirStatus) && !tamamdirStatus?.is_banned && (
              <div className="px-6 py-4 bg-green-pale border-t border-green-100">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-green-primary shrink-0" />
                  <p className="text-sm font-semibold text-green-primary">
                    Service arranged — please leave your feedback
                  </p>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-amber-100 bg-amber-50">
              <div className="flex items-center gap-3">
                <button
                  disabled={tamamdirStatus?.i_am_banned}
                  className="p-2 rounded-lg hover:bg-amber-100 text-gray-500 hover:text-gray-600 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  disabled={tamamdirStatus?.i_am_banned}
                  className="p-2 rounded-lg hover:bg-amber-100 text-gray-500 hover:text-gray-600 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Image className="w-5 h-5" />
                </button>
                <div className={cn(
                  'flex-1 border rounded-xl px-4 py-2.5',
                  tamamdirStatus?.i_am_banned
                    ? 'bg-amber-100/80 border-amber-200'
                    : 'bg-white border-amber-200'
                )}>
                  <input
                    type="text"
                    placeholder={
                      tamamdirStatus?.i_am_banned
                        ? 'You cannot send messages while banned'
                        : 'Type your message...'
                    }
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && !tamamdirStatus?.i_am_banned) handleSend()
                    }}
                    disabled={tamamdirStatus?.i_am_banned}
                    className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim() || tamamdirStatus?.i_am_banned}
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
          <div className="flex-1 flex flex-col min-w-0 bg-amber-50">
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-sm">
                <p className="text-base font-medium text-gray-600 mb-1">
                  {convs.length === 0 ? 'Chat box is empty' : 'No chat selected'}
                </p>
                <p className="text-sm text-gray-400">
                  {convs.length === 0
                    ? 'Start a conversation from a service page to message someone.'
                    : requestedServiceId
                      ? 'Pick a conversation from the list about this service.'
                      : 'Select a conversation from the list to start messaging.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-semibold text-coffee mb-2">Cancel arrangement?</h3>
              <p className="text-sm text-gray-600 mb-3">{cancelModalCopy.body}</p>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-6">
                {cancelModalCopy.note}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelSubmitting}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelSubmitting}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {cancelSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <LeaveFeedbackModal
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={async () => {
            setShowFeedbackThanks(true)
            if (activeConv?.id && activeServiceId) {
              await fetchTamamdirStatus(activeConv.id, activeServiceId, activeConv?.other_id)
            }
          }}
          orderId={tamamdirStatus?.order_id}
          isCustomer={tamamdirStatus?.is_customer}
          revieweeName={activeConv?.other_name}
          serviceTitle={activeService?.title ?? tamamdirStatus?.service_title}
          initialRating={tamamdirStatus?.my_existing_review?.rating ?? 0}
          initialComment={tamamdirStatus?.my_existing_review?.comment ?? ''}
          isUpdate={!!tamamdirStatus?.my_existing_review}
        />

        <FeedbackThanksPopup
          open={showFeedbackThanks}
          onClose={() => setShowFeedbackThanks(false)}
        />

        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="conversation"
          targetId={activeConv?.id}
          targetLabel={activeConv?.other_name}
        />

      </div>
    </div>
  )
}
