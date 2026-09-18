import { useMemo, useState } from 'react'
import { demoVouchers, getMembershipPlan } from '../storefront/promotions'
import { orderMatches } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Account({ account, orders = [], membershipTier='standard', selectedVoucher='', onSelectVoucher, onLogin, onLogout }) {
  const [username, setUsername] = useState('')
  const [orderQuery, setOrderQuery] = useState('')
  const visibleOrders = useMemo(() => orders.filter((order) => orderMatches(order, orderQuery)), [orders, orderQuery])
  const plan=getMembershipPlan(membershipTier)
  const wallet=demoVouchers.filter((voucher)=>voucher.tiers.includes(membershipTier))

  function submit(event) {
    event.preventDefault()
    const value = username.trim()
    if (value) onLogin({ username: value, mode: 'demo' })
  }

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Tài khoản</p><h1>{account ? 'Xin chào, ' + account.username + '.' : 'Đăng nhập bằng tên tài khoản.'}</h1></div></header>
    <div className="account-layout">
      <section className="surface account-card">
        {account ? <>
          <div className="account-tier-line"><span className="membership-badge">{plan.badge}</span><small>Hạng demo hiện tại</small></div><h2>Thông tin tài khoản</h2><p className="muted">Tên đăng nhập: <b>{account.username}</b></p>
          <div className="page-actions"><button className="button button--soft" type="button" onClick={onLogout}>Đăng xuất</button><a className="button" href="/cart">Xem giỏ hàng</a><a className="button button--soft" href="/membership">Quyền lợi thành viên</a></div>
        </> : <form onSubmit={submit}><p className="muted">Phiên này chỉ phục vụ prototype giao diện, không phải hệ thống xác thực khách hàng production.</p><label className="field" style={{margin:'20px 0'}}><span>Tên tài khoản</span><input autoComplete="username" value={username} onChange={(event)=>setUsername(event.target.value)} required placeholder="Ví dụ: andy"/></label><button className="button" type="submit">Đăng nhập</button></form>}
      </section>
      <section className="surface account-card"><p className="eyebrow">Quản trị</p><h2>Bạn là admin?</h2><p className="muted">Khu vực admin dùng xác thực backend riêng và không dùng phiên khách demo.</p><div className="page-actions"><a className="button button--soft" href="/admin">Đi tới Admin</a></div></section>
    </div>
    {account && <section className="surface account-wallet">
      <div className="account-orders__head"><div><p className="eyebrow">Kho voucher demo</p><h2>Ưu đãi theo hạng {plan.name}</h2></div><a href="/rewards">Nhận thêm từ vòng quay →</a></div>
      <div className="account-voucher-grid">{wallet.map((voucher)=><article key={voucher.code} className={selectedVoucher===voucher.code?'is-selected':''}><div><span>{voucher.label}</span><code>{voucher.code}</code></div><p>{voucher.description}</p><button type="button" onClick={()=>onSelectVoucher?.(voucher.code)}>{selectedVoucher===voucher.code?'Đang giữ':'Giữ cho checkout'}</button></article>)}</div>
      <p className="checkout-disclaimer">Các voucher này chỉ là dữ liệu demo. Checkout vẫn kiểm tra điều kiện đơn hàng trước khi áp dụng.</p>
    </section>}
    {account && <section className="surface account-orders">
      <div className="account-orders__head"><div><p className="eyebrow">Lịch sử cục bộ</p><h2>Đơn demo của tài khoản này</h2></div><span>{orders.length} đơn</span></div>
      {orders.length > 0 && <div className="account-order-toolbar"><label className="field"><span>Tra cứu đơn demo</span><input type="search" value={orderQuery} onChange={(event)=>setOrderQuery(event.target.value)} placeholder="Mã đơn, voucher, hạng thành viên…" /></label><span>{visibleOrders.length}/{orders.length} kết quả</span></div>}
      {orders.length === 0 ? <p className="muted">Chưa có đơn demo nào được tạo khi đăng nhập bằng tài khoản này.</p> : visibleOrders.length === 0 ? <div className="account-order-empty"><b>Không tìm thấy đơn phù hợp.</b><button type="button" onClick={()=>setOrderQuery('')}>Xóa bộ lọc</button></div> : <div className="account-order-list">{visibleOrders.map((order)=><article key={order.id}><div><b>{order.id}</b><small>{date.format(new Date(order.createdAt))}</small></div><div><span>{order.itemCount} sản phẩm · {order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</span><strong>{money.format(order.total)}</strong>{order.discount>0&&<small>{order.voucherCode}: -{money.format(order.discount)}</small>}</div><small>{order.status}</small></article>)}</div>}
    </section>}
  </div>
}
