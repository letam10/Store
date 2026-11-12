import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'
import { formatPaymentTime, paymentSecondsRemaining } from '../../utils/paymentWindow'
import PaymentModal from './PaymentModal'
import UnmatchedPayments from './UnmatchedPayments'
import './PaymentBox.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function PaymentBox({ orderId, requestId, sessionId, initialData, account, onDone, onExit }) {
  const [data, setData] = useState(initialData || null)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [notice, setNotice] = useState('')
  const gate = useRef(false)
  const finished = useRef(false)
  const version = useRef(0)
  const request = useRef(null)
  const callbacks = useRef({ onDone, onExit })
  const deadline = useRef(0)
  const id = sessionId || orderId
  const path = requestId ? '/api/customer/after-sales/' + encodeURIComponent(requestId)
    : '/api/customer/payment-sessions/' + encodeURIComponent(id)
  useEffect(() => { callbacks.current = { onDone, onExit } }, [onDone, onExit])
  useEffect(() => () => request.current?.abort(), [])

  useEffect(() => {
    if (!data) return
    const clockOffset = data.serverTime ? Date.now() - Date.parse(data.serverTime) : 0
    deadline.current = data.expiresAt ? Date.parse(data.expiresAt) + clockOffset : 0
    const tick = () => setSeconds(paymentSecondsRemaining(deadline.current))
    tick()
    const timer = window.setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', tick) }
  }, [data])

  useEffect(() => {
    const controller = new AbortController()
    let polling = false
    async function refresh() {
      if (polling || gate.current || finished.current) return
      polling = true
      const sequence = version.current
      try {
        const result = await customerApi(path + (requestId ? '/payment' : ''), { signal: controller.signal })
        if (controller.signal.aborted || sequence !== version.current || finished.current) return
        setData(result)
        if (requestId ? result.status === 'paid' : ['paid', 'completed'].includes(result.order?.status)) {
          finished.current = true
          await callbacks.current.onDone?.('paid', result.order)
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(userMessage(failure))
      } finally { polling = false }
    }
    refresh()
    const timer = window.setInterval(refresh, 3000)
    window.addEventListener('focus', refresh)
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [path, requestId])

  async function reportPayment() {
    if (gate.current || finished.current || reference.trim().length < 3) return
    gate.current = true
    version.current += 1
    setBusy(true)
    setError('')
    const controller = new AbortController()
    request.current = controller
    try {
      const result = await customerApi(path + (requestId ? '/action' : '/payment-report'), {
        method: 'POST', signal: controller.signal, csrfToken: account.csrfToken,
        body: JSON.stringify(requestId ? { action: 'payment_report', reference: reference.trim() } : { reference: reference.trim() }),
      })
      if (controller.signal.aborted || finished.current) return
      if (requestId) setData(current => ({ ...current, status: 'reported', canPay: false, payment: null }))
      else setData(result)
      setNotice('Đã lưu thông tin chuyển khoản. Cửa hàng đang đối chiếu sao kê; bạn không cần chuyển lại.')
    } catch (failure) {
      if (!controller.signal.aborted) setError(userMessage(failure))
    } finally { gate.current = false; setBusy(false) }
  }

  function close() {
    finished.current = true
    request.current?.abort()
    const phase = data?.status || data?.order?.paymentState || 'pending'
    callbacks.current.onExit?.(phase === 'pending' && data?.expiresAt && !seconds ? 'expired' : phase)
  }

  async function renewPayment() {
    if (!requestId || gate.current || finished.current) return
    gate.current = true
    version.current += 1
    setBusy(true)
    setError('')
    setNotice('')
    const controller = new AbortController()
    request.current = controller
    try {
      await customerApi(path + '/action', { method: 'POST', signal: controller.signal, csrfToken: account.csrfToken, body: JSON.stringify({ action: 'renew_payment' }) })
      const result = await customerApi(path + '/payment', { signal: controller.signal })
      if (!controller.signal.aborted && !finished.current) setData(result)
    } catch (failure) {
      if (!controller.signal.aborted) setError(userMessage(failure))
    } finally { gate.current = false; setBusy(false) }
  }

  if (data?.payment?.mode === 'counter') return <PaymentModal onClose={close}><section className="bank-payment-card surface">
    <header className="bank-payment-card__head"><h2>Thanh toán khoản bù tại cửa hàng</h2><button type="button" className="bank-payment-close" aria-label="Đóng thanh toán" onClick={close}>×</button></header>
    <div className="bank-payment-details"><p>{money.format(data.payment.amount)} · Mã {data.payment.reference}.</p><p>Cửa hàng xác nhận sau khi đã thu tiền thực tế. Trạng thái được cập nhật tự động.</p></div>
    <footer className="bank-payment-card__footer"><button type="button" className="button button--soft" onClick={close}>Về chi tiết đơn hàng</button></footer>
  </section></PaymentModal>
  const state = data?.status || data?.order?.paymentState || 'pending'
  const payment = data?.payment
  const canPay = Boolean(payment?.mode === 'manual' && seconds > 0 && (data?.canPay ?? state === 'pending'))
  const waiting = ['reported', 'needs_review'].includes(state)
  const unmatched = ['unmatched_received', 'refunded_unmatched'].includes(state)
  return <PaymentModal onClose={close}>
    <section className="bank-payment-card surface" aria-label="Thanh toán chuyển khoản">
      <header className="bank-payment-card__head">
        <div className="bank-payment-card__title"><p className="eyebrow">{requestId ? 'Khoản bù đổi hàng' : 'Thanh toán đơn hàng'}</p><h1>{canPay ? 'Mã QR ngân hàng' : waiting ? 'Chờ cửa hàng đối soát' : data ? 'Phiên chuyển khoản' : 'Đang tải thanh toán…'}</h1><p>Mã: <strong>{requestId || id}</strong></p></div>
        {canPay && <div className="bank-payment-timer"><span>Thời gian còn lại</span><strong role="timer" aria-label="Thời gian thanh toán còn lại">{formatPaymentTime(seconds)}</strong></div>}
        <button type="button" className="bank-payment-close" aria-label="Đóng thanh toán" onClick={close}><span aria-hidden="true">×</span></button>
      </header>
      {canPay && <div className="bank-payment-card__body">
        <div className="bank-payment-qr"><div className="bank-payment-qr__frame"><img src={payment.qrImage} width="280" height="280" alt={'Mã QR: ' + payment.purpose} /></div><p>Quét bằng ứng dụng ngân hàng</p></div>
        <div className="bank-payment-details"><div className="bank-payment-total"><span>Số tiền cần thanh toán</span><strong className="bank-payment-amount">{money.format(payment.amount)}</strong></div>
          <dl className="commerce-facts">{[['Ngân hàng',payment.bankName],['Số tài khoản',payment.accountNumber],['Người nhận',payment.accountName],['Nội dung chuyển khoản',payment.reference]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </div>
      </div>}
      {data && !canPay && <p role="status">{unmatched ? state === 'refunded_unmatched' ? 'Cửa hàng đã ghi nhận hoàn đủ khoản chuyển không khớp. Bạn có thể xem chứng từ bên dưới.' : 'Cửa hàng đã nhận khoản chuyển không khớp và đang xử lý hoàn tiền. Không chuyển thêm theo QR cũ.' : waiting ? requestId ? 'Đã tiếp nhận thông báo khoản bù. Cửa hàng sẽ đối chiếu sao kê trước khi giao hàng thay thế.' : 'Đã tiếp nhận thông báo, chưa xác nhận đã nhận tiền. Đơn chỉ vào lịch sử mua sau khi cửa hàng đối soát thành công.' : 'QR đã đóng hoặc hết hạn. Không chuyển tiền theo mã đã lưu. Nếu đã chuyển, gửi mã giao dịch bên dưới để cửa hàng kiểm tra.'}</p>}
      <UnmatchedPayments payments={data?.unmatchedPayments} />
      {requestId && data?.canRenew && !waiting && <button type="button" className="button button--soft" disabled={busy} onClick={renewPayment}>Tôi chưa chuyển tiền — mở QR mới</button>}
      {data && !['paid','refunded_unmatched','unmatched_received'].includes(state) && <div className="bank-payment-details">
        <label className="field"><span>Mã giao dịch của bạn</span><input value={reference} maxLength="100" onChange={event => setReference(event.target.value)} /></label>
        <button type="button" className="button" disabled={busy || reference.trim().length < 3} onClick={reportPayment}>{busy ? 'Đang gửi…' : waiting ? 'Cập nhật mã giao dịch' : 'Tôi đã chuyển khoản'}</button>
      </div>}
      {notice && !['paid', 'refunded_unmatched', 'unmatched_received'].includes(state) && <p role="status">{notice}</p>}{error && <p className="commerce-error" role="alert">{error}</p>}
      <footer className="bank-payment-card__footer"><p>Hạn QR do cửa hàng xác định, tải lại trang không gia hạn. Báo chuyển khoản không đồng nghĩa đã nhận tiền.</p><button type="button" className="button button--soft" onClick={close}>Về trang thanh toán</button></footer>
    </section>
  </PaymentModal>
}
