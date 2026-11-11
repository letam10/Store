import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../../api/customer'
import PaymentBox from './PaymentBox'
import ReplacementPicker from './ReplacementPicker'
import AfterSalesCase from './AfterSalesCase'
import './OrderCenter.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const states = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', completed: 'Đã nhận hàng', cancelled: 'Đã hủy', refunded: 'Đã hoàn tiền' }
const deliveryStates = { processing: 'Đang chuẩn bị', ready: 'Sẵn sàng nhận', shipped: 'Đang giao', delivered: 'Đã giao / nhận', cancelled: 'Đã dừng giao', returned: 'Đã nhận hàng trả' }
const kinds = { cancel: 'Hủy trước khi giao', return: 'Trả hàng đã nhận', exchange: 'Đổi sang sản phẩm khác', reschedule: 'Hoãn / lỡ lịch hẹn', merchant_fault: 'Cửa hàng giao sai / hàng lỗi' }
const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—'
const tomorrow = () => {
  const value = new Date(Date.now() + 86400000)
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function OrderCenter({ orderId, account, onRefresh, onPaymentComplete, onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState('')
  const [reason, setReason] = useState('Tôi cần cửa hàng hỗ trợ xử lý đơn hàng này.')
  const [scheduledAt, setScheduledAt] = useState(tomorrow)
  const [payCase, setPayCase] = useState(null)
  const [replacements, setReplacements] = useState([])
  const gate = useRef(false)
  const base = '/api/customer/orders/' + encodeURIComponent(orderId)
  useEffect(() => {
    const controller = new AbortController()
    customerApi(base + '/receipt', { signal: controller.signal }).then(setData).catch(failure => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [base])
  async function reload() { setData(await customerApi(base + '/receipt')); await onRefresh?.() }
  async function act(path, body) {
    if (gate.current) return
    gate.current = true; setBusy(true); setError('')
    try {
      if (path) {
        await customerApi(path, { method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify(body) })
        setKind(''); setPayCase(null)
      }
      await reload()
    } catch (failure) { setError(failure.message) }
    finally { gate.current = false; setBusy(false) }
  }
  if (!data) return <section className="commerce-center"><p role={error ? 'alert' : 'status'}>{error || 'Đang tải chi tiết đơn…'}</p></section>
  const order = data.order
  const requests = data.afterSales || []
  const open = requests.some(item => !['resolved','rejected','cancelled'].includes(item.status))
  const canRequest = ['paid','completed'].includes(order.status)
  return <section className="commerce-center">
    <header className="commerce-head"><div><p className="eyebrow">Đơn của bạn</p><h2>{order.id}</h2><p>{states[order.status]} · {deliveryStates[order.deliveryStatus]}</p></div><div className="commerce-actions"><button className="button button--soft" type="button" disabled={busy} onClick={() => act()}>Cập nhật trạng thái</button><button className="button button--soft" type="button" onClick={() => window.open(base + '/receipt.html', '_blank', 'noopener')}>In biên nhận / Lưu PDF</button></div></header>
    <div className="commerce-totals"><div><small>Giá trị đơn</small><strong>{money.format(order.total)}</strong></div><div><small>Khoản bù / phí đã trả</small><strong>{money.format(order.extraPaid)}</strong></div><div><small>Đã hoàn lại</small><strong>{money.format(order.refundAmount)}</strong></div></div>
    <dl className="commerce-facts"><div><dt>Người nhận</dt><dd>{order.recipient} · {order.phone}</dd></div><div><dt>Giao / nhận</dt><dd>{order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : order.address}</dd></div><div><dt>Lịch hẹn</dt><dd>{date(order.scheduledAt)}</dd></div><div><dt>Thanh toán</dt><dd>{order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : order.paymentMethod === 'cash' ? 'Trực tiếp tại quầy' : 'Khi nhận hàng'}{order.paymentConfirmation === 'counter' ? ' · Đã xác nhận thu trực tiếp' : ''}</dd></div></dl>
    {order.status === 'pending' && order.paymentMethod === 'bank_transfer' && <PaymentBox orderId={order.id} account={account} onDone={async state => { try { await reload() } finally { onPaymentComplete?.(state) } }} onExit={() => onNavigate?.('/checkout?order=' + encodeURIComponent(order.id))} />}
    {order.status === 'pending' && order.paymentMethod !== 'bank_transfer' && <p className="commerce-note">Bạn thanh toán khi nhận hàng. Nhân viên xác nhận tiền thực nhận để cập nhật bill và điểm thưởng.</p>}
    <div className="commerce-actions">{order.status === 'pending' && <button type="button" disabled={busy} onClick={() => act(base + '/cancel-unpaid', {})}>Hủy đơn chưa thanh toán</button>}{canRequest && !open && Object.entries(kinds).map(([key,label]) => <button type="button" key={key} disabled={busy || (key === 'cancel' && ['shipped','delivered'].includes(order.deliveryStatus)) || (['return','exchange','merchant_fault'].includes(key) && order.deliveryStatus !== 'delivered') || (key === 'reschedule' && ['shipped','delivered'].includes(order.deliveryStatus))} onClick={() => { setKind(key); setReplacements([]); setError('') }}>{label}</button>)}</div>
    {order.currentItems?.length > 0 && <div className="commerce-current-items"><h3>Hàng đang sở hữu của đơn</h3><ul>{order.currentItems.map(item => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul></div>}
    {kind && <form className="commerce-request-form" onSubmit={event => {
      event.preventDefault()
      act(base + '/after-sales', { kind, reason,
        ...(kind === 'reschedule' ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        ...(kind === 'exchange' ? { replacementItems: replacements.map(({ id, quantity }) => ({ id, quantity })) } : {}),
      })
    }}>
      <h3>{kinds[kind]}</h3>
      <label className="field"><span>Lý do</span><textarea value={reason} onChange={event => setReason(event.target.value)} minLength="5" maxLength="1000" required rows="3" disabled={busy} /></label>
      {kind === 'reschedule' && <label className="field"><span>Lịch mới, tối đa {data.policy?.rescheduleDays ?? 3} ngày từ lịch cũ</span><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} required disabled={busy} /></label>}
      {kind === 'exchange' && <ReplacementPicker items={replacements} onChange={setReplacements} disabled={busy} />}
      <div className="commerce-actions"><button type="submit" disabled={busy || (kind === 'exchange' && !replacements.length)}>Xem bảng phí trước khi gửi</button><button type="button" disabled={busy} onClick={() => setKind('')}>Đóng</button></div>
    </form>}
    {requests.map(request => <AfterSalesCase key={request.id} request={request} order={order} busy={busy} onAction={act} onPay={setPayCase} />)}
    {payCase && <PaymentBox key={payCase} orderId={order.id} requestId={payCase} account={account} onExit={() => setPayCase(null)} onDone={async () => { setPayCase(null); await reload() }} />}
    {busy && <p role="status">Đang cập nhật đơn hàng…</p>}{error && <p className="commerce-error" role="alert">{error}</p>}
    {data.events?.length > 0 && <details className="commerce-history"><summary>Lịch sử đơn hàng</summary>{data.events.map((item,index) => <p key={index}><small>{date(item.createdAt)}</small><span>{item.message}</span></p>)}</details>}
    <p className="commerce-policy">Hủy trước giao: 1% tiền hàng, tối thiểu 1.000đ và không quá số tiền đã trả; khấu trừ một lần vào tiền hoàn. Trả / đổi trong {data.policy?.returnDays ?? 7} ngày từ khi nhận hàng. Trả hàng không hoàn phí giao ban đầu; khách trả cước gửi trả trực tiếp cho đơn vị vận chuyển. Đổi sản phẩm tính chênh lệch và phí giao lại trong bảng phí. Đổi lịch tối đa {data.policy?.rescheduleDays ?? 3} ngày từ lịch cũ. Lỗi cửa hàng được miễn phí và hoàn số tiền cửa hàng còn giữ.</p>
  </section>
}

export function CustomerOrders({ orders, account, onRefresh, onPaymentComplete, onNavigate }) {
  const [selected, setSelected] = useState(null)
  return <div className="commerce-order-list">{orders.map(order => <article key={order.id} className="commerce-order-row"><div className="commerce-row-head"><div><b>{order.id}</b><small>{date(order.createdAt)} · {order.itemCount} sản phẩm</small></div><div><strong>{money.format(order.total)}</strong><small>{states[order.status]}</small></div><button type="button" aria-expanded={selected === order.id} onClick={() => setSelected(current => current === order.id ? null : order.id)}>{selected === order.id ? 'Thu gọn' : 'Chi tiết / thanh toán'}</button></div>{selected === order.id && <OrderCenter key={order.id} orderId={order.id} account={account} onRefresh={onRefresh} onPaymentComplete={onPaymentComplete} onNavigate={onNavigate} />}</article>)}</div>
}
