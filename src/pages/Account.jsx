import { useMemo, useState } from 'react'
import { demoVouchers, getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Account({ account, orders = [], membershipTier = 'standard', selectedVoucher = '', onSelectVoucher, onLogout }) {
  const [orderQuery, setOrderQuery] = useState('')
  const visibleOrders = useMemo(() => orders.filter((order) => orderMatches(order, orderQuery)), [orders, orderQuery])
  const plan = getMembershipPlan(membershipTier)
  const wallet = demoVouchers.filter((voucher) => voucher.tiers.includes(membershipTier))

  return <div className="container page-shell account-page">
    <header className="page-head"><div><p className="eyebrow">Không gian cá nhân</p><h1>Tài khoản của bạn</h1></div><a href="/products">Tiếp tục mua sắm →</a></header>
    <section className="account-profile">
      <div className="account-avatar" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</div>
      <div className="account-profile__identity"><span className="membership-badge">{plan.badge}</span><h2>Chào {account.username}!</h2><p>{account.email || 'Tài khoản demo cục bộ'}</p></div>
      <div className="account-profile__stat"><strong>{orders.length}</strong><span>Đơn demo</span></div>
      <div className="account-profile__stat"><strong>{wallet.length}</strong><span>Voucher khả dụng</span></div>
    </section>
    <div className="account-shortcuts"><a href="/cart"><span>▣</span><b>Giỏ hàng</b><small>Chọn món muốn mua →</small></a><a href="/membership"><span>✦</span><b>Thành viên</b><small>Hạng {plan.name} →</small></a><a href="/rewards"><span>◌</span><b>Vòng quay</b><small>Khám phá ưu đãi →</small></a></div>
    <section className="surface account-wallet"><div className="account-orders__head"><div><p className="eyebrow">Dành cho bạn</p><h2>Kho voucher demo</h2></div><a href="/rewards">Nhận thêm từ vòng quay →</a></div><div className="account-voucher-grid">{wallet.map((voucher) => <article key={voucher.code} className={selectedVoucher === voucher.code ? 'is-selected' : ''}><div><span>{voucher.label}</span><code>{voucher.code}</code></div><p>{voucher.description}</p><button type="button" onClick={() => onSelectVoucher?.(voucher.code)}>{selectedVoucher === voucher.code ? 'Đang giữ mã' : 'Giữ cho checkout'}</button></article>)}</div><p className="checkout-disclaimer">Voucher chỉ là dữ liệu demo; checkout kiểm tra lại điều kiện đơn hàng.</p></section>
    <section className="surface account-orders"><div className="account-orders__head"><div><p className="eyebrow">Lịch sử cục bộ</p><h2>Đơn hàng của bạn</h2></div><span>{orders.length} đơn</span></div>{orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>Tìm đơn demo</span><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Mã đơn, voucher, hạng thành viên…" /></label><span>{visibleOrders.length}/{orders.length} kết quả</span></div>}{orders.length === 0 ? <p className="muted">Chưa có đơn demo nào trong tài khoản này.</p> : visibleOrders.length === 0 ? <div className="account-order-empty"><b>Không tìm thấy đơn phù hợp.</b><button type="button" onClick={() => setOrderQuery('')}>Xóa bộ lọc</button></div> : <div className="account-order-list">{visibleOrders.map((order) => <article key={order.id}><div><b>{order.id}</b><small>{date.format(new Date(order.createdAt))}</small></div><div><span>{order.itemCount} sản phẩm · {order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</span><strong>{money.format(order.total)}</strong>{order.discount > 0 && <small>{order.voucherCode}: -{money.format(order.discount)}</small>}</div><small>{order.status}</small></article>)}</div>}</section>
    <div className="account-logout"><div><strong>Rời tài khoản demo?</strong><p>Dữ liệu demo trên trình duyệt vẫn được giữ để bạn quay lại.</p></div><button type="button" onClick={onLogout}>Đăng xuất</button></div>
  </div>
}
