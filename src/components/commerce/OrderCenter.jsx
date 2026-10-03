import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../../api/customer'
import './OrderCenter.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const states = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', completed: 'Đã nhận hàng', cancelled: 'Đã hủy', refunded: 'Đã hoàn tiền' }
const deliveryStates = { processing: 'Đang chuẩn bị', ready: 'Sẵn sàng nhận', shipped: 'Đang giao', delivered: 'Đã giao / nhận', cancelled: 'Đã dừng giao' }
const caseStates = { awaiting_confirmation: 'Chờ bạn xác nhận phí', pending: 'Chờ cửa hàng duyệt', awaiting_payment: 'Chờ thanh toán phí', awaiting_return: 'Chờ nhận hàng trả', resolved: 'Đã xử lý', rejected: 'Chưa được duyệt', cancelled: 'Đã hủy yêu cầu' }
const kinds = { cancel: 'Hủy trước khi giao', return: 'Trả hàng đã nhận', reschedule: 'Hoãn / lỡ lịch hẹn', merchant_fault: 'Cửa hàng giao sai / hàng lỗi' }
const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—'
const tomorrow = () => {
  const value = new Date(Date.now() + 86400000)
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function PaymentBox({ orderId, requestId, account, onDone }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reference, setReference] = useState('')
  const [reported, setReported] = useState(false)
  const gate = useRef(false)
  const path = requestId ? '/api/customer/after-sales/' + encodeURIComponent(requestId) : '/api/customer/orders/' + encodeURIComponent(orderId)
  useEffect(() => {
    const controller = new AbortController()
    customerApi(path + '/payment', { signal: controller.signal }).then(setData).catch(failure => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [path])
  async function pay() {
    if (gate.current || !data) return
    gate.current = true; setBusy(true); setError('')
    try {
      const simulation = data.payment.mode === 'demo'
      const suffix = simulation ? '/demo-paid' : requestId ? '/action' : '/payment-report'
      await customerApi(path + suffix, { method: 'POST', csrfToken: account.csrfToken,
        body: JSON.stringify(simulation ? {} : requestId ? { action: 'payment_report', reference } : { reference }) })
      setReported(!simulation)
      await onDone()
    } catch (failure) { setError(failure.message) }
    finally { gate.current = false; setBusy(false) }
  }
  if (!data) return <div className="commerce-payment"><p role={error ? 'alert' : 'status'}>{error || 'Đang chuẩn bị mã QR…'}</p></div>
  const payment = data.payment
  if (payment.mode === 'counter') return <section className="commerce-payment"><div><p className="eyebrow">Thanh toán phí tại cửa hàng</p><h3>{money.format(payment.amount)}</h3><p>Đưa mã <code>{payment.reference}</code> cho nhân viên. Yêu cầu chỉ hoàn tất khi cửa hàng xác nhận đã thu phí trực tiếp.</p></div></section>
  return <section className="commerce-payment">
    <div className="commerce-qr"><img src={payment.qrImage} width="280" height="280" alt={'QR ' + payment.purpose} /><small>{payment.mode === 'demo' ? 'QR thử nghiệm · không chuyển tiền thật' : 'Quét bằng ứng dụng ngân hàng'}</small></div>
    <div><p className="eyebrow">{requestId ? 'Phí xử lý yêu cầu' : 'Chuyển khoản'}</p><h3>{money.format(payment.amount)}</h3><dl className="commerce-facts"><div><dt>Ngân hàng</dt><dd>{payment.bankName}</dd></div><div><dt>Số tài khoản</dt><dd>{payment.accountNumber}</dd></div><div><dt>Người nhận</dt><dd>{payment.accountName}</dd></div><div><dt>Nội dung</dt><dd><code>{payment.reference}</code></dd></div></dl>
      {payment.mode !== 'demo' && <label className="field"><span>Mã giao dịch của bạn</span><input value={reference} maxLength="100" onChange={event => setReference(event.target.value)} /></label>}
      <button type="button" className="button" disabled={busy || reported || (payment.mode !== 'demo' && reference.trim().length < 3)} onClick={pay}>{busy ? 'Đang xác nhận…' : reported ? 'Đã báo cửa hàng' : payment.mode === 'demo' ? 'Mô phỏng chuyển khoản thành công' : 'Tôi đã chuyển khoản'}</button>
      <p className="muted">{payment.mode === 'demo' ? 'Tài khoản giả dùng để kiểm tra quy trình. Bạn có thể cấu hình ngân hàng trong admin.' : 'Cửa hàng đối soát trước khi xác nhận đã nhận tiền.'}</p>{error && <p className="commerce-error" role="alert">{error}</p>}
    </div>
  </section>
}

export default function OrderCenter({ orderId, account, onRefresh }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState('')
  const [reason, setReason] = useState('Tôi cần cửa hàng hỗ trợ xử lý đơn hàng này.')
  const [scheduledAt, setScheduledAt] = useState(tomorrow)
  const [payCase, setPayCase] = useState(null)
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
    <header className="commerce-head"><div><p className="eyebrow">Đơn của bạn</p><h2>{order.id}</h2><p>{states[order.status]} · {deliveryStates[order.deliveryStatus]}</p></div><div className="commerce-actions"><button className="button button--soft" type="button" disabled={busy} onClick={() => act()}>Cập nhật trạng thái</button><button className="button button--soft" type="button" onClick={() => window.open(base + '/receipt.html', '_blank', 'noopener')}>In bill / Lưu PDF</button></div></header>
    <div className="commerce-totals"><div><small>Giá trị đơn</small><strong>{money.format(order.total)}</strong></div><div><small>Phí phát sinh đã trả</small><strong>{money.format(order.extraPaid)}</strong></div><div><small>Đã hoàn lại</small><strong>{money.format(order.refundAmount)}</strong></div></div>
    <dl className="commerce-facts"><div><dt>Người nhận</dt><dd>{order.recipient} · {order.phone}</dd></div><div><dt>Giao / nhận</dt><dd>{order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : order.address}</dd></div><div><dt>Lịch hẹn</dt><dd>{date(order.scheduledAt)}</dd></div><div><dt>Thanh toán</dt><dd>{order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : order.paymentMethod === 'cash' ? 'Trực tiếp tại quầy' : 'Khi nhận hàng'}{order.paymentConfirmation === 'counter' ? ' · Đã xác nhận thu trực tiếp' : ''}</dd></div></dl>
    {order.status === 'pending' && order.paymentMethod === 'bank_transfer' && <PaymentBox orderId={order.id} account={account} onDone={reload} />}
    {order.status === 'pending' && order.paymentMethod !== 'bank_transfer' && <p className="commerce-note">Bạn thanh toán khi nhận hàng. Nhân viên xác nhận tiền thực nhận để cập nhật bill và điểm thưởng.</p>}
    <div className="commerce-actions">{order.status === 'pending' && <button type="button" disabled={busy} onClick={() => act(base + '/cancel-unpaid', {})}>Hủy đơn chưa thanh toán</button>}{canRequest && !open && Object.entries(kinds).map(([key,label]) => <button type="button" key={key} disabled={busy || (key === 'cancel' && ['shipped','delivered'].includes(order.deliveryStatus)) || (['return','merchant_fault'].includes(key) && order.deliveryStatus !== 'delivered') || (key === 'reschedule' && order.deliveryStatus === 'delivered')} onClick={() => { setKind(key); setError('') }}>{label}</button>)}</div>
    {kind && <form className="commerce-request-form" onSubmit={event => { event.preventDefault(); act(base + '/after-sales', { kind, reason, ...(kind === 'reschedule' ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}) }) }}><h3>{kinds[kind]}</h3><label className="field"><span>Lý do</span><textarea value={reason} onChange={event => setReason(event.target.value)} minLength="5" maxLength="1000" required rows="3" /></label>{kind === 'reschedule' && <label className="field"><span>Lịch mới, trong 7 ngày từ lịch cũ</span><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} required /></label>}<div className="commerce-actions"><button type="submit" disabled={busy}>Xem bảng phí trước khi gửi</button><button type="button" onClick={() => setKind('')}>Đóng</button></div></form>}
    {requests.map(request => <article key={request.id} className="commerce-case"><header><div><strong>{kinds[request.kind]}</strong><small>{request.id} · {caseStates[request.status]}</small></div><span>{money.format(request.quote.feeAmount)}</span></header><p>{request.reason}</p><div className="commerce-fees">{request.quote.breakdown.map(item => <div key={item.label}><span>{item.label}</span><b>{money.format(item.amount)}</b></div>)}<div><span>Dự kiến hoàn lại</span><b>{money.format(request.quote.refundAmount)}</b></div>{request.quote.additionalDue > 0 && <div><span>Cần trả thêm</span><b>{money.format(request.quote.additionalDue)}</b></div>}</div>{request.scheduledAt && <p>Lịch mới: {date(request.scheduledAt)}</p>}{request.note && <p>{request.note}</p>}
      <div className="commerce-actions">{request.status === 'awaiting_confirmation' && <button disabled={busy} type="button" onClick={() => act('/api/customer/after-sales/' + request.id + '/action', { action: 'confirm' })}>Đồng ý phí và gửi yêu cầu</button>}{['awaiting_confirmation','pending','awaiting_payment'].includes(request.status) && !request.feePaidAt && <button disabled={busy} type="button" onClick={() => act('/api/customer/after-sales/' + request.id + '/action', { action: 'cancel' })}>Hủy yêu cầu</button>}{request.status === 'awaiting_payment' && <button type="button" onClick={() => setPayCase(request.id)}>Thanh toán phí</button>}</div>
      {request.status === 'awaiting_return' && <p className="commerce-note">Cửa hàng đã duyệt. {order.fulfillment === 'pickup' ? 'Mang hàng tới quầy để bàn giao.' : 'Gửi hàng về Store theo thông tin trang liên hệ.'} Tiền hoàn được xác nhận sau khi cửa hàng nhận hàng.</p>}{request.refundReference && <p>Mã hoàn tiền: <code>{request.refundReference}</code></p>}{request.compensation?.length > 0 && <p>Store đã tặng {request.compensation.length} voucher xin lỗi vào ví của bạn. <a href="/rewards">Mở ví voucher →</a></p>}
    </article>)}
    {payCase && <PaymentBox key={payCase} orderId={order.id} requestId={payCase} account={account} onDone={async () => { setPayCase(null); await reload() }} />}
    {busy && <p role="status">Đang cập nhật đơn hàng…</p>}{error && <p className="commerce-error" role="alert">{error}</p>}
    {data.events?.length > 0 && <details className="commerce-history"><summary>Lịch sử đơn hàng</summary>{data.events.map((item,index) => <p key={index}><small>{date(item.createdAt)}</small><span>{item.message}</span></p>)}</details>}
    <p className="commerce-policy">Hủy đơn đã thu tiền trước giao: 1% tiền hàng và phí ship đã thu. Trả trong 7 ngày: chịu phí gửi trả, không hoàn ship ban đầu. Hẹn lại tối đa 7 ngày; phí được báo trước khi bạn xác nhận. Nhận tại cửa hàng được giữ miễn phí trong 48 giờ. Lỗi cửa hàng: miễn toàn bộ phí và tặng voucher bù.</p>
  </section>
}

export function CustomerOrders({ orders, account, onRefresh }) {
  const [selected, setSelected] = useState(null)
  return <div className="commerce-order-list">{orders.map(order => <article key={order.id} className="commerce-order-row"><div className="commerce-row-head"><div><b>{order.id}</b><small>{date(order.createdAt)} · {order.itemCount} sản phẩm</small></div><div><strong>{money.format(order.total)}</strong><small>{states[order.status]}</small></div><button type="button" aria-expanded={selected === order.id} onClick={() => setSelected(current => current === order.id ? null : order.id)}>{selected === order.id ? 'Thu gọn' : 'Chi tiết / thanh toán'}</button></div>{selected === order.id && <OrderCenter key={order.id} orderId={order.id} account={account} onRefresh={onRefresh} />}</article>)}</div>
}
