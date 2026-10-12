/*
  FILE NOTE
  - Mục đích: Trang xác thực tài khoản (đăng nhập, đăng ký, đăng nhập Google, xác thực 2 lớp 2FA và quên/đặt lại mật khẩu) với hiệu ứng chuyển đổi mượt mà.
  - Liên kết trực tiếp: src/App.jsx, src/api/customer.js, src/api/endpoint.js, src/api/userMessages.js, src/pages/Auth.css
  - Vùng ảnh hưởng khi sửa: Toàn bộ quy trình đăng nhập, đăng ký, khôi phục mật khẩu và luồng chuyển hướng tài khoản.
*/
import { useEffect, useState } from 'react'
import { customerApi } from '../api/customer'
import { apiEndpoint } from '../api/endpoint'
import { userMessage } from '../api/userMessages'
import './Auth.css'

async function migrateOldBrowserAccount(username, password) {
  let users
  try { users = JSON.parse(localStorage.getItem('storeDemoUsersV1') || '[]') } catch { return null }
  if (!Array.isArray(users)) return null
  const user = users.find((item) => item.username?.toLowerCase() === username.toLowerCase() || item.email === username.toLowerCase())
  if (!user || typeof user.salt !== 'string' || typeof user.hash !== 'string' || !/^(?:[a-f0-9]{2})+$/i.test(user.salt)) return null
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const salt = Uint8Array.from(user.salt.match(/../g), (byte) => Number.parseInt(byte, 16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256)
  const hash = Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (hash !== user.hash) return null
  return customerApi('/api/customer/register', { method: 'POST', body: JSON.stringify({ username: user.username, email: user.email, password }) })
}

export default function Auth({ mode, next = '/account', onLogin, onNavigate, language = 'vi', onLanguageChange }) {
  const english = language === 'en'
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialView = mode === '/register' ? 'register' : mode === '/forgot-password' ? 'forgot' : mode === '/reset-password' ? 'reset' : 'login'
  const [view, setView] = useState(initialView)
  const [error, setError] = useState(query.get('googleError') ? 'Đăng nhập Google thất bại. Vui lòng thử lại.' : '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [challengeId, setChallengeId] = useState(query.get('challengeId') || '')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [needTwoFactor, setNeedTwoFactor] = useState(query.get('twoFactor') === '1' || Boolean(query.get('challengeId')))
  const [googleReady, setGoogleReady] = useState(false)
  const [resetToken, setResetToken] = useState(query.get('token') || '')

  useEffect(() => {
    customerApi('/api/customer/auth/status').then((status) => setGoogleReady(Boolean(status?.google?.configured))).catch(() => {})
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const fields = new FormData(event.currentTarget)
    const username = String(fields.get('username') || '').trim()
    const email = String(fields.get('email') || '').trim().toLowerCase()
    const password = String(fields.get('password') || '')
    const newPassword = String(fields.get('newPassword') || '')
    if (view === 'forgot') {
      setBusy(true)
      try {
        await customerApi('/api/customer/password/forgot', { method: 'POST', body: JSON.stringify({ email }) })
        setMessage(english ? 'If the email exists, a reset link was sent (30 minutes).' : 'Nếu email tồn tại, link đặt lại đã được gửi (30 phút).')
      } catch (failure) { setError(userMessage(failure)) } finally { setBusy(false) }
      return
    }
    if (view === 'reset') {
      setBusy(true)
      try {
        if (!resetToken) throw new Error(english ? 'Missing reset token.' : 'Thiếu token đặt lại.')
        await customerApi('/api/customer/password/reset', { method: 'POST', body: JSON.stringify({ token: resetToken, password: newPassword }) })
        setMessage(english ? 'Password updated. Please sign in.' : 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
        setView('login')
      } catch (failure) { setError(userMessage(failure)) } finally { setBusy(false) }
      return
    }
    setBusy(true)
    try {
      let payload
      try {
        payload = await customerApi('/api/customer/' + (view === 'register' ? 'register' : 'login'), {
          method: 'POST', body: JSON.stringify(view === 'register' ? { username, email, password } : { username, password }),
        })
      } catch (failure) {
        if (view !== 'login' || failure.code !== 'INVALID_CREDENTIALS') throw failure
        payload = await migrateOldBrowserAccount(username, password)
        if (!payload) throw failure
      }
      if (payload && payload.twoFactorRequired && payload.challengeId) {
        setChallengeId(payload.challengeId)
        setNeedTwoFactor(true)
        setMessage(english ? 'Enter 6-digit code.' : 'Nhập mã 6 số từ ứng dụng Authenticator hoặc mã dự phòng.')
        return
      }
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/account')
    } catch (failure) {
      setError(userMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  async function verifyTwoFactor(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const payload = await customerApi('/api/customer/login/2fa', { method: 'POST', body: JSON.stringify({ challengeId, code: twoFactorCode }) })
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/account')
    } catch (failure) {
      setError(userMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  function startGoogle() {
    window.location.href = apiEndpoint('/api/customer/google/start?next=' + encodeURIComponent(next))
  }

  function switchAuthView(nextView) {
    if (nextView === view) return
    setError('')
    setMessage('')
    setNeedTwoFactor(false)
    setChallengeId('')
    setView(nextView)
    const queryString = '?next=' + encodeURIComponent(next)
    window.history.replaceState({}, '', (nextView === 'register' ? '/register' : '/login') + queryString)
  }

  function showValidation(event) {
    const input = event.target
    if (input.validity.valueMissing) input.setCustomValidity('Vui lòng điền thông tin này.')
    else if (input.validity.typeMismatch) input.setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ.')
    else if (input.validity.tooShort) input.setCustomValidity('Vui lòng nhập ít nhất ' + input.minLength + ' ký tự.')
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <div className="auth-topbar">
        <a className="auth-back" href="/">← {english ? 'Back to store' : 'Về cửa hàng'}</a>
        <label className="auth-language">
          <span className="sr-only">{english ? 'Language' : 'Ngôn ngữ'}</span>
          <select aria-label={english ? 'Language' : 'Ngôn ngữ'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">{english ? 'YOUR PRIVATE STORE SPACE' : 'MỘT GÓC RIÊNG CỦA BẠN'}</p>
      <div className="auth-header-stage" key={'header-' + view}>
        <h1>{view === 'register' ? (english ? 'Create a new account.' : 'Tạo tài khoản mới.') : view === 'forgot' ? (english ? 'Forgot password?' : 'Quên mật khẩu?') : view === 'reset' ? (english ? 'Reset password' : 'Đặt lại mật khẩu') : (english ? 'Welcome back.' : 'Chào mừng trở lại.')}</h1>
        <p className="auth-intro">{view === 'register' ? (english ? 'Create an account to save points, vouchers and orders.' : 'Tạo tài khoản để lưu điểm, voucher và đơn hàng.') : view === 'forgot' ? (english ? 'Enter email to receive reset link (30 minutes).' : 'Nhập email để nhận link đặt lại (30 phút).') : view === 'reset' ? (english ? 'Paste token and set new password.' : 'Dán token từ email và đặt mật khẩu mới.') : (english ? 'Sign in to view your orders and offers.' : 'Đăng nhập để xem đơn hàng và ưu đãi của bạn.')}</p>
      </div>
      <div className="auth-tabs" role="tablist" aria-label={english ? 'Account access' : 'Truy cập tài khoản'}>
        <button type="button" role="tab" aria-selected={view === 'login'} className={view === 'login' ? 'is-active' : ''} onClick={() => switchAuthView('login')}>{english ? 'Sign in' : 'Đăng nhập'}</button>
        <button type="button" role="tab" aria-selected={view === 'register'} className={view === 'register' ? 'is-active' : ''} onClick={() => switchAuthView('register')}>{english ? 'Register' : 'Đăng ký'}</button>
      </div>
      <div className={'auth-form-stage auth-form-stage--' + view} key={view + (needTwoFactor ? '-2fa' : '')}>
      {needTwoFactor && view === 'login' ? <form onSubmit={verifyTwoFactor}>
        <label>Mã xác thực 2 lớp<input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required placeholder="123456" /></label>
        <button type="submit" disabled={busy || !challengeId}>{busy ? 'Đang xử lý…' : 'Xác nhận 2 lớp'}</button>
        <button type="button" onClick={() => { setNeedTwoFactor(false); setChallengeId('') }}>Quay lại</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form> : <form onSubmit={submit} onInvalid={showValidation} onInput={(event) => event.target.setCustomValidity('')}>
        {view === 'register' && <><label>{english ? 'Name / username' : 'Họ tên / tên tài khoản'}<input name="username" autoComplete="username" minLength="2" required placeholder={english ? 'Your preferred name' : 'Tên bạn muốn dùng'} /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label></>}
        {view === 'login' && <label>{english ? 'Username or email' : 'Tên tài khoản hoặc email'}<input name="username" autoComplete="username" required placeholder={english ? 'Enter username or email' : 'Nhập tên hoặc email'} /></label>}
        {view === 'forgot' && <label>{english ? 'Local account email' : 'Email tài khoản cục bộ'}<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>}
        {view === 'reset' && <><label>Token từ email<input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required placeholder="token" /></label><label>Mật khẩu mới<input name="newPassword" type="password" autoComplete="new-password" minLength="8" required /></label></>}
        {view !== 'forgot' && view !== 'reset' && <label>{english ? 'Password' : 'Mật khẩu'}<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder={english ? 'At least 8 characters' : 'Ít nhất 8 ký tự'} /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">{english ? 'Forgot password?' : 'Quên mật khẩu?'}</a>}
        {view === 'forgot' && <a className="auth-forgot" href="/login">Về đăng nhập</a>}
        {view === 'reset' && <a className="auth-forgot" href="/forgot-password">Gửi lại link</a>}
        <button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : view === 'register' ? 'Tạo tài khoản' : view === 'forgot' ? 'Gửi link đặt lại' : view === 'reset' ? 'Đổi mật khẩu' : 'Đăng nhập'}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>}
      </div>
      {view === 'login' && !needTwoFactor && <div className="auth-google auth-google-stage"><button type="button" onClick={startGoogle} disabled={!googleReady} title={googleReady ? 'Đăng nhập bằng Google' : 'Chưa cấu hình GOOGLE_CLIENT_ID/SECRET'}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.31 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
        <span>Đăng nhập bằng Google{googleReady ? '' : ' (chưa cấu hình)'}</span>
      </button></div>}
      <p className="auth-disclaimer">Tài khoản được quản lý bởi hệ thống Store. Không dùng lại mật khẩu của dịch vụ khác.</p>
    </div>
  </div>
}
