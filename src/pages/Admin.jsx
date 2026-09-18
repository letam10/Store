import { useEffect, useMemo, useRef, useState } from 'react'
import { apiJson, streamChat } from '../api/chat'
import './Admin.css'

const CONVERSATION_KEY = 'storeAdminConversationId'

function localId() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + String(Math.random())
}

function businessToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' ₫'
}

export default function Admin() {
  const today = useMemo(() => businessToday(), [])
  const [session, setSession] = useState(null)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [settings, setSettings] = useState(null)
  const [contextSize, setContextSize] = useState(16384)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState('')
  const [compactStatus, setCompactStatus] = useState('not_needed')
  const [sources, setSources] = useState([])
  const [report, setReport] = useState(null)
  const [range, setRange] = useState({
    from: today.slice(0, 8) + '01',
    to: today,
  })
  const abortRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => {
    apiJson('/api/admin/session')
      .then(setSession)
      .catch(() => setSession(false))
  }, [])

  useEffect(() => {
    if (!session?.authenticated) return
    let cancelled = false
    apiJson('/api/admin/settings').then((payload) => {
      if (cancelled) return
      setSettings(payload)
      setContextSize(payload.contextSize)
    })

    const savedConversation = sessionStorage.getItem(CONVERSATION_KEY)
    if (savedConversation) {
      apiJson('/api/admin/conversations/' + encodeURIComponent(savedConversation))
        .then((payload) => {
          if (cancelled) return
          setConversationId(payload.conversationId)
          setCompactStatus(payload.compactStatus)
          setMessages(payload.messages.map((message) => ({
            id: 'server-' + message.id,
            role: message.role,
            content: message.content,
            sources: message.sources || [],
          })))
        })
        .catch(() => sessionStorage.removeItem(CONVERSATION_KEY))
    }

    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, activity])

  async function login(event) {
    event.preventDefault()
    setLoginError('')
    try {
      const payload = await apiJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setCredentials((current) => ({ ...current, password: '' }))
      setSession(payload)
    } catch (error) {
      setCredentials((current) => ({ ...current, password: '' }))
      setLoginError(error.code === 'RATE_LIMITED' ? 'Đăng nhập bị giới hạn tạm thời.' : 'Sai tài khoản hoặc mật khẩu.')
    }
  }

  async function logout() {
    if (!session?.csrfToken) return
    await apiJson('/api/admin/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': session.csrfToken },
    })
    sessionStorage.removeItem(CONVERSATION_KEY)
    setSession(false)
    setMessages([])
    setConversationId('')
  }

  async function saveContext() {
    if (!session?.csrfToken) return
    const payload = await apiJson('/api/admin/settings', {
      method: 'PUT',
      headers: { 'x-csrf-token': session.csrfToken },
      body: JSON.stringify({ contextSize }),
    })
    setSettings((current) => ({ ...current, contextSize: payload.contextSize }))
  }

  async function loadStats(event) {
    event?.preventDefault()
    try {
      const payload = await apiJson(
        '/api/admin/stats?from=' + encodeURIComponent(range.from) + '&to=' + encodeURIComponent(range.to),
      )
      setReport(payload.report)
    } catch {
      setReport(null)
    }
  }

  function updateAssistant(id, updater) {
    setMessages((previous) => previous.map((message) =>
      message.id === id ? updater(message) : message,
    ))
  }

  async function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || busy || !session?.csrfToken) return

    const assistantId = localId()
    setMessages((previous) => [
      ...previous,
      { id: localId(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '', sources: [] },
    ])
    setDraft('')
    setBusy(true)
    setActivity('Đang phân tích')
    setSources([])
    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        endpoint: '/api/admin/chat',
        message: content,
        conversationId,
        csrfToken: session.csrfToken,
        signal: controller.signal,
        onEvent: (streamEvent) => {
          if (streamEvent.type === 'conversation') {
            setConversationId(streamEvent.conversationId)
            sessionStorage.setItem(CONVERSATION_KEY, streamEvent.conversationId)
            setCompactStatus(streamEvent.compactStatus || 'not_needed')
          } else if (streamEvent.type === 'status') {
            setActivity(streamEvent.label || 'Đang phân tích')
          } else if (streamEvent.type === 'delta') {
            updateAssistant(assistantId, (message) => ({
              ...message,
              content: message.content + streamEvent.content,
            }))
          } else if (streamEvent.type === 'sources') {
            setSources(streamEvent.sources || [])
            updateAssistant(assistantId, (message) => ({ ...message, sources: streamEvent.sources || [] }))
          } else if (streamEvent.type === 'report') {
            setReport(streamEvent.report)
          } else if (streamEvent.type === 'done') {
            setCompactStatus(streamEvent.compactStatus || 'not_needed')
          }
        },
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        updateAssistant(assistantId, (message) => ({
          ...message,
          content: message.content || 'Không thể hoàn tất phân tích: ' + error.message,
        }))
      }
    } finally {
      abortRef.current = null
      setBusy(false)
      setActivity('')
    }
  }

  if (session === null) {
    return <main className="admin-shell"><p>Đang kiểm tra phiên admin…</p></main>
  }

  if (!session?.authenticated) {
    return (
      <main className="admin-shell admin-shell--login">
        <form className="admin-login" onSubmit={login}>
          <p className="admin-eyebrow">STORE ADMIN</p>
          <h1>Đăng nhập</h1>
          <p>Trang này chỉ mở dữ liệu admin sau khi backend xác thực.</p>
          <label>Tài khoản<input autoComplete="username" value={credentials.username} onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))} /></label>
          <label>Mật khẩu<input type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} /></label>
          {loginError && <p className="admin-error" role="alert">{loginError}</p>}
          <button type="submit">Đăng nhập</button>
          <a href="/">← Quay lại Store</a>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="admin-eyebrow">STORE ADMIN · AI LOCAL</p><h1>Phân tích nội bộ</h1></div>
        <div className="admin-header__actions"><span>{session.username}</span><button type="button" onClick={logout}>Đăng xuất</button></div>
      </header>

      <section className="admin-meta" aria-label="Cấu hình AI">
        <div><small>Model</small><strong>{settings?.model || 'qwen3.5:4b'}</strong></div>
        <div><small>Thinking</small><strong>Bật · khóa tại backend</strong></div>
        <div><small>Compact</small><strong>{compactStatus}</strong></div>
        <div className="admin-context">
          <label>Context
            <select value={contextSize} onChange={(event) => setContextSize(Number(event.target.value))}>
              {(settings?.allowedContextSizes || [8192, 16384, 32768, 65536]).map((size) => (
                <option key={size} value={size}>{size === 65536 ? '64K · thử nghiệm' : (size / 1024) + 'K'}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={saveContext}>Lưu</button>
        </div>
      </section>

      <p className="admin-warning">64K chỉ là cấu hình thử nghiệm. Chưa có benchmark gần đầy context trên RTX 3050 6GB thì không được coi là đã đạt.</p>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><p className="admin-eyebrow">SỐ LIỆU GỐC</p><h2>Doanh thu backend</h2></div><span>Asia/Ho_Chi_Minh</span></div>
          <form className="admin-range" onSubmit={loadStats}>
            <label>Từ<input type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /></label>
            <label>Đến<input type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></label>
            <button type="submit">Tải số liệu</button>
          </form>
          {report ? (
            <dl className="admin-stats">
              <div><dt>Doanh thu gộp</dt><dd>{formatMoney(report.grossRevenue)}</dd></div>
              <div><dt>Hoàn tiền đã trừ</dt><dd>{formatMoney(report.refunds)}</dd></div>
              <div><dt>Doanh thu ròng</dt><dd>{formatMoney(report.netRevenue)}</dd></div>
              <div><dt>Đơn được tính</dt><dd>{report.includedOrders}</dd></div>
            </dl>
          ) : <p className="admin-muted">Chọn khoảng thời gian để lấy số liệu trực tiếp từ backend.</p>}
          {report && <p className="admin-source">Nguồn: backend SQLite · {report.from} → {report.to} · dữ liệu: {report.dataMode}</p>}
        </section>

        <section className="admin-panel admin-chat">
          <div className="admin-panel__heading"><div><p className="admin-eyebrow">AI NHẬN XÉT</p><h2>Chat admin</h2></div><span>Thinking: Bật</span></div>
          <div ref={logRef} className="admin-chat__log" role="log" aria-live="polite">
            {messages.length === 0 && <p className="admin-muted">Hỏi về sản phẩm hoặc doanh thu. Với báo cáo, AI chỉ diễn giải số liệu backend đã tính.</p>}
            {messages.map((message) => (
              <div key={message.id} className={'admin-chat__message admin-chat__message--' + message.role}>
                <small>{message.role === 'user' ? 'Admin' : 'AI local'}</small>
                <p>{message.content || (busy && message.role === 'assistant' ? '…' : '')}</p>
              </div>
            ))}
            {busy && <p className="admin-thinking">{activity || 'Đang phân tích'}</p>}
          </div>
          {sources.length > 0 && <div className="admin-chat__sources">{sources.map((source) => <span key={source.id}>Nguồn: {source.label}</span>)}</div>}
          <form className="admin-chat__form" onSubmit={sendMessage}>
            <textarea maxLength={2000} rows="3" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ví dụ: Phân tích doanh thu tháng này…" disabled={busy} />
            {busy
              ? <button type="button" onClick={() => abortRef.current?.abort()}>Dừng</button>
              : <button type="submit" disabled={!draft.trim()}>Gửi</button>}
          </form>
        </section>
      </div>
    </main>
  )
}
