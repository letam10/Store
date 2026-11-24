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
import './AuthTheme.css'

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

export default function Auth({ mode, next = '/account', onLogin, onNavigate, language = 'vi' }) {
  const english = language === 'en'
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialView = mode === '/register' ? 'register' : mode === '/forgot-password' ? 'forgot' : mode === '/reset-password' ? 'reset' : 'login'
  const [view, setView] = useState(initialView)
  const googleErr = query.get('googleError')
  const initialGoogleError = googleErr
    ? (googleErr === 'access_denied'
        ? 'Truy cập bị từ chối: Tài khoản Gmail này chưa được thêm vào "Người dùng thử nghiệm" (Test users) trên Google Cloud Console.'
        : 'Đăng nhập Google thất bại. Vui lòng thử lại.')
    : ''
  const [error, setError] = useState(initialGoogleError)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [challengeId, setChallengeId] = useState(query.get('challengeId') || '')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [needTwoFactor, setNeedTwoFactor] = useState(query.get('twoFactor') === '1' || Boolean(query.get('challengeId')))
  const [googleStatus, setGoogleStatus] = useState('loading')
  const googleReady = googleStatus === 'ready'
  const [resetToken, setResetToken] = useState(query.get('token') || '')
  const [showPassword, setShowPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) document.body.classList.add('auth-tab-hidden')
      else document.body.classList.remove('auth-tab-hidden')
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  function handleKeyModifier(event) {
    if (event.getModifierState) {
      setCapsLockActive(event.getModifierState('CapsLock'))
    }
  }

  function calcPasswordScore(pass) {
    if (!pass) return 0
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }

  useEffect(() => {
    const controller = new AbortController()
    const check = () => customerApi('/api/customer/auth/status', { signal: controller.signal })
      .then(status => setGoogleStatus(status?.google?.configured ? 'ready' : 'unconfigured'))
      .catch(() => { if (!controller.signal.aborted) setGoogleStatus('unavailable') })
    check()
    window.addEventListener('focus', check)
    return () => { controller.abort(); window.removeEventListener('focus', check) }
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
        setMessage('Nếu email tồn tại, link đặt lại đã được gửi (30 phút).')
      } catch (failure) { setError(userMessage(failure)) } finally { setBusy(false) }
      return
    }
    if (view === 'reset') {
      setBusy(true)
      try {
        if (!resetToken) throw new Error('Thiếu token đặt lại.')
        await customerApi('/api/customer/password/reset', { method: 'POST', body: JSON.stringify({ token: resetToken, password: newPassword }) })
        setMessage('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
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
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      if (view === 'login' && (failure.status === 401 || failure.code === 'LOGIN_FAILED' || failure.code === 'INVALID_CREDENTIALS' || failure.code === 'UNAUTHENTICATED')) {
        setError(english ? 'Incorrect username or password. Please check again.' : 'Tên đăng nhập hoặc mật khẩu đã sai. Vui lòng kiểm tra lại.')
      } else {
        setError(userMessage(failure))
      }
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
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
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
    const path = nextView === 'register' ? '/register' : nextView === 'forgot' ? '/forgot-password' : nextView === 'reset' ? '/reset-password' : '/login'
    window.history.replaceState({}, '', path + queryString)
  }

  function showValidation(event) {
    const input = event.target
    if (input.validity.valueMissing) input.setCustomValidity('Vui lòng điền thông tin này.')
    else if (input.validity.typeMismatch) input.setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ.')
    else if (input.validity.tooShort) input.setCustomValidity('Vui lòng nhập ít nhất ' + input.minLength + ' ký tự.')
  }

  return (
    <div className="auth-screen">
      <div className="auth-ambient-glow" aria-hidden="true">
        <div className="auth-glow-orb auth-glow-orb--1" />
        <div className="auth-glow-orb auth-glow-orb--2" />
        <div className="auth-glow-orb auth-glow-orb--3" />
      </div>
      <div className="auth-photo-bg" aria-hidden="true">
        <img src="/auth-bg.jpg" alt="" className="auth-photo-bg__image" />
        <div className="auth-photo-overlay" />
      </div>
      <div className={'auth-panel' + (isShaking ? ' is-shaking' : '')}>
      <div className="auth-topbar">
        <a className="auth-back" href="/">← Về cửa hàng</a>
      </div>
      <div className="auth-brand">
        <img src="/brand-logo-square.jpg" alt="OmniCart" className="auth-brand-logo" />
        <span className="auth-mark">OmniCart<span>.</span></span>
      </div>
      <p className="auth-kicker">{view === 'forgot' ? 'KHÔI PHỤC TÀI KHOẢN' : view === 'reset' ? 'ĐẶT LẠI MẬT KHẨU' : 'MỘT GÓC RIÊNG CỦA BẠN'}</p>
      <div className="auth-header-stage" key={'header-' + view}>
        <h1>{view === 'register' ? 'Tạo tài khoản mới.' : view === 'forgot' ? 'Quên mật khẩu?' : view === 'reset' ? 'Đặt lại mật khẩu' : 'Chào mừng trở lại.'}</h1>
        <p className="auth-intro">{view === 'register' ? 'Tạo tài khoản để nhận ưu đãi, điểm thưởng và hóa đơn điện tử gửi về email.' : view === 'forgot' ? 'Nhập email để nhận link đặt lại mật khẩu trong 30 phút.' : view === 'reset' ? 'Dán token từ email và đặt mật khẩu mới.' : 'Đăng nhập để xem đơn hàng và ưu đãi của bạn.'}</p>
      </div>
      {(view === 'login' || view === 'register') && (
        <div className="auth-tabs" role="tablist" aria-label="Truy cập tài khoản">
          <button type="button" role="tab" aria-selected={view === 'login'} className={view === 'login' ? 'is-active' : ''} onClick={() => switchAuthView('login')}>Đăng nhập</button>
          <button type="button" role="tab" aria-selected={view === 'register'} className={view === 'register' ? 'is-active' : ''} onClick={() => switchAuthView('register')}>Đăng ký</button>
        </div>
      )}
      <div className={'auth-form-stage auth-form-stage--' + view} key={view + (needTwoFactor ? '-2fa' : '')}>
      {needTwoFactor && view === 'login' ? <form onSubmit={verifyTwoFactor}>
        <label className="auth-field">
          <span className="auth-field-label">Mã xác thực 2 lớp</span>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <input className="has-icon" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required placeholder="123456" />
          </div>
        </label>
        <button type="submit" disabled={busy || !challengeId} className={busy ? 'is-busy' : ''}>
          {busy ? <><span className="auth-spinner" aria-hidden="true" /><span>Đang xử lý…</span></> : 'Xác nhận 2 lớp'}
        </button>
        <button type="button" onClick={() => { setNeedTwoFactor(false); setChallengeId('') }}>Quay lại</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form> : <form onSubmit={submit} onInvalid={showValidation} onInput={(event) => event.target.setCustomValidity('')}>
        {view === 'register' && <>
          <label className="auth-field">
            <span className="auth-field-label">Họ tên / tên tài khoản</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input className="has-icon" name="username" autoComplete="username" minLength="2" required placeholder="Tên bạn muốn dùng" />
            </div>
          </label>
          <label className="auth-field">
            <span className="auth-field-label">Email</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input className="has-icon" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </div>
          </label>
        </>}
        {view === 'login' && (
          <label className="auth-field">
            <span className="auth-field-label">Tên tài khoản hoặc email</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input className="has-icon" name="username" autoComplete="username" required placeholder="Nhập tên tài khoản hoặc email" />
            </div>
          </label>
        )}
        {view === 'forgot' && (
          <label className="auth-field">
            <span className="auth-field-label">Email tài khoản</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input className="has-icon" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </div>
          </label>
        )}
        {view === 'reset' && <>
          <label className="auth-field">
            <span className="auth-field-label">Token từ email</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <input className="has-icon" value={resetToken} onChange={(event) => setResetToken(event.target.value)} required placeholder="Nhập mã token từ email" />
            </div>
          </label>
          <label className="auth-field">
            <span className="auth-field-label">Mật khẩu mới</span>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                className="has-icon has-eye"
                name="newPassword"
                type={showResetPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength="8"
                required
                placeholder="Ít nhất 8 ký tự"
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={handleKeyModifier}
                onKeyUp={handleKeyModifier}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowResetPassword(!showResetPassword)}
                aria-label={showResetPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex="-1"
              >
                {showResetPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {capsLockActive && (
              <div className="auth-caps-hint" role="status">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0-12 5 5m-5-5-5 5M5 21h14"/></svg>
                <span>Caps Lock đang bật</span>
              </div>
            )}
            {passwordInput && (
              <div className="auth-strength-meter">
                <div className="auth-strength-meter__bars">
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 1 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 2 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 3 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 4 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                </div>
                <span className="auth-strength-meter__label">
                  {calcPasswordScore(passwordInput) <= 1 ? (english ? 'Weak' : 'Mật khẩu yếu') :
                   calcPasswordScore(passwordInput) === 2 ? (english ? 'Fair' : 'Trung bình') :
                   calcPasswordScore(passwordInput) === 3 ? (english ? 'Good' : 'Khá mạnh') :
                   (english ? 'Strong' : 'Rất mạnh')}
                </span>
              </div>
            )}
          </label>
        </>}
        {view !== 'forgot' && view !== 'reset' && (
          <label className="auth-field">
            {view === 'login' ? (
              <div className="auth-field-header">
                <span className="auth-field-label">Mật khẩu</span>
                <a className="auth-forgot" href={'/forgot-password?next=' + encodeURIComponent(next)} onClick={(event) => { event.preventDefault(); switchAuthView('forgot') }}>Quên mật khẩu?</a>
              </div>
            ) : (
              <span className="auth-field-label">Mật khẩu</span>
            )}
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                className="has-icon has-eye"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={view === 'register' ? 'new-password' : 'current-password'}
                minLength="8"
                required
                placeholder={view === 'register' ? 'Tạo mật khẩu ít nhất 8 ký tự' : 'Nhập mật khẩu'}
                onChange={view === 'register' ? (e) => setPasswordInput(e.target.value) : undefined}
                onKeyDown={handleKeyModifier}
                onKeyUp={handleKeyModifier}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {capsLockActive && (
              <div className="auth-caps-hint" role="status">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0-12 5 5m-5-5-5 5M5 21h14"/></svg>
                <span>Caps Lock đang bật</span>
              </div>
            )}
            {view === 'register' && passwordInput && (
              <div className="auth-strength-meter">
                <div className="auth-strength-meter__bars">
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 1 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 2 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 3 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                  <div className={'auth-strength-meter__bar ' + (calcPasswordScore(passwordInput) >= 4 ? 'is-active level-' + calcPasswordScore(passwordInput) : '')} />
                </div>
                <span className="auth-strength-meter__label">
                  {calcPasswordScore(passwordInput) <= 1 ? (english ? 'Weak' : 'Mật khẩu yếu') :
                   calcPasswordScore(passwordInput) === 2 ? (english ? 'Fair' : 'Trung bình') :
                   calcPasswordScore(passwordInput) === 3 ? (english ? 'Good' : 'Khá mạnh') :
                   (english ? 'Strong' : 'Rất mạnh')}
                </span>
              </div>
            )}
          </label>
        )}
        <button type="submit" disabled={busy} className={busy ? 'is-busy' : ''}>
          {busy ? (
            <><span className="auth-spinner" aria-hidden="true" /><span>Đang xử lý…</span></>
          ) : (
            view === 'register' ? 'Tạo tài khoản' : view === 'forgot' ? 'Gửi link đặt lại' : view === 'reset' ? 'Đổi mật khẩu' : 'Đăng nhập'
          )}
        </button>
        {view === 'forgot' && <a className="auth-forgot auth-forgot--return" href={'/login?next=' + encodeURIComponent(next)} onClick={(event) => { event.preventDefault(); switchAuthView('login') }}>← Về đăng nhập</a>}
        {view === 'reset' && <a className="auth-forgot auth-forgot--return" href={'/forgot-password?next=' + encodeURIComponent(next)} onClick={(event) => { event.preventDefault(); switchAuthView('forgot') }}>← Gửi lại link</a>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>}
      </div>
      {view === 'login' && !needTwoFactor && (
        <div className="auth-google-section">
          <div className="auth-divider">
            <span>hoặc</span>
          </div>
          <div className="auth-google auth-google-stage">
            <button type="button" onClick={startGoogle} disabled={!googleReady} title={googleReady ? 'Đăng nhập bằng Google' : 'Trạng thái kết nối đăng nhập Google'}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.31 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
              <span>{googleReady ? 'Đăng nhập bằng Google' : googleStatus === 'loading' ? 'Đang kiểm tra đăng nhập Google…' : googleStatus === 'unavailable' ? 'Chưa kết nối được máy chủ' : 'Đăng nhập Google chưa được bật'}</span>
            </button>
          </div>
        </div>
      )}
      <p className="auth-disclaimer">Tài khoản được quản lý bởi hệ thống OmniCart. Không dùng lại mật khẩu của dịch vụ khác.</p>
    </div>
  </div>
  )
}
