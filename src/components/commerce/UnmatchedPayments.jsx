const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const date = value => new Date(value).toLocaleString('vi-VN')

export default function UnmatchedPayments({ payments = [] }) {
  if (!payments.length) return null
  const outstanding = payments.filter(payment => payment.status !== 'refunded').reduce((sum, payment) => sum + payment.amount, 0)
  return <section className="commerce-case" aria-label="Khoản chuyển không khớp">
    <h3>Theo dõi khoản chuyển không khớp / chuyển trùng</h3>
    <p>Cửa hàng đã xác nhận các khoản dưới đây cần hoàn riêng. Còn cần hoàn: <b>{money(outstanding)}</b>.</p>
    {payments.map(payment => <article className="commerce-case" key={payment.id} data-unmatched-id={payment.id}>
      <h4>{money(payment.amount)} · {payment.status === 'refunded' ? 'Đã hoàn đầy đủ' : 'Chờ cửa hàng hoàn tiền'}</h4>
      <p>Nhận lúc {date(payment.receivedAt)} · Mã giao dịch: <code>{payment.reference}</code></p>
      <p>{payment.reason}</p>
      {payment.refundedAt && <p>Hoàn lúc {date(payment.refundedAt)} · Mã hoàn: <code>{payment.refundReference}</code></p>}
    </article>)}
    <p>Các khoản này được đối soát riêng, không tự xác nhận thanh toán hoặc thay đổi đơn hàng đã mua.</p>
  </section>
}
