import { paymentNotifications } from './paymentNoticeData.js'
import './PaymentNotifications.css'

export default function PaymentNotifications({ orders }) {
  const notifications = paymentNotifications(orders)
  return <section className="surface account-payment-notifications" aria-label="Thông báo thanh toán">
    <header>
      <div>
        <p className="eyebrow">Lưu trong trang cá nhân</p>
        <h2>Thông báo thanh toán</h2>
      </div>
      <span>{notifications.length} thông báo</span>
    </header>
    {notifications.length ? <ul>
      {notifications.map(notification => <li key={notification.id}>
        <span className="account-payment-notifications__icon" aria-hidden="true">✓</span>
        <div>
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <small>Đơn {notification.orderId} · {new Date(notification.createdAt).toLocaleString('vi-VN')}</small>
        </div>
      </li>)}
    </ul> : <p className="muted">Thông báo chuyển khoản và xác nhận thanh toán sẽ được lưu tại đây.</p>}
  </section>
}
