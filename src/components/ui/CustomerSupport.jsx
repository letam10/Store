/*
  FILE NOTE
  - Mục đích: Khung chat hỗ trợ khách hàng, xử lý streaming tin nhắn AI, định dạng văn bản Markdown/ảnh sản phẩm inline, phóng to ảnh lightbox và đảm bảo kích thước mở dứt khoát 600px, panel 800px.
  - Liên kết trực tiếp: react, ../../api/chat, ../../api/requestGate, ../../services/customerSupportState, ./CustomerSupport.css
  - Vùng ảnh hưởng khi sửa: Toàn bộ giao diện chat CSKH của cửa hàng (Store), popup hỗ trợ, hiển thị tin nhắn và kích thước khung chat.
*/
import { useEffect, useRef, useState } from 'react'
import { apiJson, streamChat } from '../../api/chat'
import { userMessage } from '../../api/userMessages'
import { createRequestGate } from '../../api/requestGate'
import { applyRestore, createRestoreGuard, hideSourceDisclosure } from '../../services/customerSupportState'
import { useLanguage } from '../../context/i18n'
import './CustomerSupport.css'

const suggestionsVi = ['Tư vấn sản phẩm', 'Thông tin đơn hàng', 'Chính sách đổi trả']
const suggestionsEn = ['Product advice', 'Order information', 'Return policy']
const LEGACY_STORAGE_KEY = 'storeSupportConversationId'

// Làm sạch các dấu sao thừa hoặc sai cấu trúc trước khi hiển thị
function cleanMarkdownText(text) {
  if (!text) return ''
  return String(text)
    // 1. Chuyển tiêu đề markdown # ## ### thành chữ in đậm
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    // 2. Xử lý đường kẻ ngang hoặc dòng chỉ toàn dấu sao/gạch: '***', '* * *', '---', '___'
    .replace(/^(\s*)[*_~-](?:\s*[*_~-]){2,}\s*$/gm, '---')
    // 3. Chuẩn hóa các dạng bullet dị dạng: '* *Nhãn:*' -> '• **Nhãn:**'
    .replace(/^(\s*)[*•-]\s+\*([^*:\n]+)\*:/gm, (m, sp, p1) => sp + '• **' + p1.trim() + ':**')
    .replace(/^(\s*)[*•-]\s+\*([^*:\n]+):\*/gm, (m, sp, p1) => sp + '• **' + p1.trim() + ':**')
    .replace(/^(\s*)[*•-]\s+\*([^*\n]+)\*/gm, (m, sp, p1) => sp + '• **' + p1.trim() + '**')
    .replace(/^(\s*)[*•-]\s+\*\*([^*\n]+)\*\*/gm, (m, sp, p1) => sp + '• **' + p1.trim() + '**')
    .replace(/^(\s*)[*•-]\s+[*•-]\s+(?!\*)/gm, '$1• ')
    .replace(/^(\s*)[*-]\s+(?!\*)/gm, '$1• ')
    // 4. Xóa dấu sao in đậm/nghiêng không cần thiết quanh con số, phép tính, số thứ tự (hỗ trợ cả dấu chấm, phẩy, chấm than phía sau)
    .replace(/\*{1,3}(\d+(?:[.,]\d+)*(?:\s*(?:%|k|đ|VND|vnd))?)(?:([.,!?;:])\*{1,3}|\*{1,3}([.,!?;:]?))(?!\w)/gi, (m, num, p1, p2) => num + (p1 || p2 || ''))
    .replace(/\*{1,3}((?:số|thứ|top|bước|phần|tập)\s+\d+)(?:([.,!?;:])\*{1,3}|\*{1,3}([.,!?;:]?))/gi, (m, ord, p1, p2) => ord + (p1 || p2 || ''))
    // 5. Thu gọn 3 dấu sao nếu bao quanh nội dung, hoặc loại bỏ dấu sao lẻ thừa ở đầu/cuối dòng
    .replace(/\*\*\*+([^*]+)\*\*\*+/g, '***$1***')
    .replace(/\s+\*{1,3}$/gm, '')
    .replace(/^\*{1,3}\s+/gm, '')
    // 6. Chuẩn hóa các dạng đường dẫn ảnh về cú pháp Markdown chuẩn ![alt](url)
    .replace(/(?:[•*-]\s*)?(?:ảnh\s*(?:sản\s*phẩm|minh\s*họa)?|hình\s*(?:ảnh)?(?:\s*sản\s*phẩm)?|image|photo)\s*:\s*\[?(https?:\/\/[^\s\])]+|\/products\/[^\s\])]+\.(?:webp|png|jpe?g|gif|svg))\]?/gi, '![Hình ảnh sản phẩm]($1)')
    .replace(/(?<!\!)(?:[•*-]\s*)?\[(https?:\/\/[^\s\])]+|\/products\/[^\s\])]+\.(?:webp|png|jpe?g|gif|svg))\]/gi, '![Hình ảnh sản phẩm]($1)')
    .replace(/(?<!\!)(?:[•*-]\s*)?\[([^\]]*(?:ảnh|hình|image|photo)[^\]]*)\]\((https?:\/\/[^\s)]+|\/products\/[^\s)]+\.(?:webp|png|jpe?g|gif|svg))\)/gi, '![$1]($2)')
    .replace(/^\s*(?:[•*-]\s*)?(https?:\/\/[^\s)]+|\/products\/[^\s)]+\.(?:webp|png|jpe?g|gif|svg))\s*$/gim, '![Hình ảnh sản phẩm]($1)')
}

