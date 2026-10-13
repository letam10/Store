/**
 * @codex-vn-doc
 * Tệp: src/components/ui/AccountTwoFactor.jsx
 * Mục đích: Quản lý xác thực hai lớp (2FA), mã QR và mã sao lưu trên dashboard tài khoản.
 */
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'
import './AccountTwoFactor.css'

function formatSecret(secret = '') {
  const clean = String(secret || '').replace(/\s+/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

export default function AccountTwoFactor({ account, security, onSecurityChange, onRefresh }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [setupData, setSetupData] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [backupCodes, setBackupCodes] = useState([])
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const isEnabled = Boolean(security?.twoFactorEnabled)
  const isGoogleLinked = Boolean(security?.googleLinked)
  const backupCodesLeft = Number(security?.backupCodesLeft ?? 0)

  useEffect(() => {
    let t
    if (copiedSecret) t = setTimeout(() => setCopiedSecret(false), 2500)
    return () => clearTimeout(t)
  }, [copiedSecret])

  useEffect(() => {
    let t
    if (copiedCodes) t = setTimeout(() => setCopiedCodes(false), 2500)
    return () => clearTimeout(t)
  }, [copiedCodes])

  async function handleStartSetup() {
    setMsg({ text: '', type: '' })
    setBusy(true)
    try {
      const data = await customerApi('/api/customer/2fa/setup', {
        method: 'POST',
        csrfToken: account?.csrfToken
      })

      let secret = data.secret
      if (!secret && data.otpauthUrl) {
        try {
          secret = new URL(data.otpauthUrl).searchParams.get('secret') || ''
        } catch {
          const m = data.otpauthUrl.match(/secret=([A-Za-z0-9]+)/i)
          secret = m ? m[1] : ''
        }
      }

      let qrDataUrl = data.qrImage
      if (!qrDataUrl && data.otpauthUrl) {
        qrDataUrl = await QRCode.toDataURL(data.otpauthUrl, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' }
        })
      }

      setSetupData({
        otpauthUrl: data.otpauthUrl,
        secret: secret || '',
        qrDataUrl: qrDataUrl || ''
      })
      setVerifyCode('')
      setBackupCodes([])
    } catch (failure) {
      setMsg({ text: userMessage(failure), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  function handleCancelSetup() {
    setSetupData(null)
    setVerifyCode('')
    setMsg({ text: '', type: '' })
  }

  async function handleConfirmVerify(event) {
    event.preventDefault()
    setMsg({ text: '', type: '' })
    const cleanCode = verifyCode.replace(/\s+/g, '')
    if (cleanCode.length < 6 || !/^\d+$/.test(cleanCode)) {
      setMsg({ text: 'Vui lòng nhập đúng mã xác thực 6 chữ số từ ứng dụng.', type: 'error' })
      return
    }

    setBusy(true)
    try {
      const res = await customerApi('/api/customer/2fa/verify', {
        method: 'POST',
        csrfToken: account?.csrfToken,
        body: JSON.stringify({ code: cleanCode })
      })

      const returned = Array.isArray(res.backupCodes) ? res.backupCodes : []
      setBackupCodes(returned)
      setSetupData(null)
      setVerifyCode('')

      if (typeof onSecurityChange === 'function') {
        onSecurityChange(prev => ({
          ...(prev || {}),
          twoFactorEnabled: true,
          backupCodesLeft: returned.length
        }))
      }

      setMsg({
        text: 'Đã kích hoạt xác thực hai lớp (2FA) thành công! Hãy lưu lại các mã sao lưu dự phòng bên dưới.',
        type: 'success'
      })

      if (typeof onRefresh === 'function') {
        try { await onRefresh() } catch { /* ignore */ }
      }
    } catch (failure) {
      setMsg({ text: userMessage(failure), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable2fa(event) {
    event.preventDefault()
    setMsg({ text: '', type: '' })
    if (!disablePassword) {
      setMsg({ text: 'Vui lòng nhập mật khẩu tài khoản để xác nhận tắt 2FA.', type: 'error' })
      return
    }

    setBusy(true)
    try {
      await customerApi('/api/customer/2fa/disable', {
        method: 'POST',
        csrfToken: account?.csrfToken,
        body: JSON.stringify({ password: disablePassword })
      })

      setDisablePassword('')
      setShowDisableForm(false)
      setBackupCodes([])
      setSetupData(null)

      if (typeof onSecurityChange === 'function') {
        onSecurityChange(prev => ({
          ...(prev || {}),
          twoFactorEnabled: false,
          backupCodesLeft: 0
        }))
      }

      setMsg({ text: 'Đã tắt xác thực hai lớp thành công.', type: 'success' })

      if (typeof onRefresh === 'function') {
        try { await onRefresh() } catch { /* ignore */ }
      }
    } catch (failure) {
      setMsg({ text: userMessage(failure), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  function handleCopySecret() {
    if (!setupData?.secret) return
    navigator.clipboard.writeText(setupData.secret).then(() => setCopiedSecret(true)).catch(() => {})
  }

  function handleCopyAllCodes() {
    if (!backupCodes.length) return
    navigator.clipboard.writeText(backupCodes.join('\n')).then(() => setCopiedCodes(true)).catch(() => {})
  }

  function handleDownloadCodes() {
    if (!backupCodes.length) return
    const content = `MÃ SAO LƯU DỰ PHÒNG XÁC THỰC 2 LỚP (STORE 2FA)\n` +
      `Tài khoản: ${account?.username || ''} (${account?.email || ''})\n` +
      `Ngày tạo: ${new Date().toLocaleString('vi-VN')}\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') + `\n`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `store-2fa-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="surface account-security-card" aria-label="Bảo mật và xác thực 2 lớp">
      <div className="account-security-header">
        <div>
          <p className="eyebrow">Bảo mật tài khoản</p>
          <h2>Xác thực hai lớp (2FA)</h2>
        </div>
        <div className="account-security-badges">
          <span className={`security-badge ${isEnabled ? 'security-badge--active' : 'security-badge--inactive'}`}>
            {isEnabled ? '✓ Đã kích hoạt 2FA' : '✕ Chưa bật 2FA'}
          </span>
          <span className="security-badge security-badge--info">
            {isGoogleLinked ? '✓ Google: Đã liên kết' : 'Google: Chưa liên kết'}
          </span>
          {isEnabled && (
            <span className="security-badge security-badge--backup">
              Mã dự phòng: {backupCodesLeft}
            </span>
          )}
        </div>
      </div>

      <div className="account-security-body">
        <p className="account-security-desc">
          Bảo vệ tài khoản bằng lớp bảo mật bổ sung qua ứng dụng Authenticator (Google Authenticator, Microsoft Authenticator, Apple Keychain). Khi bật, mỗi lần đăng nhập sẽ yêu cầu mã OTP 6 số từ điện thoại của bạn.
        </p>

        {msg.text && (
          <div className={`account-security-alert account-security-alert--${msg.type}`} role={msg.type === 'error' ? 'alert' : 'status'}>
            <span className="account-security-alert__icon" aria-hidden="true">{msg.type === 'success' ? '✓' : '⚠'}</span>
            <div className="account-security-alert__text">{msg.text}</div>
            <button type="button" className="account-security-alert__close" onClick={() => setMsg({ text: '', type: '' })} aria-label="Đóng">×</button>
          </div>
        )}

        {!isEnabled && (
          !setupData ? (
            <div className="account-2fa-promo">
              <div className="account-2fa-promo-features">
                <div className="account-2fa-feature-item">
                  <span aria-hidden="true">🛡️</span>
                  <div><strong>Chống xâm nhập trái phép</strong><p>Ngăn chặn kẻ gian truy cập ngay cả khi mật khẩu bị lộ.</p></div>
                </div>
                <div className="account-2fa-feature-item">
                  <span aria-hidden="true">📱</span>
                  <div><strong>Tương thích mọi ứng dụng</strong><p>Chuẩn TOTP RFC 6238, hoạt động với Google/Microsoft Authenticator.</p></div>
                </div>
                <div className="account-2fa-feature-item">
                  <span aria-hidden="true">🔑</span>
                  <div><strong>Có mã sao lưu dự phòng</strong><p>Cung cấp 10 mã dự phòng để đăng nhập an toàn nếu đổi điện thoại.</p></div>
                </div>
              </div>
              <div>
                <button type="button" onClick={handleStartSetup} disabled={busy} className="button button--soft">
                  {busy ? 'Đang tạo mã QR…' : 'Bắt đầu kích hoạt 2FA (hiện mã QR)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="account-2fa-setup">
              <div className="account-2fa-setup-qr-col">
                <div className="account-2fa-qr-frame">
                  {setupData.qrDataUrl ? (
                    <img src={setupData.qrDataUrl} alt="Mã QR 2FA" width="220" height="220" />
                  ) : (
                    <div className="account-2fa-qr-loading">Đang hiển thị mã QR…</div>
                  )}
                </div>
                <div className="account-2fa-secret-box">
                  <label>Khóa bí mật (nhập thủ công):</label>
                  <div className="account-2fa-secret-display">
                    <code>{formatSecret(setupData.secret)}</code>
                    <button type="button" onClick={handleCopySecret} className="account-2fa-copy-btn">
                      {copiedSecret ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="account-2fa-setup-form-col">
                <div className="account-2fa-steps">
                  <div className="account-2fa-step">
                    <span className="account-2fa-step-num">1</span>
                    <div className="account-2fa-step-content"><p><strong>Mở ứng dụng xác thực trên điện thoại</strong></p><small>Google Authenticator, Microsoft Authenticator hoặc Apple Keychain.</small></div>
                  </div>
                  <div className="account-2fa-step">
                    <span className="account-2fa-step-num">2</span>
                    <div className="account-2fa-step-content"><p><strong>Quét mã QR bên cạnh hoặc nhập khóa bí mật</strong></p><small>Chọn dấu (+) trong ứng dụng rồi chọn Quét mã QR.</small></div>
                  </div>
                  <div className="account-2fa-step">
                    <span className="account-2fa-step-num">3</span>
                    <div className="account-2fa-step-content"><p><strong>Nhập mã 6 chữ số từ ứng dụng để kích hoạt</strong></p><small>Mã OTP sẽ tự động đổi mới sau mỗi 30 giây.</small></div>
                  </div>
                </div>
                <form className="account-2fa-form" onSubmit={handleConfirmVerify}>
                  <div className="account-2fa-form-field">
                    <label htmlFor="2fa-verify-code">Nhập mã xác thực 6 số:</label>
                    <input id="2fa-verify-code" type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required className="account-2fa-input-code" autoFocus />
                  </div>
                  <div className="account-2fa-form-actions">
                    <button type="submit" disabled={busy || verifyCode.trim().length < 6} className="button">{busy ? 'Đang xác thực…' : 'Xác nhận & Kích hoạt 2FA'}</button>
                    <button type="button" onClick={handleCancelSetup} disabled={busy} className="button button--soft">Hủy bỏ</button>
                  </div>
                </form>
              </div>
            </div>
          )
        )}
        {isEnabled && (
          <div className="account-2fa-active-panel">
            <div className="account-2fa-status-banner">
              <div className="account-2fa-status-banner__icon" aria-hidden="true">✓</div>
              <div className="account-2fa-status-banner__text">
                <h3>Xác thực hai lớp đang hoạt động</h3>
                <p>Tài khoản của bạn đã được bảo vệ. Mỗi khi đăng nhập từ thiết bị lạ, hệ thống sẽ yêu cầu mã OTP từ ứng dụng xác thực của bạn.</p>
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="account-2fa-backup-card">
                <div className="account-2fa-backup-header">
                  <div>
                    <h3>Lưu mã sao lưu dự phòng (Quan trọng!)</h3>
                    <p>Hãy lưu 10 mã dưới đây vào nơi an toàn. Mỗi mã chỉ dùng được 1 lần khi bạn mất điện thoại.</p>
                  </div>
                  <div className="account-2fa-backup-actions">
                    <button type="button" onClick={handleCopyAllCodes} className="button button--soft">
                      {copiedCodes ? '✓ Đã sao chép tất cả' : 'Sao chép tất cả mã'}
                    </button>
                    <button type="button" onClick={handleDownloadCodes} className="button button--soft">
                      Tải file văn bản (.txt)
                    </button>
                  </div>
                </div>
                <div className="account-2fa-backup-grid">
                  {backupCodes.map((code, idx) => (
                    <span key={idx} className="account-2fa-code-chip">{code}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="account-2fa-disable-box">
              {!showDisableForm ? (
                <button type="button" onClick={() => setShowDisableForm(true)} className="button button--outline-danger">
                  Tắt xác thực 2 lớp (2FA)
                </button>
              ) : (
                <form className="account-2fa-disable-form" onSubmit={handleDisable2fa}>
                  <p><strong>Cảnh báo:</strong> Việc tắt 2FA sẽ làm giảm mức độ bảo mật. Vui lòng nhập mật khẩu tài khoản hiện tại để xác nhận.</p>
                  <div className="account-2fa-disable-fields">
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Nhập mật khẩu tài khoản của bạn"
                      required
                      autoComplete="current-password"
                      autoFocus
                    />
                    <button type="submit" disabled={busy || !disablePassword} className="button button--danger">
                      {busy ? 'Đang xử lý…' : 'Xác nhận tắt 2FA'}
                    </button>
                    <button type="button" onClick={() => { setShowDisableForm(false); setDisablePassword('') }} disabled={busy} className="button button--soft">
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
