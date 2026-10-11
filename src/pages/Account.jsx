import { CustomerOrders } from '../components/commerce/OrderCenter'
/**
 * @codex-vn-doc
 * Tệp: src/pages/Account.jsx
 * Mục đích: Không gian cá nhân, voucher, hạng thành viên và lịch sử đơn hàng.
 * Liên kết: App.jsx cung cấp account/orders/wallet và callback chọn voucher, đăng xuất; promotions/state cung cấp nhãn hạng và lọc đơn.
 * Cẩn trọng: dữ liệu tài khoản có thể thiếu tuỳ phiên; luôn dùng giá trị dự phòng và không hiển thị mã voucher đã hết hạn từ API.
 */
import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import './Storefront.css'

const date = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric', year: '2-digit' })

function safeDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Chưa xác định ngày' : date.format(parsed)
}

export default function Account({ account, orders = [], membershipTier = 'bronze', wallet = [], selectedVoucherCodes = [], onToggleVoucher, onLogout, onRefresh }) {
  const [orderQuery, setOrderQuery] = useState('')
  const [security, setSecurity] = useState(null)
  const [qr, setQr] = useState(null)
  const [backupCodes, setBackupCodes] = useState([])
  const [verifyCode, setVerifyCode] = useState('')
  const [disablePass, setDisablePass] = useState('')
  const [secMsg, setSecMsg] = useState('')
  const [secBusy, setSecBusy] = useState(false)

  useEffect(() => {
    if (!account?.id) return
    customerApi('/api/customer/security').then(setSecurity).catch(() => {})
  }, [account?.id])

  async function setupTwoFactor() {
    setSecMsg('')
    setSecBusy(true)
    try {
      const data = await customerApi('/api/customer/2fa/setup', { method: 'POST', csrfToken: account.csrfToken })
      setQr(data)
      setBackupCodes([])
      setSecMsg('Quet QR bang Google Authenticator / Microsoft Authenticator, roi nhap ma 6 so de kich hoat.')
    } catch (failure) { setSecMsg(failure.message) } finally { setSecBusy(false) }
  }

  async function confirmTwoFactor(event) {
    event.preventDefault()
    setSecMsg('')
    setSecBusy(true)
    try {
      const data = await customerApi('/api/customer/2fa/verify', { method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ code: verifyCode }) })
      setBackupCodes(data.backupCodes || [])
      setQr(null)
      setVerifyCode('')
      setSecurity((s) => ({ ...(s || {}), twoFactorEnabled: true, backupCodesLeft: (data.backupCodes || []).length }))
      setSecMsg('Da bat 2FA. Luu 10 backup code (moi ma dung 1 lan).')
      if (typeof onRefresh === 'function') { try { await onRefresh() } catch { /* ignore */ } }
    } catch (failure) { setSecMsg(failure.message) } finally { setSecBusy(false) }
  }
  async function disableTwoFactor(event) {
    event.preventDefault()
    setSecMsg('')
    setSecBusy(true)
    try {
      await customerApi('/api/customer/2fa/disable', { method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ password: disablePass }) })
      setDisablePass('')
      setSecurity((s) => ({ ...(s || {}), twoFactorEnabled: false, backupCodesLeft: 0 }))
      setBackupCodes([])
      setQr(null)
      setSecMsg('Da tat xac thuc 2 lop.')
      if (typeof onRefresh === 'function') { try { await onRefresh() } catch { /* ignore */ } }
    } catch (failure) { setSecMsg(failure.message) } finally { setSecBusy(false) }
  }

  const visibleOrders = useMemo(() => orders.filter((order) => orderMatches(order, orderQuery)), [orders, orderQuery])
  const plan = getMembershipPlan(membershipTier)
  const username = account?.username || 'Khách hàng'
  const points = Number(account?.points || 0)
  const spinCredits = Number(account?.spinCredits || 0)
  const initial = username.slice(0, 1).toUpperCase() || 'K'

  return <div className="container page-shell account-page account-page--redesign">
    <header className="page-head account-page-head"><div><p className="eyebrow">Không gian cá nhân</p><h1>Tài khoản của bạn</h1><p className="account-page-head__lead">Quản lý điểm, ưu đãi và đơn hàng trong một nơi.</p></div><a className="account-page-head__link" href="/products">Tiếp tục mua sắm <span aria-hidden="true">→</span></a></header>

    <section className="account-profile account-profile--redesign" aria-label="Tóm tắt tài khoản">
      <div className="account-profile__top"><div className="account-avatar" aria-hidden="true">{initial}</div><div className="account-profile__identity"><span className="membership-badge">{plan.badge}</span><h2>Chào {username}!</h2><p>{account?.email || 'Email chưa cập nhật'}</p></div></div>
      <div className="account-profile__stats"><div className="account-profile__stat"><strong>{points.toLocaleString('vi-VN')}</strong><span>Điểm tích lũy</span></div><div className="account-profile__stat"><strong>{spinCredits}</strong><span>Lượt quay</span></div><div className="account-profile__stat"><strong>{wallet.length}</strong><span>Voucher khả dụng</span></div></div>
    </section>

    <div className="account-shortcuts account-shortcuts--redesign"><a href="/favorites"><span aria-hidden="true">♥</span><b>Yêu thích</b><small>Sản phẩm đã lưu <i aria-hidden="true">→</i></small></a><a href="/membership"><span aria-hidden="true">✦</span><b>Thành viên</b><small>Hạng {plan.name} <i aria-hidden="true">→</i></small></a><a href="/rewards"><span aria-hidden="true">◌</span><b>Vòng quay</b><small>{spinCredits} lượt còn lại <i aria-hidden="true">→</i></small></a></div>

    <main className="account-content-grid">
      <section className="surface account-wallet account-wallet--redesign"><div className="account-orders__head"><div><p className="eyebrow">Dành cho bạn</p><h2>Kho voucher</h2></div><a href="/rewards">Nhận thêm từ vòng quay →</a></div>
        {wallet.length ? <div className="account-voucher-grid">{wallet.map((voucher) => <article key={voucher.code} className={selectedVoucherCodes.includes(voucher.code) ? 'is-selected' : ''}>
          <strong>{voucher.label || 'Voucher Store'}</strong><p><code>{voucher.code}</code> · HSD {safeDate(voucher.expiresAt)}</p><button type="button" onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? 'Bỏ chọn' : 'Sử dụng'}</button>
        </article>)}</div> : <div className="account-empty-state"><span aria-hidden="true">◇</span><div><strong>Chưa có voucher</strong><p className="muted">Voucher mới nhận sẽ xuất hiện ở đây.</p></div><a href="/rewards">Mở vòng quay →</a></div>}
      </section>

      <aside className="account-side-panel"><div className="account-side-panel__heading"><p className="eyebrow">Tóm tắt</p><h2>Quyền lợi hiện tại</h2></div><div className="account-benefit-list"><div><span>Hạng</span><strong>{plan.name}</strong></div><div><span>Điểm</span><strong>{points.toLocaleString('vi-VN')}</strong></div><div><span>Đơn hàng</span><strong>{orders.length}</strong></div></div><a className="button button--soft" href="/membership">Xem quyền lợi thành viên</a></aside>
    </main>

    <section className="surface account-orders account-orders--redesign"><div className="account-orders__head"><div><p className="eyebrow">Lịch sử đơn hàng</p><h2>Đơn hàng của bạn</h2></div><span>{orders.length} đơn</span></div>
      {orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>Tìm đơn</span><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Mã đơn, trạng thái…" /></label><span>{visibleOrders.length}/{orders.length} kết quả</span></div>}
      {orders.length === 0 ? <div className="account-empty-state"><span aria-hidden="true">▱</span><div><strong>Chưa có đơn hàng</strong><p className="muted">Đơn hàng sau khi đặt sẽ được lưu tại đây.</p></div><a href="/products">Khám phá sản phẩm →</a></div> : visibleOrders.length === 0 ? <p className="account-empty-state__message">Không tìm thấy đơn phù hợp.</p> : <CustomerOrders key={account.id} orders={visibleOrders} account={account} onRefresh={onRefresh} />}
    </section>

    <section className="surface account-orders account-orders--redesign"><div className="account-orders__head"><div><p className="eyebrow">Bao mat</p><h2>Google va xac thuc 2 lop</h2></div><span>{security?.twoFactorEnabled ? '2FA: Bat' : '2FA: Tat'} · Google: {security?.googleLinked ? 'Da lien ket' : 'Chua'} · Backup: {security?.backupCodesLeft ?? 0}</span></div>
      <div className="account-order-toolbar"><span>Quet QR bang Google Authenticator / Microsoft Authenticator. Moi backup code dung 1 lan.</span><span>{account?.authMethods?.length ? 'Phuong thuc: ' + account.authMethods.join(', ') : ''}</span></div>
      {!security?.twoFactorEnabled && <div style={{ display: 'grid', gap: 10 }}>
        <button type="button" onClick={setupTwoFactor} disabled={secBusy} className="button button--soft">{secBusy ? 'Dang xu ly...' : 'Bat 2FA (hien QR)'}</button>
        {qr && <div style={{ display: 'grid', gap: 8 }}>
          {qr.qrImage && <img src={qr.qrImage} alt="QR 2FA" width="200" height="200" style={{ borderRadius: 12, border: '1px solid #ded5e8' }} />}
          <small className="muted" style={{ overflowWrap: 'anywhere' }}>{qr.otpauthUrl}</small>
          <form onSubmit={confirmTwoFactor} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={verifyCode} onChange={(event) => setVerifyCode(event.target.value)} inputMode="numeric" placeholder="Ma 6 so" required style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ded5e8' }} />
            <button type="submit" disabled={secBusy} className="button button--soft">Xac nhan bat 2FA</button>
          </form>
        </div>}
      </div>}
      {security?.twoFactorEnabled && <form onSubmit={disableTwoFactor} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="password" value={disablePass} onChange={(event) => setDisablePass(event.target.value)} placeholder="Nhap mat khau de tat 2FA" required autoComplete="current-password" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ded5e8', minWidth: 240 }} />
        <button type="submit" disabled={secBusy} className="button button--soft">Tat 2FA</button>
      </form>}
      {backupCodes.length > 0 && <div className="account-empty-state"><span aria-hidden="true">◌</span><div><strong>Luu backup code ngay</strong><p className="muted"><code>{backupCodes.join(' · ')}</code></p></div></div>}
      {secMsg && <p className="account-empty-state__message">{secMsg}</p>}
    </section>

    <footer className="account-logout account-logout--redesign"><div><p className="eyebrow">Phiên đăng nhập</p><strong>Đăng xuất khỏi Store</strong><p>Điểm, voucher và đơn hàng được lưu trên tài khoản của bạn.</p></div><button type="button" onClick={onLogout}>Đăng xuất</button></footer>
  </div>
}
