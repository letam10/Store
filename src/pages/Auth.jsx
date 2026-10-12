/**
 * @codex-vn-doc
 * Tệp: src/pages/Auth.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Auth.
 * Liên kết trực tiếp: react, ../api/customer.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useState } from 'react'
import { customerApi } from '../api/customer'
import { userMessage } from '../api/userMessages'
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
export default function Auth({ mode, next = '/account', onLogin, onNavigate, language = 'vi', onLanguageChange }) {
  const english = language === 'en'
  const view = mode === '/register' ? 'register' : mode === '/forgot-password' ? 'forgot' : 'login'
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
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
    } catch (failure) {
      setError(userMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  function showValidation(event) {
    const input = event.target
    if (input.validity.valueMissing) input.setCustomValidity('Vui lòng điền thông tin này.')
    else if (input.validity.typeMismatch) input.setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ.')
    else if (input.validity.tooShort) {
      input.setCustomValidity('Vui lòng nhập ít nhất ' + input.minLength + ' ký tự.')
    }
  }

  return <div className="auth-screen">
    <div className="auth-panel">
      <div className="auth-topbar"><a className="auth-back" href="/">← {english ? 'Back to store' : 'Ve cua hang'}</a><label className="auth-language"><span className="sr-only">{english ? 'Language' : 'Ngon ngu'}</span><select aria-label={english ? 'Language' : 'Ngon ngu'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}><option value="vi">VI</option><option value="en">EN</option></select></label></div>
      <span className="auth-mark">store<span>.</span></span>
      <p className="auth-kicker">{english ? 'YOUR PRIVATE STORE SPACE' : 'MOT GOC RIENG CUA BAN'}</p>
      <h1>{view === 'register' ? (english ? 'Create a new account.' : 'Tao tai khoan moi.') : view === 'forgot' ? (english ? 'Forgot password?' : 'Quen mat khau?') : (english ? 'Welcome back.' : 'Chao mung tro lai.')}</h1>
      <p className="auth-intro">{view === 'register' ? (english ? 'Create an account to save points, vouchers and orders.' : 'Tao tai khoan de luu diem, voucher va don hang.') : view === 'forgot' ? (english ? 'Recover your account through the Store administrator.' : 'Khoi phuc tai khoan qua quan tri vien Store.') : (english ? 'Sign in to view your orders and offers.' : 'Dang nhap de xem don hang va uu dai cua ban.')}</p>
      <div className="auth-tabs"><a className={view === 'login' ? 'is-active' : ''} href={'/login?next=' + encodeURIComponent(next)}>{english ? 'Sign in' : 'Dang nhap'}</a><a className={view === 'register' ? 'is-active' : ''} href={'/register?next=' + encodeURIComponent(next)}>{english ? 'Register' : 'Dang ky'}</a></div>
      <form onSubmit={submit} onInvalid={showValidation} onInput={(event) => event.target.setCustomValidity('')}>
        {view === 'register' && <><label>{english ? 'Name / username' : 'Ho ten / ten tai khoan'}<input name="username" autoComplete="username" minLength="2" required placeholder={english ? 'Your preferred name' : 'Ten ban muon dung'} /></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label></>}
        {view === 'login' && <label>{english ? 'Username or email' : 'Ten tai khoan hoac email'}<input name="username" autoComplete="username" required placeholder={english ? 'Enter username or email' : 'Nhap ten hoac email'} /></label>}
        {view === 'forgot' && <label>{english ? 'Local account email' : 'Email tài khoản cục bộ'}<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>}
        {view !== 'forgot' && <label>{english ? 'Password' : 'Mật khẩu'}<input name="password" type="password" autoComplete={view === 'register' ? 'new-password' : 'current-password'} minLength="8" required placeholder={english ? 'At least 8 characters' : 'It nhat 8 ky tu'} /></label>}
        {view === 'login' && <a className="auth-forgot" href="/forgot-password">{english ? 'Forgot password?' : 'Quen mat khau?'}</a>}
        <button type="submit" disabled={busy}>
          {busy ? 'Đang xử lý…' : view === 'register'
            ? (english ? 'Create account →' : 'Tạo tài khoản →') : view === 'forgot'
              ? (english ? 'See recovery options →' : 'Xem cách khôi phục →')
              : (english ? 'Sign in →' : 'Đăng nhập →')}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <p className="auth-disclaimer">
        Tài khoản được quản lý bởi hệ thống Store. Không dùng lại mật khẩu của dịch vụ khác.
      </p>
    </div>
  </div>
}
