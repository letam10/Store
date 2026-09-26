import { useState } from 'react'
import { customerApi } from '../api/customer'
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
      setMessage(english ? 'Store does not provide password recovery. Contact the administrator.' : 'Store chua cung cap dich vu khoi phuc mat khau. Vui long lien he quan tri vien.')
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
      onLogin(payload.account)
      onNavigate(next.startsWith('/') && !next.startsWith('//') ? next : '/account')
    } catch (failure) { setError(failure.message || (english ? 'Could not complete the demo action.' : 'Khong the hoan tat thao tac demo.')) }
    finally { setBusy(false) }
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <div className="auth-topbar"><a className="auth-back" href="/">← {english ? 'Back to store' : 'Ve cua hang'}</a><label className="auth-language"><span className="sr-only">{english ? 'Language' : 'Ngon ngu'}</span><select aria-label={english ? 'Language' : 'Ngon ngu'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}><option value="vi">VI</option><option value="en">EN</option></select></label></div>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">{english ? 'YOUR PRIVATE STORE SPACE' : 'MOT GOC RIENG CUA BAN'}</p>
      <h1>{view === 'register' ? (english ? 'Create a new account.' : 'Tao tai khoan moi.') : view === 'forgot' ? (english ? 'Forgot password?' : 'Quen mat khau?') : (english ? 'Welcome back.' : 'Chao mung tro lai.')}</h1>
      <p className="auth-intro">{view === 'register' ? (english ? 'Create an account to save points, vouchers and orders.' : 'Tao tai khoan de luu diem, voucher va don hang.') : view === 'forgot' ? (english ? 'Recover your account through the Store administrator.' : 'Khoi phuc tai khoan qua quan tri vien Store.') : (english ? 'Sign in to view your orders and offers.' : 'Dang nhap de xem don hang va uu dai cua ban.')}</p>
      <div className="auth-tabs"><a className={view === 'login' ? 'is-active' : ''} href={'/login?next=' + encodeURIComponent(next)}>{english ? 'Sign in' : 'Dang nhap'}</a><a className={view === 'register' ? 'is-active' : ''} href={'/register?next=' + encodeURIComponent(next)}>{english ? 'Register' : 'Dang ky'}</a></div>
      <form onSubmit={submit}>
        {view === 'register' && <><label>{english ? 'Name / username' : 'Ho ten / ten tai khoan'}<input name="username" autoComplete="username" minLength="2" required placeholder={english ? 'Your preferred name' : 'Ten ban muon dung'} /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label></>}
        {view === 'login' && <label>{english ? 'Username or email' : 'Ten tai khoan hoac email'}<input name="username" autoComplete="username" required placeholder={english ? 'Enter username or email' : 'Nhap ten hoac email'} /></label>}
        {view === 'forgot' && <label>{english ? 'Demo email' : 'Email demo'}<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>}
        {view !== 'forgot' && <label>{english ? 'Demo password' : 'Mat khau demo'}<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder={english ? 'At least 8 characters' : 'It nhat 8 ky tu'} /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">{english ? 'Forgot password?' : 'Quen mat khau?'}</a>}
        <button type="submit" disabled={busy}>{busy ? (english ? 'Processing…' : 'Dang xu ly…') : view === 'register' ? (english ? 'Create account →' : 'Tao tai khoan →') : view === 'forgot' ? (english ? 'See recovery options →' : 'Xem cach khoi phuc →') : (english ? 'Sign in →' : 'Dang nhap →')}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-disclaimer">{english ? 'This is a local demo account, not linked to real transactions. Do not reuse a password from another service.' : 'Chi la tai khoan demo cuc bo, khong lien ket may chu va khong dung cho giao dich that. Khong nhap mat khau ban dung o noi khac.'}</p>
    </div>
  </div>
}
