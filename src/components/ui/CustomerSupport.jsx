import { useEffect, useRef, useState } from 'react'
import { apiJson, streamChat } from '../../api/chat'
import './CustomerSupport.css'

const suggestions = ['Tư vấn sản phẩm', 'Thông tin đơn hàng', 'Chính sách đổi trả']
const STORAGE_KEY = 'storeSupportConversationId'

function localId() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + String(Math.random())
}

function SupportIcon({ kind = 'chat' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'send' ? <><path d="m21 3-7 18-4-7-7-4Z" /><path d="m10 14 11-11" /></>
        : kind === 'chevron' ? <path d="m6 9 6 6 6-6" />
          : <><path d="M20 11.5a8 8 0 0 1-8 8H4l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M8 10h8M8 14h5" /></>}
    </svg>
  )
}

export default function CustomerSupport() {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState('')
  const inputRef = useRef(null)
  const toggleRef = useRef(null)
  const logRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    apiJson('/api/support/conversations/' + encodeURIComponent(conversationId))
      .then((payload) => {
        if (cancelled) return
        setMessages(payload.messages.map((message) => ({
          id: 'server-' + message.id,
          role: message.role,
          content: message.content,
          sources: message.sources || [],
          status: 'complete',
        })))
      })
      .catch((error) => {
        if (error.code === 'CONVERSATION_NOT_FOUND') {
          localStorage.removeItem(STORAGE_KEY)
          setConversationId('')
        }
      })
    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, isOpen, activity])

  function updateMessage(id, updater) {
    setMessages((previous) => previous.map((message) =>
      message.id === id ? updater(message) : message,
    ))
  }

  async function startRequest(content, existingAssistantId = '') {
    if (busy || !content.trim()) return
    const clean = content.trim()
    const assistantId = existingAssistantId || localId()

    if (existingAssistantId) {
      updateMessage(assistantId, (message) => ({
        ...message,
        content: '',
        sources: [],
        status: 'streaming',
        error: '',
      }))
    } else {
      setMessages((previous) => [
        ...previous,
        { id: localId(), role: 'user', content: clean, status: 'complete' },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          sources: [],
          status: 'streaming',
          retryContent: clean,
        },
      ])
    }

    setDraft('')
    setBusy(true)
    setActivity('Đang chờ AI')
    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        endpoint: '/api/support/chat',
        message: clean,
        conversationId,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'conversation') {
            setConversationId(event.conversationId)
            localStorage.setItem(STORAGE_KEY, event.conversationId)
          } else if (event.type === 'status') {
            setActivity(event.label || '')
          } else if (event.type === 'delta') {
            updateMessage(assistantId, (message) => ({
              ...message,
              content: message.content + event.content,
              status: 'streaming',
            }))
          } else if (event.type === 'sources') {
            updateMessage(assistantId, (message) => ({ ...message, sources: event.sources || [] }))
          } else if (event.type === 'done') {
            updateMessage(assistantId, (message) => ({ ...message, status: 'complete' }))
          }
        },
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        updateMessage(assistantId, (message) => ({ ...message, status: 'stopped' }))
        setActivity('Đã dừng')
      } else {
        updateMessage(assistantId, (message) => ({
          ...message,
          status: 'error',
          error: error.message || 'Không thể nhận câu trả lời.',
        }))
        setDraft((current) => current || clean)
        setActivity('Có lỗi')
      }
    } finally {
      abortRef.current = null
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function sendMessage(event) {
    event.preventDefault()
    startRequest(draft)
  }

  function stopRequest() {
    abortRef.current?.abort()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      setIsOpen(false)
      toggleRef.current?.focus()
    }
  }

  return (
    <aside className={'customer-support' + (isOpen ? ' customer-support--open' : '')} aria-label="Hỗ trợ khách hàng" onKeyDown={handleKeyDown}>
      <button ref={toggleRef} className="customer-support__toggle" type="button" aria-expanded={isOpen} aria-controls="store-support-panel" onClick={() => setIsOpen((previous) => !previous)}>
        <span className="customer-support__icon"><SupportIcon /></span>
        <span className="customer-support__heading"><strong>Hỗ trợ khách hàng</strong><span>AI local của Store</span></span>
        <span className="customer-support__chevron"><SupportIcon kind="chevron" /></span>
      </button>

      {isOpen && (
        <section id="store-support-panel" className="customer-support__panel" aria-label="Trò chuyện với Store">
          <div className="customer-support__intro">
            <span>CHĂM SÓC KHÁCH HÀNG</span>
            <span className="customer-support__badge">Thinking: Tắt</span>
          </div>

          <div ref={logRef} className="customer-support__messages" role="log" aria-label="Lịch sử trò chuyện" aria-live="polite" aria-relevant="additions">
            <div className="customer-support__welcome">
              <span className="customer-support__avatar" aria-hidden="true">s.</span>
              <div>
                <span className="customer-support__sender">Store · Hỗ trợ</span>
                <div className="customer-support__bubble">
                  <strong>Chào bạn, Store đây 👋</strong>
                  <p>Bạn cần hỗ trợ gì? AI chỉ dùng dữ liệu mà Store hiện cung cấp.</p>
                </div>
              </div>
            </div>

            {messages.map((message) => message.role === 'user' ? (
              <div className="customer-support__outgoing" key={message.id}>
                <span className="customer-support__sender">Bạn</span>
                <p className="customer-support__bubble">{message.content}</p>
              </div>
            ) : (
              <div className="customer-support__incoming" key={message.id}>
                <span className="customer-support__avatar" aria-hidden="true">s.</span>
                <div className="customer-support__incoming-body">
                  <span className="customer-support__sender">Store · AI local</span>
                  <p className="customer-support__bubble">
                    {message.content || (message.status === 'streaming' ? '…' : message.error || 'Không có nội dung.')}
                  </p>
                  {message.sources?.length > 0 && (
                    <div className="customer-support__sources" aria-label="Nguồn dữ liệu">
                      {message.sources.map((source) => <span key={source.id}>{source.label}</span>)}
                    </div>
                  )}
                  {message.status === 'error' && (
                    <button className="customer-support__retry" type="button" disabled={busy} onClick={() => startRequest(message.retryContent, message.id)}>
                      Thử lại
                    </button>
                  )}
                  {message.status === 'stopped' && <small className="customer-support__state">Đã dừng · câu trả lời này không được lưu là hoàn tất.</small>}
                </div>
              </div>
            ))}
          </div>

          {messages.length === 0 && (
            <div className="customer-support__suggestions" aria-label="Chủ đề gợi ý">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => { setDraft(suggestion); inputRef.current?.focus() }}>
                  {suggestion}<span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          )}

          <form className="customer-support__form" onSubmit={sendMessage}>
            <label className="customer-support__sr-only" htmlFor="store-support-message">Nội dung tin nhắn</label>
            <div className="customer-support__composer">
              <input ref={inputRef} id="store-support-message" autoComplete="off" maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập lời nhắn cho Store…" disabled={busy} />
              {busy
                ? <button type="button" onClick={stopRequest} aria-label="Dừng trả lời"><span aria-hidden="true">■</span></button>
                : <button type="submit" disabled={!draft.trim()} aria-label="Gửi tin nhắn"><SupportIcon kind="send" /></button>}
            </div>
            <p className={'customer-support__disclaimer' + (busy ? ' customer-support__disclaimer--active' : '')}>
              {busy ? activity : 'AI local có thể sai. Giá và chính sách chỉ lấy từ dữ liệu Store được backend cung cấp.'}
            </p>
          </form>
        </section>
      )}
    </aside>
  )
}
