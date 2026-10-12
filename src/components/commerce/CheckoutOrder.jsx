import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'
import PaymentBox from './PaymentBox'
import OrderCenter from './OrderCenter'

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

  async function finishPayment(state) {
    try { await onRefresh?.() }
    finally { onPaymentComplete?.(state) }
  }

  return <div className="container page-shell">
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

