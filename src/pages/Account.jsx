import { useState } from 'react'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Account({ account, orders = [], onLogin, onLogout }) {
  const [username, setUsername] = useState('')
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
          <span className="account-badge">Phiên khách demo</span><h2>Thông tin tài khoản</h2><p className="muted">Tên đăng nhập: <b>{account.username}</b></p>
          <div className="page-actions"><button className="button button--soft" type="button" onClick={onLogout}>Đăng xuất</button><a className="button" href="/cart">Xem giỏ hàng</a></div>
        </> : <form onSubmit={submit}><p className="muted">Phiên này chỉ phục vụ prototype giao diện, không phải hệ thống xác thực khách hàng production.</p><label className="field" style={{margin:'20px 0'}}><span>Tên tài khoản</span><input autoComplete="username" value={username} onChange={(event)=>setUsername(event.target.value)} required placeholder="Ví dụ: andy"/></label><button className="button" type="submit">Đăng nhập</button></form>}
      </section>
      <section className="surface account-card"><p className="eyebrow">Quản trị</p><h2>Bạn là admin?</h2><p className="muted">Khu vực admin dùng xác thực backend riêng và không dùng phiên khách demo.</p><div className="page-actions"><a className="button button--soft" href="/admin">Đi tới Admin</a></div></section>
    </div>
    {account && <section className="surface account-orders"><div className="account-orders__head"><div><p className="eyebrow">Lịch sử cục bộ</p><h2>Đơn demo của tài khoản này</h2></div><span>{orders.length} đơn</span></div>{orders.length === 0 ? <p className="muted">Chưa có đơn demo nào được tạo khi đăng nhập bằng tài khoản này.</p> : <div className="account-order-list">{orders.map((order)=><article key={order.id}><div><b>{order.id}</b><small>{date.format(new Date(order.createdAt))}</small></div><div><span>{order.itemCount} sản phẩm · {order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</span><strong>{money.format(order.total)}</strong></div><small>{order.status}</small></article>)}</div>}</section>}
  </div>
}
