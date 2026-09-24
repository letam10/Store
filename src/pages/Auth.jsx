import { useState } from 'react'
import { customerApi } from '../api/customer'
import './Auth.css'

export default function Auth({ mode, next = '/account', onLogin, onNavigate }) {
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
      setMessage('Store chưa cung cấp dịch vụ khôi phục mật khẩu. Vui lòng liên hệ quản trị viên.')
      return
    }
    setBusy(true)
    try {
      const payload = await customerApi('/api/customer/' + (view === 'register' ? 'register' : 'login'), {
        method: 'POST', body: JSON.stringify(view === 'register' ? { username, email, password } : { username, password }),
      })
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/account')
    } catch (failure) { setError(failure.message || 'Không thể hoàn tất thao tác demo.') }
    finally { setBusy(false) }
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <a className="auth-back" href="/">← Về cửa hàng</a>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">MỘT GÓC RIÊNG CỦA BẠN</p>
      <h1>{view === 'register' ? 'Tạo tài khoản mới.' : view === 'forgot' ? 'Quên mật khẩu?' : 'Chào mừng trở lại.'}</h1>
      <p className="auth-intro">{view === 'register' ? 'Tạo tài khoản để lưu điểm, voucher và đơn hàng.' : view === 'forgot' ? 'Khôi phục tài khoản qua quản trị viên Store.' : 'Đăng nhập để xem đơn hàng và ưu đãi của bạn.'}</p>
      <div className="auth-tabs"><a className={view === 'login' ? 'is-active' : ''} href={'/login?next=' + encodeURIComponent(next)}>Đăng nhập</a><a className={view === 'register' ? 'is-active' : ''} href={'/register?next=' + encodeURIComponent(next)}>Đăng ký</a></div>
      <form onSubmit={submit}>
        {view === 'register' && <><label>Họ tên / tên tài khoản<input name="username" autoComplete="username" minLength="2" required placeholder="Tên bạn muốn dùng" /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="ban@example.com" /></label></>}
        {view === 'login' && <label>Tên tài khoản hoặc email<input name="username" autoComplete="username" required placeholder="Nhập tên hoặc email" /></label>}
        {view === 'forgot' && <label>Email demo<input name="email" type="email" autoComplete="email" required placeholder="ban@example.com" /></label>}
        {view !== 'forgot' && <label>Mật khẩu demo<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder="Ít nhất 8 ký tự" /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">Quên mật khẩu?</a>}
        <button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : view === 'register' ? 'Tạo tài khoản →' : view === 'forgot' ? 'Xem cách khôi phục →' : 'Đăng nhập →'}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-disclaimer">Chỉ là tài khoản demo cục bộ, không liên kết máy chủ và không dùng cho giao dịch thật. Không nhập mật khẩu bạn dùng ở nơi khác.</p>
    </div>
  </div>
}
