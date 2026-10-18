/**
 * @codex-vn-doc
 * Tệp: src/components/ui/CustomerSupport.jsx
 * Mục đích: Khung chat hỗ trợ khách hàng, lịch sử hội thoại và trạng thái streaming.
 * Thành phần chính: CustomerSupport.
 * Liên kết trực tiếp: react, ../../api/chat, ../../api/requestGate, ./customerSupportState.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useRef, useState } from 'react'
import { apiJson, streamChat } from '../../api/chat'
import { userMessage } from '../../api/userMessages'
import { createRequestGate } from '../../api/requestGate'
import { applyRestore, createRestoreGuard } from './customerSupportState'
import { useLanguage } from '../../storefront/i18n'
import './CustomerSupport.css'

const suggestionsVi = ['Tư vấn sản phẩm', 'Thông tin đơn hàng', 'Chính sách đổi trả']
const suggestionsEn = ['Product advice', 'Order information', 'Return policy']
const STORAGE_KEY = 'storeSupportConversationId'

// Chức năng localId: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function localId() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + String(Math.random())
}

// Chức năng SupportIcon: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function SupportIcon({ kind = 'chat' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'send' ? <><path d="m21 3-7 18-4-7-7-4Z" /><path d="m10 14 11-11" /></>
        : kind === 'chevron' ? <path d="m6 9 6 6 6-6" />
          : <><path d="M20 11.5a8 8 0 0 1-8 8H4l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M8 10h8M8 14h5" /></>}
    </svg>
  )
}

// Chức năng CustomerSupport: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function CustomerSupport({ account, onRequireLogin, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
  const suggestions = english ? suggestionsEn : suggestionsVi
  const initialConversationIdRef = useRef(localStorage.getItem(STORAGE_KEY) || '')
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(initialConversationIdRef.current)
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState('')
  const [providerStatus, setProviderStatus] = useState(null)
  const inputRef = useRef(null)
  const toggleRef = useRef(null)
  const rootRef = useRef(null)
  const logRef = useRef(null)
  const gateRef = useRef(createRequestGate())
  const restoreGuardRef = useRef(createRestoreGuard(initialConversationIdRef.current))
  const conversationIdRef = useRef(initialConversationIdRef.current)

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    const initialId = initialConversationIdRef.current
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!account || !initialId) return undefined
    const restoreGuard = restoreGuardRef.current
    const gate = gateRef.current
    const token = restoreGuard.begin()
    let disposed = false
    apiJson('/api/support/conversations/' + encodeURIComponent(initialId))
      .then((payload) => {
        if (disposed) return
        const canApply = restoreGuard.canApply(token, {
          requestActive: gate.locked,
          currentConversationId: conversationIdRef.current,
        })
        setMessages((current) => applyRestore(current, payload.messages, { canApply }))
      })
      .catch((error) => {
        // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
        if (disposed || !restoreGuard.canApply(token, {
          requestActive: gate.locked,
          currentConversationId: conversationIdRef.current,
        })) return
        // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
        if (error.code === 'CONVERSATION_NOT_FOUND') {
          localStorage.removeItem(STORAGE_KEY)
          conversationIdRef.current = ''
          setConversationId('')
        }
      })
    return () => { disposed = true; restoreGuard.invalidate() }
  }, [account])

  useEffect(() => {
    const restoreGuard = restoreGuardRef.current
    const gate = gateRef.current
    return () => {
      restoreGuard.invalidate()
      gate.cancel()
    }
  }, [])

  useEffect(() => { if (isOpen) inputRef.current?.focus() }, [isOpen])
  useEffect(() => {
    if (!isOpen || !account) return undefined
    let disposed = false
    apiJson('/api/support/status')
      .then((status) => { if (!disposed) setProviderStatus(status) })
      .catch(() => { if (!disposed) setProviderStatus({ reachable: false, modelAvailable: false }) })
    return () => { disposed = true }
  }, [isOpen, account])
  useEffect(() => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!isOpen) return undefined
    // Chức năng closeOutside: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setIsOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [isOpen])
  useEffect(() => {
    if (isOpen && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, isOpen, activity])

  // Chức năng updateMessage: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function updateMessage(id, updater) {
    setMessages((previous) => previous.map((message) => message.id === id ? updater(message) : message))
  }

  // Chức năng startRequest: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  async function startRequest(content, { assistantId = '', requestId = '' } = {}) {
    const clean = content.trim()
    if (!clean) return
    const gate = gateRef.current.tryBegin()
    if (!gate) return
    restoreGuardRef.current.invalidate()

    const resolvedAssistantId = assistantId || localId()
    const resolvedRequestId = requestId || localId()
    if (assistantId) {
      updateMessage(resolvedAssistantId, (message) => ({
        ...message, content: '', verified: null, sources: [], status: 'streaming', error: '',
      }))
    } else {
      setMessages((previous) => [
        ...previous,
        { id: localId(), role: 'user', content: clean, status: 'complete' },
        {
          id: resolvedAssistantId, role: 'assistant', content: '', verified: null, sources: [],
          status: 'streaming', retryContent: clean, requestId: resolvedRequestId,
        },
      ])
    }

    setDraft('')
    setBusy(true)
    setActivity('Đang chờ AI')

    try {
      await streamChat({
        endpoint: '/api/support/chat',
        csrfToken: account?.csrfToken,
        message: clean,
        conversationId: conversationIdRef.current,
        requestId: resolvedRequestId,
        signal: gate.controller.signal,
        onEvent: (event) => {
          if (!gateRef.current.isCurrent(gate.epoch)) return
          if (event.type === 'conversation') {
            conversationIdRef.current = event.conversationId
            setConversationId(event.conversationId)
            localStorage.setItem(STORAGE_KEY, event.conversationId)
          } else if (event.type === 'status') {
            const activities = { queued: 'Đang xếp hàng', waiting: 'Đang chờ AI', generating: 'Đang trả lời' }
            setActivity(activities[event.status] || 'Đang xử lý')
          } else if (event.type === 'delta') {
            updateMessage(resolvedAssistantId, (message) => ({ ...message, content: message.content + event.content }))
          } else if (event.type === 'verified') {
            updateMessage(resolvedAssistantId, (message) => ({ ...message, verified: event.verified }))
          } else if (event.type === 'sources') {
            updateMessage(resolvedAssistantId, (message) => ({ ...message, sources: event.sources || [] }))
          } else if (event.type === 'done') {
            updateMessage(resolvedAssistantId, (message) => ({ ...message, status: 'complete' }))
          }
        },
      })
    } catch (error) {
      if (!gateRef.current.isCurrent(gate.epoch)) return
      // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
      if (error.name === 'AbortError') {
        updateMessage(resolvedAssistantId, (message) => ({ ...message, status: 'stopped' }))
        setActivity('Đã dừng')
      } else {
        updateMessage(resolvedAssistantId, (message) => ({
          ...message,
          status: error.incomplete ? 'incomplete' : 'error',
          error: userMessage(error, 'Không thể nhận câu trả lời.'),
          retryContent: clean,
          requestId: resolvedRequestId,
        }))
        setDraft((current) => current || clean)
        setActivity(error.incomplete ? 'Câu trả lời chưa hoàn tất' : 'Có lỗi')
      }
    } finally {
      if (gateRef.current.isCurrent(gate.epoch)) {
        gateRef.current.finish(gate.epoch)
        setBusy(false)
        inputRef.current?.focus()
      }
    }
  }

  // Chức năng sendMessage: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function sendMessage(event) {
    event.preventDefault()
    startRequest(draft)
  }

  // Chức năng startNewConversation: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function startNewConversation() {
    if (gateRef.current.locked) return
    restoreGuardRef.current.invalidate()
    localStorage.removeItem(STORAGE_KEY)
    initialConversationIdRef.current = ''
    conversationIdRef.current = ''
    setConversationId('')
    setMessages([])
    setDraft('')
    setActivity('')
    inputRef.current?.focus()
  }

  // Chức năng stopRequest: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function stopRequest() {
    gateRef.current.cancel()
    setMessages((previous) => previous.map((message) => message.status === "streaming" ? { ...message, status: "stopped" } : message))
    setBusy(false)
    setActivity("Đã dừng")
  }

  // Chức năng handleKeyDown: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      setIsOpen(false)
      toggleRef.current?.focus()
    }
  }

  return (
    <aside ref={rootRef} className={'customer-support' + (isOpen ? ' customer-support--open' : '')} aria-label={english ? 'Customer support' : 'Hỗ trợ khách hàng'} onKeyDown={handleKeyDown}>
      <button className="customer-support__to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} title={english ? 'Back to top' : 'Lên đầu trang'} aria-label={english ? 'Scroll to top' : 'Lên đầu trang ngay'}>↑</button>
      <button ref={toggleRef} className="customer-support__toggle" type="button" aria-label={isOpen ? (english ? 'Collapse customer support' : 'Thu gọn hỗ trợ khách hàng') : (english ? 'Open customer support' : 'Mở hỗ trợ khách hàng')} aria-expanded={isOpen} aria-controls="store-support-panel" onClick={() => { if (!account) onRequireLogin?.(); else setIsOpen((previous) => !previous) }}>
        <span className="customer-support__icon"><SupportIcon /></span>
        <span className="customer-support__heading"><strong>{english ? 'Customer support' : 'Hỗ trợ khách hàng'}</strong><span>{english ? 'Store AI Assistant' : 'Trợ lý AI của Store'}</span></span>
        <span className="customer-support__chevron"><SupportIcon kind="chevron" /></span>
      </button>

      {isOpen && (
        <section id="store-support-panel" className="customer-support__panel" aria-label={english ? 'Chat with Store' : 'Trò chuyện với Store'}>
          <div className="customer-support__intro">
            <span>{english ? 'CUSTOMER CARE' : 'CHĂM SÓC KHÁCH HÀNG'}</span>
            <span className="customer-support__badge">{providerStatus?.reachable && providerStatus?.modelAvailable ? `AI Local · ${providerStatus.model || 'qwen3.5:4b'}` : providerStatus ? 'AI fallback local' : (english ? 'Checking AI' : 'Đang kiểm tra AI')}</span>
          </div>
          <div className="customer-support__toolbar"><button type="button" disabled={busy} onClick={startNewConversation}>{english ? 'New conversation' : 'Cuộc trò chuyện mới'}</button></div>

          <div ref={logRef} className="customer-support__messages" role="log" aria-label={english ? 'Chat history' : 'Lịch sử trò chuyện'} aria-live="polite" aria-relevant="additions">
            <div className="customer-support__welcome">
              <span className="customer-support__avatar" aria-hidden="true">s.</span>
              <div><span className="customer-support__sender">{english ? 'Store · Support' : 'Store · Hỗ trợ'}</span><div className="customer-support__bubble"><strong>{english ? 'Hi there, Store here 👋' : 'Chào bạn, Store đây 👋'}</strong><p>{english ? 'AI assistant only uses current Store data.' : 'AI chỉ dùng dữ liệu mà Store hiện cung cấp.'}</p></div></div>
            </div>

            {messages.map((message) => message.role === 'user' ? (
              <div className="customer-support__outgoing" key={message.id}><span className="customer-support__sender">{english ? 'You' : 'Bạn'}</span><p className="customer-support__bubble">{message.content}</p></div>
            ) : (
              <div className="customer-support__incoming" key={message.id}>
                <span className="customer-support__avatar" aria-hidden="true">s.</span>
                <div className="customer-support__incoming-body">
                  <span className="customer-support__sender">{english ? 'Store · AI Assistant' : 'Store · Trợ lý AI'}</span>
                  <p className="customer-support__bubble">{message.content || (message.status === 'streaming' ? '…' : message.error || (english ? 'No content.' : 'Không có nội dung.'))}</p>
                  {message.verified?.text && message.verified.text !== message.content && <div className="customer-support__verified"><strong>{english ? 'Verified Store Data' : 'Dữ liệu Store đã xác minh'}</strong><p>{message.verified.text}</p></div>}
                  {message.sources?.length > 0 && <div className="customer-support__sources">{message.sources.map((source) => <span key={source.id}>{source.label}</span>)}</div>}
                  {(['error', 'incomplete', 'stopped'].includes(message.status)) && <>
                    <small className="customer-support__state">{message.status === 'incomplete' ? (english ? 'Above content not yet marked complete.' : 'Nội dung trên chưa được xác nhận hoàn tất.') : message.error}</small>
                    <button className="customer-support__retry" type="button" disabled={busy} onClick={() => startRequest(message.retryContent, { assistantId: message.id, requestId: message.requestId })}>{english ? 'Retry' : 'Thử lại'}</button>
                  </>}
                  {message.status === 'stopped' && <small className="customer-support__state">{english ? 'Stopped · this answer was not saved as complete.' : 'Đã dừng · câu trả lời này không được lưu là hoàn tất.'}</small>}
                  {message.status === 'pending' && <small className="customer-support__state">{english ? 'Previous turn still processing. Reload conversation when ready.' : 'Lượt trước vẫn đang xử lý. Hãy tải lại hội thoại sau khi hoàn tất.'}</small>}
                </div>
              </div>
            ))}
          </div>

          {messages.length === 0 && <div className="customer-support__suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setDraft(suggestion); inputRef.current?.focus() }}>{suggestion}<span aria-hidden="true">↗</span></button>)}</div>}

          <form className="customer-support__form" onSubmit={sendMessage}>
            <label className="customer-support__sr-only" htmlFor="store-support-message">{english ? 'Message content' : 'Nội dung tin nhắn'}</label>
            <div className="customer-support__composer">
              <input ref={inputRef} id="store-support-message" autoComplete="off" maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={english ? 'Type a message for Store…' : 'Nhập lời nhắn cho Store…'} disabled={busy} />
              {busy ? <button type="button" onClick={stopRequest} aria-label={english ? 'Stop response' : 'Dừng trả lời'}><span aria-hidden="true">■</span></button> : <button type="submit" disabled={!draft.trim()} aria-label={english ? 'Send message' : 'Gửi tin nhắn'}><SupportIcon kind="send" /></button>}
            </div>
            <p className={'customer-support__disclaimer' + (busy ? ' customer-support__disclaimer--active' : '')}>
              {busy ? activity : (english ? 'AI may make mistakes. Important information is verified separately.' : 'AI có thể trả lời sai. Thông tin quan trọng được hệ thống xác minh riêng.')}
            </p>
          </form>
        </section>
      )}
    </aside>
  )
}
