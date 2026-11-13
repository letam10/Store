import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'
import PaymentBox from './PaymentBox'
import OrderCenter from './OrderCenter'
import './CheckoutOrder.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function CheckoutOrder({ orderId, initialOrder, account, onRefresh, onPaymentComplete, onExit }) {
  const [order, setOrder] = useState(initialOrder || null)
  const [error, setError] = useState('')
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (initialOrder) return undefined
    const controller = new AbortController()
    customerApi('/api/customer/orders/' + encodeURIComponent(orderId) + '/receipt', {
      signal: controller.signal,
    }).then(result => setOrder(result.order)).catch(failure => {
      if (!controller.signal.aborted) setError(userMessage(failure))
    })
    return () => controller.abort()
  }, [initialOrder, orderId])

  async function finishPayment(state, paidOrder) {
    if (paidOrder) setOrder(paidOrder)
    try { await onRefresh?.() }
    finally { onPaymentComplete?.(state) }
  }

  return <div className="container page-shell">
    {['paid', 'completed'].includes(order?.status) && <section className="checkout-success surface" role="status" aria-live="polite">
      <span className="checkout-success__check" aria-hidden="true">✓</span>
      <div><p className="eyebrow">Cửa hàng đã xác nhận</p><h1>Thanh toán thành công</h1>
        <p>Đã nhận <strong>{money.format(order.total)}</strong> cho đơn <strong>{order.id}</strong>.</p>
        <p>Trạng thái thanh toán đã hoàn tất. Tiến độ chuẩn bị và giao hàng được cập nhật riêng bên dưới.</p>
        <p className="muted">Biên nhận được gửi qua email sau khi xác nhận. Bạn không cần chuyển thêm tiền cho đơn này.</p>
      </div>
      <a className="button button--soft" href="/account">Theo dõi đơn hàng</a>
    </section>}
    {order?.status === 'pending' && order.paymentMethod === 'bank_transfer'
      ? <PaymentBox orderId={order.id} account={account}
        onExit={reason => onExit?.(reason, order)} onDone={finishPayment} />
      : order ? <OrderCenter orderId={order.id} account={account} onRefresh={onRefresh} />
        : <section className="surface checkout-card">
          <h1>Thanh toán</h1>
          <p role={error ? 'alert' : 'status'}>{error || 'Đang tải thông tin thanh toán…'}</p>
          <button type="button" className="button button--soft" onClick={() => onExit?.('exit')}>
            Về trang thanh toán
          </button>
        </section>}
  </div>
}

