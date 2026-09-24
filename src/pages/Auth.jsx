import { useState } from 'react'
import './Auth.css'

const USERS_KEY = 'storeDemoUsersV1'

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/../g).map((byte) => Number.parseInt(byte, 16))), iterations: 120000, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default function Auth({ mode, onLogin, onNavigate }) {
  const view = mode === '/register' ? 'register' : mode === '/forgot-password' ? 'forgot' : 'login'
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const fields = new FormData(event.currentTarget)
    const username = String(fields.get('username') || '').trim()
    const email = String(fields.get('email') || '').trim().toLowerCase()
    const password = String(fields.get('password') || '')
    if (view === 'forgot') {
      setMessage('Đây là tài khoản demo lưu trên trình duyệt, chưa có dịch vụ gửi email hoặc khôi phục mật khẩu. Bạn có thể tạo tài khoản demo mới.')
      return
    }
    setBusy(true)
    try {
      const users = readUsers()
      if (view === 'register') {
        if (password.length < 8) throw new Error('Mật khẩu demo cần ít nhất 8 ký tự.')
        if (users.some((user) => user.username.toLowerCase() === username.toLowerCase() || user.email === email)) throw new Error('Tên hoặc email này đã có trên trình duyệt.')
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
        users.push({ username, email, salt, hash: await passwordHash(password, salt) })
        localStorage.setItem(USERS_KEY, JSON.stringify(users))
        onLogin({ username, email, mode: 'demo' })
      } else {
        const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase() || item.email === username.toLowerCase())
        if (!user || user.hash !== await passwordHash(password, user.salt)) throw new Error('Tên đăng nhập hoặc mật khẩu demo không đúng.')
        onLogin({ username: user.username, email: user.email, mode: 'demo' })
      }
      onNavigate('/account')
    } catch (failure) { setError(failure.message || 'Không thể hoàn tất thao tác demo.') }
    finally { setBusy(false) }
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <a className="auth-back" href="/">← Về cửa hàng</a>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">MỘT GÓC RIÊNG CỦA BẠN</p>
      <h1>{view === 'register' ? 'Tạo tài khoản mới.' : view === 'forgot' ? 'Quên mật khẩu?' : 'Chào mừng trở lại.'}</h1>
      <p className="auth-intro">{view === 'register' ? 'Lưu trải nghiệm mua sắm và ưu đãi demo ngay trên trình duyệt.' : view === 'forgot' ? 'Thông tin tài khoản này chỉ nằm trên trình duyệt hiện tại.' : 'Đăng nhập để xem đơn demo và ưu đãi của bạn.'}</p>
      <div className="auth-tabs"><a className={view === 'login' ? 'is-active' : ''} href="/login">Đăng nhập</a><a className={view === 'register' ? 'is-active' : ''} href="/register">Đăng ký</a></div>
      <form onSubmit={submit}>
        {view === 'register' && <><label>Họ tên / tên tài khoản<input name="username" autoComplete="username" minLength="2" required placeholder="Tên bạn muốn dùng" /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="ban@example.com" /></label></>}
        {view === 'login' && <label>Tên tài khoản hoặc email<input name="username" autoComplete="username" required placeholder="Nhập tên hoặc email" /></label>}
        {view === 'forgot' && <label>Email demo<input name="email" type="email" autoComplete="email" required placeholder="ban@example.com" /></label>}
        {view !== 'forgot' && <label>Mật khẩu demo<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder="Ít nhất 8 ký tự" /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">Quên mật khẩu?</a>}
        <button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : view === 'register' ? 'Tạo tài khoản demo →' : view === 'forgot' ? 'Xem cách khôi phục →' : 'Đăng nhập →'}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-disclaimer">Chỉ là tài khoản demo cục bộ, không liên kết máy chủ và không dùng cho giao dịch thật. Không nhập mật khẩu bạn dùng ở nơi khác.</p>
    </div>
  </div>
}
