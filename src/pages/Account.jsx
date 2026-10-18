import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import { useLanguage } from '../storefront/i18n'
import { CustomerOrders } from '../components/commerce/OrderCenter'
import PaymentNotifications from '../components/commerce/PaymentNotifications.jsx'
import AccountTwoFactor from '../components/ui/AccountTwoFactor.jsx'
import './Storefront.css'

export default function Account({ account, orders = [], membershipTier = 'bronze', wallet = [],
  onLogout, onRefresh, onPaymentComplete, onNavigate, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const [orderQuery, setOrderQuery] = useState('')
  const [security, setSecurity] = useState(null)

  useEffect(() => {
    if (!account?.id) return
    customerApi('/api/customer/security').then(setSecurity).catch(() => {})
  }, [account?.id])

  const visibleOrders = useMemo(() => orders.filter((order) => orderMatches(order, orderQuery)), [orders, orderQuery])
  const plan = getMembershipPlan(membershipTier)
  const username = account?.username || (english ? 'Customer' : 'Khách hàng')
  const points = Number(account?.points || 0)
  const spinCredits = Number(account?.spinCredits || 0)
  const initial = username.slice(0, 1).toUpperCase() || 'K'

  return <div className="container page-shell account-page account-page--redesign">
    <header className="page-head account-page-head"><div><p className="eyebrow">{english ? 'Personal space' : 'Không gian cá nhân'}</p><h1>{english ? 'Your Account' : 'Tài khoản của bạn'}</h1><p className="account-page-head__lead">{english ? 'Manage points, offers and orders in one place.' : 'Quản lý điểm, ưu đãi và đơn hàng trong một nơi.'}</p></div><a className="account-page-head__link" href="/products">{english ? 'Continue shopping ' : 'Tiếp tục mua sắm '}<span aria-hidden="true">→</span></a></header>

    <section className="account-profile account-profile--redesign" aria-label="Tóm tắt tài khoản">
      <div className="account-profile__top"><div className="account-avatar" aria-hidden="true">{initial}</div><div className="account-profile__identity"><span className="membership-badge">{plan.badge}</span><h2>{english ? `Hello ${username}!` : `Chào ${username}!`}</h2><p>{account?.email || (english ? 'Email not set' : 'Email chưa cập nhật')}</p></div></div>
      <div className="account-profile__stats"><div className="account-profile__stat"><strong>{points.toLocaleString(english ? 'en-US' : 'vi-VN')}</strong><span>{english ? 'Reward points' : 'Điểm tích lũy'}</span></div><div className="account-profile__stat"><strong>{spinCredits}</strong><span>{english ? 'Lucky spins' : 'Lượt quay'}</span></div><div className="account-profile__stat"><strong>{wallet.length}</strong><span>{english ? 'Available vouchers' : 'Voucher khả dụng'}</span></div></div>
    </section>

    <div className="account-shortcuts account-shortcuts--redesign"><a href="/favorites"><span aria-hidden="true">♥</span><b>{english ? 'Favorites' : 'Yêu thích'}</b><small>{english ? 'Saved items ' : 'Sản phẩm đã lưu '}<i aria-hidden="true">→</i></small></a><a href="/membership"><span aria-hidden="true">✦</span><b>{english ? 'Membership' : 'Thành viên'}</b><small>{english ? `Tier: ${plan.name} ` : `Hạng ${plan.name} `}<i aria-hidden="true">→</i></small></a><a href="/rewards"><span aria-hidden="true">◌</span><b>{english ? 'Lucky Spin' : 'Vòng quay'}</b><small>{english ? `${spinCredits} spins left ` : `${spinCredits} lượt còn lại `}<i aria-hidden="true">→</i></small></a></div>

    <PaymentNotifications orders={orders} />
    <main className="account-content-grid account-content-grid--single">
      <aside className="account-side-panel"><div className="account-side-panel__heading"><p className="eyebrow">{english ? 'Summary' : 'Tóm tắt'}</p><h2>{english ? 'Current benefits' : 'Quyền lợi hiện tại'}</h2></div><div className="account-benefit-list"><div><span>{english ? 'Tier' : 'Hạng'}</span><strong>{plan.name}</strong></div><div><span>{english ? 'Points' : 'Điểm'}</span><strong>{points.toLocaleString(english ? 'en-US' : 'vi-VN')}</strong></div><div><span>{english ? 'Orders' : 'Đơn hàng'}</span><strong>{orders.length}</strong></div></div><a className="button button--soft" href="/membership">{english ? 'View membership benefits' : 'Xem quyền lợi thành viên'}</a></aside>
    </main>

    <section className="surface account-orders account-orders--redesign"><div className="account-orders__head"><div><p className="eyebrow">{english ? 'Order history' : 'Lịch sử đơn hàng'}</p><h2>{english ? 'Your orders' : 'Đơn hàng của bạn'}</h2></div><span>{orders.length} {english ? 'orders' : 'đơn'}</span></div>
      {orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>{english ? 'Search orders' : 'Tìm đơn'}</span><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder={english ? 'Order code, status…' : 'Mã đơn, trạng thái…'} /></label><span>{visibleOrders.length}/{orders.length} {english ? 'results' : 'kết quả'}</span></div>}
      {orders.length === 0 ? <div className="account-empty-state"><span aria-hidden="true">▱</span><div><strong>{english ? 'No orders yet' : 'Chưa có đơn hàng'}</strong><p className="muted">{english ? 'Orders will appear here once placed.' : 'Đơn hàng sau khi đặt sẽ được lưu tại đây.'}</p></div><a href="/products">{english ? 'Explore products →' : 'Khám phá sản phẩm →'}</a></div> : visibleOrders.length === 0 ? <p className="account-empty-state__message">{english ? 'No matching orders found.' : 'Không tìm thấy đơn phù hợp.'}</p> : <CustomerOrders key={account.id} orders={visibleOrders} account={account} onRefresh={onRefresh} onPaymentComplete={onPaymentComplete} onNavigate={onNavigate} />}
    </section>

    <AccountTwoFactor
      account={account}
      security={security}
      onSecurityChange={setSecurity}
      onRefresh={onRefresh}
    />

    <footer className="account-logout account-logout--redesign"><div><p className="eyebrow">{english ? 'Session' : 'Phiên đăng nhập'}</p><strong>{english ? 'Sign out from Store' : 'Đăng xuất khỏi Store'}</strong><p>{english ? 'Your points, vouchers and orders are securely saved in your account.' : 'Điểm, voucher và đơn hàng được lưu trên tài khoản của bạn.'}</p></div><button type="button" onClick={onLogout}>{english ? 'Sign out' : 'Đăng xuất'}</button></footer>
  </div>
}
