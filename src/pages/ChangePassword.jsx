/*
  FILE NOTE
  - Mục đích: Trang Đổi Mật Khẩu (Change Password) dành cho người dùng đã đăng nhập với thiết kế kính mờ sang trọng, thanh đo độ mạnh mật khẩu và hiệu ứng hoàn tất mượt mà.
  - Liên kết trực tiếp: src/App.jsx, src/pages/Account.jsx, src/api/customer.js, src/pages/ChangePassword.css
  - Vùng ảnh hưởng khi sửa: Trực tiếp tới chức năng cập nhật mật khẩu của khách hàng trên Store.
*/
import { useState, useMemo, useEffect } from 'react'
import { customerApi } from '../api/customer'
import { userMessage } from '../api/userMessages'
import './ChangePassword.css'

export default function ChangePassword({ account, onNavigate, language = 'vi' }) {
  const english = language === 'en'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(4)

  // Đánh giá độ mạnh mật khẩu theo thang 0 - 4 điểm
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '' }
    let score = 0
    if (newPassword.length >= 8) score += 1
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 1

    if (score <= 1) return { score: 1, label: english ? 'Weak' : 'Yếu', color: '#ef4444' }
    if (score === 2) return { score: 2, label: english ? 'Fair' : 'Trung bình', color: '#f59e0b' }
    if (score === 3) return { score: 3, label: english ? 'Good' : 'Khá', color: '#84cc16' }
    return { score: 4, label: english ? 'Strong' : 'Rất mạnh', color: '#10b981' }
  }, [newPassword, english])

  const checks = useMemo(() => ({
    length: newPassword.length >= 8,
    mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    hasNumberOrSpecial: /[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword),
    matches: confirmPassword.length > 0 && newPassword === confirmPassword,
  }), [newPassword, confirmPassword])

  // Tự động chuyển trang về Account sau khi đổi mật khẩu thành công
  useEffect(() => {
    if (!success) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleBack()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [success])

  function handleBack() {
    if (onNavigate) onNavigate('/account')
    else window.location.href = '/account'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!currentPassword) {
      setError(english ? 'Please enter your current password.' : 'Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (newPassword.length < 8) {
      setError(english ? 'New password must have at least 8 characters.' : 'Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }

    if (newPassword === currentPassword) {
      setError(english ? 'New password cannot be the same as your current password.' : 'Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError(english ? 'Password confirmation does not match.' : 'Mật khẩu xác nhận không khớp với mật khẩu mới.')
      return
    }

    setBusy(true)
    try {
      await customerApi('/api/customer/password/change', {
        method: 'POST',
        csrfToken: account?.csrfToken,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      setSuccess(true)
    } catch (failure) {
      setError(userMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="change-pwd-screen">
      <div className="auth-video-bg" aria-hidden="true">
        <iframe
          src="https://www.youtube.com/embed/2qeTbiQ57C0?autoplay=1&mute=1&loop=1&playlist=2qeTbiQ57C0&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1"
          title="Background video"
          allow="autoplay; encrypted-media"
          tabIndex="-1"
        />
        <div className="auth-video-overlay" />
      </div>

      <div className="change-pwd-panel">
        <div className="change-pwd-topbar">
          <button type="button" className="change-pwd-back" onClick={handleBack}>
            ← {english ? 'Back to profile' : 'Về trang cá nhân'}
          </button>
        </div>

        <div className="auth-brand">
          <img src="/brand-logo-square.jpg" alt="OmniCart" className="auth-brand-logo" />
          <span className="auth-mark">OmniCart<span>.</span></span>
        </div>

        <p className="auth-kicker">{english ? 'ACCOUNT SECURITY' : 'BẢO MẬT TÀI KHOẢN'}</p>

        {success ? (
          <div className="change-pwd-success">
            <div className="change-pwd-success__icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>{english ? 'Password Changed!' : 'Đã đổi mật khẩu thành công!'}</h2>
            <p>
              {english
                ? 'Your password has been updated securely. You can now use your new password.'
                : 'Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Mật khẩu mới có hiệu lực ngay lập tức.'}
            </p>
            <button type="button" className="change-pwd-submit" onClick={handleBack}>
              {english ? `Back to profile (${countdown}s)` : `Về trang cá nhân (${countdown}s)`}
            </button>
          </div>
        ) : (
          <>
            <div className="change-pwd-header">
              <h1>{english ? 'Change Password' : 'Đổi mật khẩu'}</h1>
              <p className="change-pwd-intro">
                {english
                  ? 'Update your password regularly to protect your orders and personal account.'
                  : 'Cập nhật mật khẩu định kỳ để nâng cao tính bảo mật cho tài khoản và đơn hàng của bạn.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="change-pwd-form">
              <label>
                <span>{english ? 'Current password' : 'Mật khẩu hiện tại'}</span>
                <div className="change-pwd-input-wrap">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder={english ? 'Enter current password' : 'Nhập mật khẩu đang dùng'}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="change-pwd-eye-btn"
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showCurrent ? (
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
              </label>

              <label>
                <span>{english ? 'New password' : 'Mật khẩu mới'}</span>
                <div className="change-pwd-input-wrap">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="8"
                    placeholder={english ? 'At least 8 characters' : 'Tối thiểu 8 ký tự'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="change-pwd-eye-btn"
                    onClick={() => setShowNew(!showNew)}
                    aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showNew ? (
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
              </label>

              {newPassword && (
                <div className="change-pwd-strength">
                  <div className="change-pwd-strength__header">
                    <span>{english ? 'Password strength' : 'Độ bảo mật'}</span>
                    <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                  </div>
                  <div className="change-pwd-strength__bars">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="change-pwd-strength__bar"
                        style={{
                          backgroundColor: step <= passwordStrength.score ? passwordStrength.color : 'rgba(255, 255, 255, 0.12)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="change-pwd-checklist">
                    <span className={checks.length ? 'is-valid' : ''}>
                      {checks.length ? '✓' : '○'} {english ? '8+ chars' : 'Tối thiểu 8 ký tự'}
                    </span>
                    <span className={checks.mixedCase ? 'is-valid' : ''}>
                      {checks.mixedCase ? '✓' : '○'} {english ? 'Upper & lower case' : 'Chữ hoa & thường'}
                    </span>
                    <span className={checks.hasNumberOrSpecial ? 'is-valid' : ''}>
                      {checks.hasNumberOrSpecial ? '✓' : '○'} {english ? 'Number/symbol' : 'Chữ số hoặc ký tự'}
                    </span>
                  </div>
                </div>
              )}

              <label>
                <span>{english ? 'Confirm new password' : 'Xác nhận mật khẩu mới'}</span>
                <div className="change-pwd-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength="8"
                    placeholder={english ? 'Re-type new password' : 'Nhập lại mật khẩu mới'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="change-pwd-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showConfirm ? (
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
                {confirmPassword && (
                  <div className={'change-pwd-match-hint ' + (checks.matches ? 'is-matched' : 'is-mismatched')}>
                    {checks.matches
                      ? (english ? '✓ Passwords match' : '✓ Mật khẩu trùng khớp')
                      : (english ? '✕ Passwords do not match' : '✕ Mật khẩu xác nhận chưa khớp')}
                  </div>
                )}
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button type="submit" disabled={busy} className="change-pwd-submit">
                {busy ? (english ? 'Updating…' : 'Đang cập nhật…') : (english ? 'Update Password' : 'Cập nhật mật khẩu')}
              </button>

              <button type="button" className="change-pwd-cancel" onClick={handleBack}>
                {english ? 'Cancel & Return' : 'Hủy & Quay lại'}
              </button>
            </form>
          </>
        )}

        <p className="auth-disclaimer">
          {english
            ? 'Account protected by OmniCart Security. Never share your password with anyone.'
            : 'Tài khoản được bảo vệ bởi OmniCart Security. Không chia sẻ mật khẩu cho bất kỳ ai.'}
        </p>
      </div>
    </div>
  )
}
