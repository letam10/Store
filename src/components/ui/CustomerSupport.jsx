import { useEffect, useRef, useState } from 'react'
import './CustomerSupport.css'

const suggestions = ['Tư vấn sản phẩm', 'Thông tin đơn hàng', 'Gửi phản hồi']

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
  const inputRef = useRef(null)
  const toggleRef = useRef(null)
  const logRef = useRef(null)
  const nextId = useRef(0)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages, isOpen])

  function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setMessages((previous) => [...previous, { id: nextId.current++, content }])
    setDraft('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      setIsOpen(false)
      toggleRef.current?.focus()
    }
  }

  return (
    <aside className={`customer-support${isOpen ? ' customer-support--open' : ''}`} aria-label="Hỗ trợ khách hàng" onKeyDown={handleKeyDown}>
      <button ref={toggleRef} className="customer-support__toggle" type="button" aria-expanded={isOpen} aria-controls="store-support-panel" onClick={() => setIsOpen((previous) => !previous)}>
        <span className="customer-support__icon"><SupportIcon /></span>
        <span className="customer-support__heading"><strong>Hỗ trợ khách hàng</strong><span>Store luôn sẵn sàng lắng nghe</span></span>
        <span className="customer-support__chevron"><SupportIcon kind="chevron" /></span>
      </button>

      {isOpen && (
        <section id="store-support-panel" className="customer-support__panel" aria-label="Trò chuyện với Store">
          <div className="customer-support__intro"><span>CHĂM SÓC KHÁCH HÀNG</span><span className="customer-support__badge">Bản giao diện</span></div>
          <div ref={logRef} className="customer-support__messages" role="log" aria-label="Lịch sử trò chuyện" aria-live="polite" aria-relevant="additions">
            <div className="customer-support__welcome">
              <span className="customer-support__avatar" aria-hidden="true">s.</span>
              <div><span className="customer-support__sender">Store · Hỗ trợ</span><div className="customer-support__bubble"><strong>Chào bạn, Store đây 👋</strong><p>Bạn cần hỗ trợ điều gì? Hãy chọn một chủ đề hoặc nhập lời nhắn bên dưới nhé.</p></div></div>
            </div>
            {messages.map((message) => (
              <div className="customer-support__outgoing" key={message.id}><span className="customer-support__sender">Bạn</span><p className="customer-support__bubble">{message.content}</p><small>Chỉ hiển thị trên máy · chưa gửi</small></div>
            ))}
          </div>
          {messages.length === 0 && <div className="customer-support__suggestions" aria-label="Chủ đề gợi ý">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setDraft(suggestion); inputRef.current?.focus() }}>{suggestion}<span aria-hidden="true">↗</span></button>)}</div>}
          <form className="customer-support__form" onSubmit={sendMessage}>
            <label className="customer-support__sr-only" htmlFor="store-support-message">Nội dung tin nhắn</label>
            <div className="customer-support__composer"><input ref={inputRef} id="store-support-message" autoComplete="off" maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập lời nhắn cho Store…" /><button type="submit" disabled={!draft.trim()} aria-label="Thêm tin nhắn vào bản xem trước"><SupportIcon kind="send" /></button></div>
            <p className="customer-support__disclaimer">Chưa kết nối AI hoặc nhân viên. Tin nhắn không được lưu khi tải lại trang.</p>
          </form>
        </section>
      )}
    </aside>
  )
}
