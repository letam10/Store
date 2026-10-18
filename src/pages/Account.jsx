import { CustomerOrders } from '../components/commerce/OrderCenter'
import PaymentNotifications from '../components/commerce/PaymentNotifications.jsx'
import AccountTwoFactor from '../components/ui/AccountTwoFactor.jsx'
/**
 * @codex-vn-doc
 * Tệp: src/pages/Account.jsx
 * Mục đích: Không gian cá nhân, hạng thành viên và lịch sử đơn hàng.
 * Liên kết: App.jsx cung cấp account/orders/wallet, đăng xuất; promotions/state cung cấp nhãn hạng và lọc đơn.
 * Cẩn trọng: dữ liệu tài khoản có thể thiếu tuỳ phiên; luôn dùng giá trị dự phòng và không hiển thị mã voucher đã hết hạn từ API.
 */
import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import './Storefront.css'

export default function Account({ account, orders = [], membershipTier = 'bronze', wallet = [],
  onLogout, onRefresh, onPaymentComplete, onNavigate }) {
  const [orderQuery, setOrderQuery] = useState('')
  const [security, setSecurity] = useState(null)

  useEffect(() => {
    if (!account?.id) return
    customerApi('/api/customer/security').then(setSecurity).catch(() => {})
  }, [account?.id])

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

    <PaymentNotifications orders={orders} />
    <main className="account-content-grid account-content-grid--single">
      <aside className="account-side-panel"><div className="account-side-panel__heading"><p className="eyebrow">Tóm tắt</p><h2>Quyền lợi hiện tại</h2></div><div className="account-benefit-list"><div><span>Hạng</span><strong>{plan.name}</strong></div><div><span>Điểm</span><strong>{points.toLocaleString('vi-VN')}</strong></div><div><span>Đơn hàng</span><strong>{orders.length}</strong></div></div><a className="button button--soft" href="/membership">Xem quyền lợi thành viên</a></aside>
    </main>

    <section className="surface account-orders account-orders--redesign"><div className="account-orders__head"><div><p className="eyebrow">Lịch sử đơn hàng</p><h2>Đơn hàng của bạn</h2></div><span>{orders.length} đơn</span></div>
      {orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>Tìm đơn</span><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Mã đơn, trạng thái…" /></label><span>{visibleOrders.length}/{orders.length} kết quả</span></div>}
      {orders.length === 0 ? <div className="account-empty-state"><span aria-hidden="true">▱</span><div><strong>Chưa có đơn hàng</strong><p className="muted">Đơn hàng sau khi đặt sẽ được lưu tại đây.</p></div><a href="/products">Khám phá sản phẩm →</a></div> : visibleOrders.length === 0 ? <p className="account-empty-state__message">Không tìm thấy đơn phù hợp.</p> : <CustomerOrders key={account.id} orders={visibleOrders} account={account} onRefresh={onRefresh} onPaymentComplete={onPaymentComplete} onNavigate={onNavigate} />}
    </section>

    <AccountTwoFactor
      account={account}
      security={security}
      onSecurityChange={setSecurity}
      onRefresh={onRefresh}
    />

    <footer className="account-logout account-logout--redesign"><div><p className="eyebrow">Phiên đăng nhập</p><strong>Đăng xuất khỏi Store</strong><p>Điểm, voucher và đơn hàng được lưu trên tài khoản của bạn.</p></div><button type="button" onClick={onLogout}>Đăng xuất</button></footer>
  </div>
}
