/**
 * @codex-vn-doc
 * Tệp: src/pages/Account.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Account.
 * Liên kết trực tiếp: react, ../storefront/promotions, ../storefront/state.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useMemo, useState } from 'react'
import { getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

// Chức năng Account: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Account({ account, orders = [], membershipTier = 'bronze', wallet = [], selectedVoucherCodes = [], onToggleVoucher, onLogout }) {
  const [orderQuery, setOrderQuery] = useState('')
  const visibleOrders = useMemo(() => orders.filter((order) => orderMatches(order, orderQuery)), [orders, orderQuery])
  const plan = getMembershipPlan(membershipTier)
  return <div className="container page-shell account-page">
    <header className="page-head"><div><p className="eyebrow">Không gian cá nhân</p><h1>Tài khoản của bạn</h1></div><a href="/products">Tiếp tục mua sắm →</a></header>
    <section className="account-profile">
      <div className="account-avatar" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</div>
      <div className="account-profile__identity"><span className="membership-badge">{plan.badge}</span><h2>Chào {account.username}!</h2><p>{account.email}</p></div>
      <div className="account-profile__stat"><strong>{account.points.toLocaleString('vi-VN')}</strong><span>Điểm tích lũy</span></div>
      <div className="account-profile__stat"><strong>{account.spinCredits}</strong><span>Lượt quay</span></div>
      <div className="account-profile__stat"><strong>{wallet.length}</strong><span>Voucher</span></div>
    </section>
    <div className="account-shortcuts"><a href="/favorites"><span>♥</span><b>Yêu thích</b><small>Sản phẩm đã lưu →</small></a><a href="/membership"><span>✦</span><b>Thành viên</b><small>Hạng {plan.name} →</small></a><a href="/rewards"><span>◌</span><b>Vòng quay</b><small>{account.spinCredits} lượt còn lại →</small></a></div>
    <section className="surface account-wallet"><div className="account-orders__head"><div><p className="eyebrow">Dành cho bạn</p><h2>Kho voucher</h2></div><a href="/rewards">Nhận thêm từ vòng quay →</a></div>
      {wallet.length ? <div className="account-voucher-grid">{wallet.map((voucher) => <article key={voucher.code} className={selectedVoucherCodes.includes(voucher.code) ? 'is-selected' : ''}>
        <div><span>{voucher.label}</span><code>{voucher.code}</code></div><p>Hạn dùng: {date.format(new Date(voucher.expiresAt))} · {voucher.source === 'wheel' ? 'Vòng quay' : 'Quản trị viên'}</p>
        <button type="button" onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? 'Bỏ chọn' : 'Chọn cho thanh toán'}</button>
      </article>)}</div> : <p className="muted">Chưa có voucher.</p>}
    </section>
    <section className="surface account-orders"><div className="account-orders__head"><div><p className="eyebrow">Lịch sử đơn hàng</p><h2>Đơn hàng của bạn</h2></div><span>{orders.length} đơn</span></div>
      {orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>Tìm đơn</span><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Mã đơn, trạng thái…" /></label><span>{visibleOrders.length}/{orders.length} kết quả</span></div>}
      {orders.length === 0 ? <p className="muted">Chưa có đơn nào trong tài khoản này.</p> : visibleOrders.length === 0 ? <p>Không tìm thấy đơn phù hợp.</p> : <div className="account-order-list">{visibleOrders.map((order) => <article key={order.id}>
        <div><b>{order.id}</b><small>{date.format(new Date(order.createdAt))}</small></div>
        <div><span>{order.itemCount} sản phẩm · {order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</span><strong>{money.format(order.total)}</strong>{order.discount > 0 && <small>Đã giảm {money.format(order.discount)}</small>}</div>
        <small>{order.status === 'paid' ? 'Đã ghi nhận thanh toán · +' + order.pointsEarned + ' điểm' : 'Chờ ghi nhận thanh toán'}</small>
      </article>)}</div>}
    </section>
    <div className="account-logout"><div><strong>Đăng xuất</strong><p>Điểm, voucher và đơn hàng được lưu trên tài khoản.</p></div><button type="button" onClick={onLogout}>Đăng xuất</button></div>
  </div>
}
