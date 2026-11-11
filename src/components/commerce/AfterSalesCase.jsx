const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—'
const kinds = { cancel: 'Hủy trước khi giao', return: 'Trả hàng', exchange: 'Đổi sản phẩm', reschedule: 'Đổi lịch hẹn', merchant_fault: 'Giao sai / hàng lỗi' }
const states = {
  awaiting_confirmation: 'Chờ bạn đồng ý bảng phí', pending: 'Chờ cửa hàng duyệt', awaiting_return: 'Chờ cửa hàng nhận hàng trả',
  awaiting_payment: 'Chờ thanh toán khoản bù', awaiting_refund: 'Chờ cửa hàng hoàn tiền', awaiting_exchange: 'Chuẩn bị hàng thay thế',
  exchange_shipped: 'Đang giao hàng thay thế', resolved: 'Đã xử lý', rejected: 'Chưa được duyệt', cancelled: 'Đã hủy yêu cầu',
}

export default function AfterSalesCase({ request, order, busy, onAction, onPay }) {
  const path = '/api/customer/after-sales/' + encodeURIComponent(request.id) + '/action'
  const cancellable = ['awaiting_confirmation', 'pending', 'awaiting_return'].includes(request.status)
    && !request.goodsReceivedAt && !request.feePaidAt && !request.feeReportedAt
  return <article className="commerce-case" data-case-id={request.id}>
    <header><div><strong>{kinds[request.kind]}</strong><small>{request.id} · {states[request.status] || request.status}</small></div></header>
    <p>{request.reason}</p>
    {request.replacementItems?.length > 0 && <><h4>Hàng thay thế</h4><ul>{request.replacementItems.map(item => <li key={item.id}>{item.name} × {item.quantity} — {money.format(item.price * item.quantity)}</li>)}</ul></>}
    <div className="commerce-fees">{request.quote.breakdown.map((item, index) => <div key={index}><span>{item.label}</span><b>{item.amount == null ? 'Theo cước thực tế' : money.format(item.amount)}</b></div>)}
      <div><span>Số tiền hoàn theo yêu cầu</span><b>{money.format(request.quote.refundAmount)}</b></div>
      <div><span>Cần thanh toán thêm</span><b>{money.format(request.quote.additionalDue)}</b></div>
    </div>
    {request.scheduledAt && <p>Lịch mới: {date(request.scheduledAt)}</p>}{request.note && <p>Ghi chú cửa hàng: {request.note}</p>}
    {request.legacyReviewRequired ? <p role="alert">Yêu cầu cũ cần cửa hàng kiểm tra riêng bảng phí và chứng từ. Vui lòng liên hệ hỗ trợ.</p> : <div className="commerce-actions">
      {request.status === 'awaiting_confirmation' && <button disabled={busy} type="button" onClick={() => onAction(path, { action: 'confirm' })}>Đồng ý bảng phí và gửi yêu cầu</button>}
      {cancellable && <button disabled={busy} type="button" onClick={() => onAction(path, { action: 'cancel' })}>Hủy yêu cầu</button>}
      {request.status === 'awaiting_payment' && <button type="button" disabled={busy} onClick={() => onPay(request.id)}>{request.feeReportedAt ? 'Xem thông tin đối soát' : 'Thanh toán khoản bù'}</button>}
    </div>}
    {request.status === 'awaiting_return' && <p className="commerce-note">Cửa hàng đã duyệt. {order.fulfillment === 'pickup' ? 'Mang đủ hàng của đơn tới quầy để kiểm tra.' : 'Liên hệ cửa hàng để xác nhận địa chỉ gửi trả, sau đó gửi đủ hàng của đơn.'} Tiền hoàn hoặc hàng thay thế được xử lý sau khi cửa hàng nhận và kiểm tra hàng trả.</p>}
    {request.status === 'awaiting_refund' && <p className="commerce-note">Cửa hàng đang xử lý khoản hoàn. Số tiền “Đã hoàn lại” chỉ cập nhật sau khi cửa hàng xác nhận chứng từ hoàn tiền.</p>}
    {request.feeReportedAt && !request.feePaidAt && <p>Đã tiếp nhận mã giao dịch {request.feePaymentReportedReference}; đang chờ cửa hàng đối soát. Không chuyển lại khoản này.</p>}
    {request.feePaidAt && <p>Đã xác nhận khoản bù: {date(request.feePaidAt)} · <code>{request.feePaymentReference}</code></p>}
    {request.refundReference && <p>Mã hoàn tiền: <code>{request.refundReference}</code> · {date(request.refundedAt)}</p>}
    {request.trackingReference && <p>Vận đơn hàng đổi: <code>{request.trackingReference}</code></p>}
    {request.events?.length > 0 && <details className="commerce-history"><summary>Lịch sử xử lý yêu cầu</summary>{request.events.map((event, index) => <p key={index}><small>{date(event.createdAt)} · {event.actor}</small><span>{event.message}</span></p>)}</details>}
  </article>
}
