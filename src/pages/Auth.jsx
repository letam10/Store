/**
 * @codex-vn-doc
 * Tệp: src/pages/Auth.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Auth.
 * Liên kết trực tiếp: react, ../api/customer.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useState } from 'react'
import { customerApi } from '../api/customer'
import { apiEndpoint } from '../api/endpoint'
import './Auth.css'

// Chức năng migrateOldBrowserAccount: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
async function migrateOldBrowserAccount(username, password) {
  let users
  try { users = JSON.parse(localStorage.getItem('storeDemoUsersV1') || '[]') } catch { return null }
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!Array.isArray(users)) return null
  const user = users.find((item) => item.username?.toLowerCase() === username.toLowerCase() || item.email === username.toLowerCase())
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!user || typeof user.salt !== 'string' || typeof user.hash !== 'string' || !/^(?:[a-f0-9]{2})+$/i.test(user.salt)) return null
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const salt = Uint8Array.from(user.salt.match(/../g), (byte) => Number.parseInt(byte, 16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256)
  const hash = Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (hash !== user.hash) return null
  return customerApi('/api/customer/register', { method: 'POST', body: JSON.stringify({ username: user.username, email: user.email, password }) })
}

// Chức năng Auth: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Auth({ mode, next = '/', onLogin, onNavigate, language = 'vi', onLanguageChange }) {
  const english = language === 'en'
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialView = mode === '/register' ? 'register' : mode === '/forgot-password' ? 'forgot' : mode === '/reset-password' ? 'reset' : 'login'
  const [view, setView] = useState(initialView)
  const [error, setError] = useState(query.get('googleError') ? 'Dang nhap Google that bai. Vui long thu lai.' : '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [challengeId, setChallengeId] = useState(query.get('challengeId') || '')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [needTwoFactor, setNeedTwoFactor] = useState(query.get('twoFactor') === '1' || Boolean(query.get('challengeId')))
  const [googleReady, setGoogleReady] = useState(false)
  const [resetToken, setResetToken] = useState(query.get('token') || '')

  useEffect(() => {
    setView(initialView)
    setResetToken(query.get('token') || '')
    const cid = query.get('challengeId') || ''
    if (cid) { setChallengeId(cid); setNeedTwoFactor(true) }
    else if (query.get('twoFactor') === '1') setNeedTwoFactor(true)
    if (query.get('googleError')) setError('Dang nhap Google that bai. Vui long thu lai.')
    customerApi('/api/customer/auth/status').then((s) => setGoogleReady(Boolean(s?.google?.configured))).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
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
        setMessage(english ? 'If the email exists, a reset link was sent (30 minutes).' : 'Neu email ton tai, link dat lai da duoc gui (30 phut).')
      } catch (failure) { setError(failure.message) } finally { setBusy(false) }
      return
    }
    if (view === 'reset') {
      setBusy(true)
      try {
        if (!resetToken) throw new Error(english ? 'Missing reset token.' : 'Thieu token dat lai.')
        await customerApi('/api/customer/password/reset', { method: 'POST', body: JSON.stringify({ token: resetToken, password: newPassword }) })
        setMessage(english ? 'Password updated. Please sign in.' : 'Da doi mat khau. Vui long dang nhap lai.')
        setView('login')
      } catch (failure) { setError(failure.message) } finally { setBusy(false) }
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
        setMessage(english ? 'Enter 6-digit code.' : 'Nhap ma 6 so tu app Authenticator (hoac backup code).')
        return
      }
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/')
    } catch (failure) { setError(failure.message || (english ? 'Could not complete the action.' : 'Không thể hoàn tất thao tác.')) }
    finally { setBusy(false) }
  }

  async function verifyTwoFactor(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const payload = await customerApi('/api/customer/login/2fa', { method: 'POST', body: JSON.stringify({ challengeId, code: twoFactorCode }) })
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/')
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  function startGoogle() {
    window.location.href = apiEndpoint('/api/customer/google/start?next=' + encodeURIComponent(next))
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <div className="auth-topbar"><a className="auth-back" href="/">← {english ? 'Back to store' : 'Ve cua hang'}</a><label className="auth-language"><span className="sr-only">{english ? 'Language' : 'Ngon ngu'}</span><select aria-label={english ? 'Language' : 'Ngon ngu'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}><option value="vi">VI</option><option value="en">EN</option></select></label></div>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">{english ? 'YOUR PRIVATE STORE SPACE' : 'MOT GOC RIENG CUA BAN'}</p>
      <h1>{view === 'register' ? (english ? 'Create a new account.' : 'Tao tai khoan moi.') : view === 'forgot' ? (english ? 'Forgot password?' : 'Quen mat khau?') : view === 'reset' ? (english ? 'Reset password' : 'Dat lai mat khau') : (english ? 'Welcome back.' : 'Chao mung tro lai.')}</h1>
      <p className="auth-intro">{view === 'register' ? (english ? 'Create an account to save points, vouchers and orders.' : 'Tao tai khoan de luu diem, voucher va don hang.') : view === 'forgot' ? (english ? 'Enter email to receive reset link (30 minutes).' : 'Nhap email de nhan link dat lai (30 phut).') : view === 'reset' ? (english ? 'Paste token and set new password.' : 'Dan token tu email va dat mat khau moi.') : (english ? 'Sign in to view your orders and offers.' : 'Dang nhap de xem don hang va uu dai cua ban.')}</p>
      <div className="auth-tabs"><a className={view === 'login' ? 'is-active' : ''} href={'/login?next=' + encodeURIComponent(next)}>{english ? 'Sign in' : 'Dang nhap'}</a><a className={view === 'register' ? 'is-active' : ''} href={'/register?next=' + encodeURIComponent(next)}>{english ? 'Register' : 'Dang ky'}</a></div>
      {needTwoFactor && view === 'login' ? <form onSubmit={verifyTwoFactor}>
        <label>Ma 2 lop (6 so / backup)<input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required placeholder="123456" /></label>
        <button type="submit" disabled={busy || !challengeId}>{busy ? 'Dang xu ly...' : 'Xac nhan 2 lop'}</button>
        <button type="button" onClick={() => { setNeedTwoFactor(false); setChallengeId('') }}>Quay lai</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form> : <form onSubmit={submit}>
        {view === 'register' && <><label>Ho ten / ten tai khoan<input name="username" autoComplete="username" minLength="2" required placeholder="Ten ban muon dung" /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label></>}
        {view === 'login' && <label>Ten tai khoan hoac email<input name="username" autoComplete="username" required placeholder="Nhap ten hoac email" /></label>}
        {view === 'forgot' && <label>Email tai khoan<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>}
        {view === 'reset' && <><label>Token tu email<input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required placeholder="token" /></label><label>Mat khau moi (8+ ky tu)<input name="newPassword" type="password" autoComplete="new-password" minLength="8" required /></label></>}
        {view !== 'forgot' && view !== 'reset' && <label>Mat khau<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder="It nhat 8 ky tu" /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">Quen mat khau?</a>}
        {view === 'forgot' && <a className="auth-forgot" href="/login">Ve dang nhap</a>}
        {view === 'reset' && <a className="auth-forgot" href="/forgot-password">Gui lai link</a>}
        <button type="submit" disabled={busy}>{busy ? 'Dang xu ly...' : view === 'register' ? 'Tao tai khoan' : view === 'forgot' ? 'Gui link dat lai' : view === 'reset' ? 'Doi mat khau' : 'Dang nhap'}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>}
      {view === 'login' && !needTwoFactor && <div style={{ marginTop: 12, display: 'grid', gap: 8 }}><button type="button" onClick={startGoogle} disabled={!googleReady} title={googleReady ? 'Dang nhap bang Google' : 'Chua cau hinh GOOGLE_CLIENT_ID/SECRET'} style={{ minHeight: 44, borderRadius: 11, border: '1px solid #ded5e8', background: '#fff', fontWeight: 800, cursor: googleReady ? 'pointer' : 'not-allowed', opacity: googleReady ? 1 : 0.6 }}>G Dang nhap bang Google{googleReady ? '' : ' (chua cau hinh)'}</button></div>}
      <p className="auth-disclaimer">Bao mat: scrypt, session HttpOnly SameSite=Strict + CSRF, reset 1 lan 30 phut, 2FA TOTP 30s + backup 1 lan.</p>
    </div>
  </div>
}
