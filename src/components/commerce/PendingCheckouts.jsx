import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'

export default function PendingCheckouts({ account, onNavigate, onCancelled, refreshKey = 0 }) {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    customerApi('/api/customer/pending-checkouts', { signal: controller.signal })
      .then(result => { setOrders(result.orders || []); setError('') })
      .catch(failure => { if (!controller.signal.aborted) setError(userMessage(failure)) })
    return () => controller.abort()
  }, [account.id, refreshKey, version])

  async function cancel(id) {
    try {
      await customerApi('/api/customer/orders/' + encodeURIComponent(id) + '/cancel-unpaid', { method: 'POST', csrfToken: account.csrfToken })
      setVersion(value => value + 1)
      await onCancelled?.()
    } catch (failure) { setError(userMessage(failure)) }
  }

  if (!orders.length && !error) return null
  return <section className="surface checkout-card">
    <h2>Phiên đặt hàng gần đây</h2><p>Các phiên này chưa thuộc lịch sử mua hàng đã thanh toán.</p>
    <button type="button" className="button button--soft" onClick={() => setVersion(value => value + 1)}>Cập nhật phiên</button>
    {orders.map(order => <div className="commerce-case" key={order.id}><strong>{order.id}</strong><p>{order.paymentState === 'unmatched_received' ? 'Cửa hàng đã nhận khoản chuyển không khớp, đang xử lý hoàn tiền' : order.paymentState === 'refunded_unmatched' ? 'Đã hoàn khoản chuyển không khớp, mở để xem chứng từ' : order.paymentState === 'reported' ? 'Đã báo chuyển khoản, chờ đối soát' : order.paymentState === 'needs_review' ? 'Cần cửa hàng kiểm tra giao dịch' : ['expired', 'cancelled'].includes(order.paymentState) ? 'QR đã đóng. Chỉ mở để báo giao dịch nếu bạn đã chuyển tiền.' : order.paymentMethod === 'bank_transfer' ? 'Chờ chuyển khoản trong hạn QR' : 'Chờ thanh toán khi nhận hàng'}</p>
      <button type="button" className="button button--soft" onClick={() => onNavigate?.('/checkout?' + (order.paymentMethod === 'bank_transfer' ? 'payment=' : 'order=') + encodeURIComponent(order.id))}>Xem / theo dõi</button>
      {order.paymentState === 'pending' && <button type="button" className="button button--soft" onClick={() => cancel(order.id)}>Hủy phiên chưa chuyển tiền</button>}
    </div>)}
    {error && <p role="alert">{error}</p>}
  </section>
}