// Phân tách các phần tử inline: ảnh, liên kết, in đậm/nghiêng và văn bản
function parseInline(text) {
  if (!text) return []
  const tokens = []
  const regex = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*\s][^*]*?)\*/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'image', alt: match[1] || 'Hình ảnh sản phẩm', src: match[2] })
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'link', text: match[3], url: match[4] })
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'boldItalic', text: match[5] })
    } else if (match[6] !== undefined) {
      tokens.push({ type: 'bold', text: match[6] })
    } else if (match[7] !== undefined) {
      tokens.push({ type: 'italic', text: match[7] })
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return tokens
}

function FormattedChatMessage({ content, onPreviewImage }) {
  if (!content) return null
  const cleaned = cleanMarkdownText(content)
  const lines = cleaned.split('\n')

  return (
    <div className="customer-support__formatted">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={lineIndex} className="customer-support__spacer" />
        }

        if (trimmed === '---') {
          return <hr key={lineIndex} className="customer-support__divider" />
        }

        const tokens = parseInline(line)
        const hasOnlyImage = tokens.length === 1 && tokens[0].type === 'image'

        return (
          <div
            key={lineIndex}
            className={'customer-support__line' + (hasOnlyImage ? ' customer-support__line--image' : '')}
          >
            {tokens.map((token, tokenIndex) => {
              const key = `t-${lineIndex}-${tokenIndex}`
              if (token.type === 'image') {
                return (
                  <div
                    key={key}
                    className="customer-support__image-wrap"
                    role="button"
                    tabIndex={0}
                    onClick={() => onPreviewImage?.({ src: token.src, alt: token.alt })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPreviewImage?.({ src: token.src, alt: token.alt })
                      }
                    }}
                    title="Bấm để xem ảnh phóng to"
                  >
                    <img
                      src={token.src}
                      alt={token.alt}
                      className="customer-support__product-img"
                      loading="lazy"
                      onError={(e) => {
                        const wrap = e.currentTarget.closest('.customer-support__image-wrap')
                        if (wrap) wrap.style.display = 'none'
                      }}
                    />
                    <span className="customer-support__image-hint">🔍 Phóng to ảnh</span>
                  </div>
                )
              }
              if (token.type === 'link') {
                return (
                  <a key={key} href={token.url} className="customer-support__link">
                    {token.text}
                  </a>
                )
              }
              if (token.type === 'bold') {
                return <strong key={key}>{token.text}</strong>
              }
              if (token.type === 'italic') {
                return <em key={key}>{token.text}</em>
              }
              if (token.type === 'boldItalic') {
                return (
                  <strong key={key}>
                    <em>{token.text}</em>
                  </strong>
                )
              }
              return <span key={key}>{token.content}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

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
export default function CustomerSupport(props) {
  // Đổi tài khoản phải hủy request và bỏ toàn bộ trạng thái riêng của người trước.
  return <CustomerSupportSession key={props.account?.id ?? 'guest'} {...props} />
}

function CustomerSupportSession({ account, onRequireLogin, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
  const suggestions = english ? suggestionsEn : suggestionsVi
  const storageKey = `${LEGACY_STORAGE_KEY}:${account?.id ?? 'guest'}`
  const savedConversationIdRef = useRef(account?.id ? localStorage.getItem(storageKey) || '' : '')
  const initialConversationIdRef = useRef(account?.id ? savedConversationIdRef.current || localStorage.getItem(LEGACY_STORAGE_KEY) || '' : '')
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(savedConversationIdRef.current)
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState('')
  const [providerStatus, setProviderStatus] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const accountId = account?.id
  const inputRef = useRef(null)
  const toggleRef = useRef(null)
  const rootRef = useRef(null)
  const logRef = useRef(null)
  const gateRef = useRef(createRequestGate())
  const restoreGuardRef = useRef(createRestoreGuard(initialConversationIdRef.current))
  const conversationIdRef = useRef(savedConversationIdRef.current)

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    if (!previewImage) return undefined
    function onWindowKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setPreviewImage(null)
      }
    }
    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [previewImage])

  useEffect(() => {
    const initialId = initialConversationIdRef.current
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!accountId || !initialId) return undefined
    const restoreGuard = restoreGuardRef.current
    const gate = gateRef.current
    const token = restoreGuard.begin()
    let disposed = false
    apiJson('/api/support/conversations/' + encodeURIComponent(initialId))
      .then((payload) => {
        if (disposed) return
        const canApply = restoreGuard.canApply(token, {
          requestActive: gate.locked,
          currentConversationId: conversationIdRef.current || initialId,
        })
        setMessages((current) => applyRestore(current, payload.messages, { canApply }))
        if (canApply) {
          conversationIdRef.current = initialId
          setConversationId(initialId)
          localStorage.setItem(storageKey, initialId)
          if (localStorage.getItem(LEGACY_STORAGE_KEY) === initialId) localStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      })
      .catch((error) => {
        // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
        if (disposed || !restoreGuard.canApply(token, {
          requestActive: gate.locked,
          currentConversationId: conversationIdRef.current || initialId,
        })) return
        // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
        if (error.code === 'CONVERSATION_NOT_FOUND') {
          localStorage.removeItem(storageKey)
          conversationIdRef.current = ''
          setConversationId('')
        }
      })
    return () => { disposed = true; restoreGuard.invalidate() }
  // Chỉ khôi phục khi đổi người dùng; refresh phiên định kỳ không được xóa lịch sử đang hiển thị.
  }, [accountId, storageKey])

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
    inputRef.current?.focus()
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
            localStorage.setItem(storageKey, event.conversationId)
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
    localStorage.removeItem(storageKey)
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
    if (event.key === 'Escape') {
      if (previewImage) {
        event.stopPropagation()
        setPreviewImage(null)
        return
      }
      if (isOpen) {
        event.stopPropagation()
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }
  }

  return (
    <aside
      ref={rootRef}
      className={'customer-support' + (isOpen ? ' customer-support--open' : '')}
      style={isOpen ? { width: 'min(600px, calc(100vw - 32px))' } : undefined}
      aria-label={english ? 'Customer support' : 'Hỗ trợ khách hàng'}
      onKeyDown={handleKeyDown}
    >
      <button className="customer-support__to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} title={english ? 'Back to top' : 'Lên đầu trang'} aria-label={english ? 'Scroll to top' : 'Lên đầu trang ngay'}>↑</button>
      <button ref={toggleRef} className="customer-support__toggle" type="button" aria-label={isOpen ? (english ? 'Collapse customer support' : 'Thu gọn hỗ trợ khách hàng') : (english ? 'Open customer support' : 'Mở hỗ trợ khách hàng')} aria-expanded={isOpen} aria-controls="store-support-panel" onClick={() => { if (!account) onRequireLogin?.(); else setIsOpen((previous) => !previous) }}>
        <span className="customer-support__icon"><SupportIcon /></span>
        <span className="customer-support__heading"><strong>{english ? 'Customer support' : 'Hỗ trợ khách hàng'}</strong><span>{english ? 'OmniCart AI Assistant' : 'Trợ lý AI của OmniCart'}</span></span>
        <span className="customer-support__chevron"><SupportIcon kind="chevron" /></span>
      </button>

      {isOpen && (
        <section
          id="store-support-panel"
          className="customer-support__panel"
          style={{ height: 'min(800px, calc(100dvh - 150px))', width: '100%', boxSizing: 'border-box' }}
          aria-label={english ? 'Chat with OmniCart' : 'Trò chuyện với OmniCart'}
        >
          <div className="customer-support__intro">
            <span>{english ? 'CUSTOMER CARE' : 'CHĂM SÓC KHÁCH HÀNG'}</span>
            <span className="customer-support__badge">{providerStatus?.reachable && providerStatus?.modelAvailable ? `AI Local · ${providerStatus.model || 'qwen3.5:4b'}` : providerStatus ? (english ? 'AI offline' : 'AI chưa kết nối') : (english ? 'Checking AI' : 'Đang kiểm tra AI')}</span>
          </div>
          <div className="customer-support__toolbar"><button type="button" disabled={busy} onClick={startNewConversation}>{english ? 'New conversation' : 'Cuộc trò chuyện mới'}</button></div>

          <div ref={logRef} className="customer-support__messages" role="log" aria-label={english ? 'Chat history' : 'Lịch sử trò chuyện'} aria-live="polite" aria-relevant="additions">
            <div className="customer-support__welcome">
              <span className="customer-support__avatar" aria-hidden="true">o.</span>
              <div><span className="customer-support__sender">{english ? 'OmniCart · Support' : 'OmniCart · Hỗ trợ'}</span><div className="customer-support__bubble"><strong>{english ? 'Hi there, OmniCart here 👋' : 'Chào bạn, OmniCart đây 👋'}</strong><p>{english ? 'AI assistant only uses current OmniCart data.' : 'AI chỉ dùng dữ liệu mà OmniCart hiện cung cấp.'}</p></div></div>
            </div>

            {messages.map((message) => message.role === 'user' ? (
              <div className="customer-support__outgoing" key={message.id}><span className="customer-support__sender">{english ? 'You' : 'Bạn'}</span><p className="customer-support__bubble">{message.content}</p></div>
            ) : (
              <div className="customer-support__incoming" key={message.id}>
                <span className="customer-support__avatar" aria-hidden="true">o.</span>
                <div className="customer-support__incoming-body">
                  <span className="customer-support__sender">{english ? 'OmniCart · AI Assistant' : 'OmniCart · Trợ lý AI'}</span>
                  <div className="customer-support__bubble">
                    {hideSourceDisclosure(message.content) ? (
                      <FormattedChatMessage content={hideSourceDisclosure(message.content)} onPreviewImage={setPreviewImage} />
                    ) : (
                      message.status === 'streaming' ? '…' : (message.error || (english ? 'No content.' : 'Không có nội dung.'))
                    )}
                  </div>
                  {message.verified?.text && message.verified.text !== message.content && (
                    <div className="customer-support__verified">
                      <strong>{english ? 'Verified OmniCart Data' : 'Dữ liệu OmniCart đã xác minh'}</strong>
                      <FormattedChatMessage content={message.verified.text} onPreviewImage={setPreviewImage} />
                    </div>
                  )}
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
              <input ref={inputRef} id="store-support-message" autoComplete="off" maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={english ? 'Type a message for OmniCart…' : 'Nhập lời nhắn cho OmniCart…'} aria-busy={busy} />
              {busy ? <button type="button" onClick={stopRequest} aria-label={english ? 'Stop response' : 'Dừng trả lời'}><span aria-hidden="true">■</span></button> : <button type="submit" disabled={!draft.trim()} aria-label={english ? 'Send message' : 'Gửi tin nhắn'}><SupportIcon kind="send" /></button>}
            </div>
            <p className={'customer-support__disclaimer' + (busy ? ' customer-support__disclaimer--active' : '')}>
              {busy ? activity : (english ? 'AI may make mistakes. Important information is verified separately.' : 'AI có thể trả lời sai. Thông tin quan trọng được hệ thống xác minh riêng.')}
            </p>
          </form>
        </section>
      )}

      {previewImage && (
        <div
          className="customer-support__lightbox"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={english ? 'Product image preview' : 'Xem ảnh sản phẩm phóng to'}
        >
          <div className="customer-support__lightbox-content" onClick={(event) => event.stopPropagation()}>
            <img src={previewImage.src} alt={previewImage.alt || 'Hình ảnh sản phẩm'} />
            {previewImage.alt && previewImage.alt !== 'Hình ảnh sản phẩm' && (
              <p className="customer-support__lightbox-caption">{previewImage.alt}</p>
            )}
            <button
              type="button"
              className="customer-support__lightbox-close"
              onClick={() => setPreviewImage(null)}
              aria-label={english ? 'Close' : 'Đóng'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
