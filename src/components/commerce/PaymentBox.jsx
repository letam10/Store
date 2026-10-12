import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../../api/customer'
import { userMessage } from '../../api/userMessages'
import { PAYMENT_WINDOW_MS, formatPaymentTime, paymentSecondsRemaining } from './paymentWindow'
import PaymentModal from './PaymentModal'
import './PaymentBox.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function PaymentBox({ orderId, requestId, sessionId, initialData, account, onDone, onExit }) {
  const [data, setData] = useState(initialData || null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reference, setReference] = useState('')
  const [seconds, setSeconds] = useState(PAYMENT_WINDOW_MS / 1000)
  const deadline = useRef(initialData?.expiresAt ? Date.parse(initialData.expiresAt) : 0)
  const gate = useRef(false)
  const finished = useRef(false)
  const paymentRequest = useRef(null)
  const callbacks = useRef({ onDone, onExit })
  const path = sessionId ? '/api/customer/payment-sessions/' + encodeURIComponent(sessionId) : requestId
    ? '/api/customer/after-sales/' + encodeURIComponent(requestId)
    : '/api/customer/orders/' + encodeURIComponent(orderId)
  useEffect(() => { callbacks.current = { onDone, onExit } }, [onDone, onExit])
  useEffect(() => () => paymentRequest.current?.abort(), [])

  useEffect(() => {
    if (initialData) return undefined
    const controller = new AbortController()
    const suffix = sessionId ? '' : requestId ? '/payment' : '/payment-info'
    customerApi(path + suffix, { signal: controller.signal })
      .then(async result => {
        if (controller.signal.aborted) return
        if (!requestId && ['paid', 'completed'].includes(result.order?.status)) {
          finished.current = true
          await callbacks.current.onDone?.('paid', result.order)
          return
        }
        deadline.current = result.expiresAt ? Date.parse(result.expiresAt) : Date.now() + PAYMENT_WINDOW_MS
        setData(result)
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(userMessage(failure))
      })
    return () => controller.abort()
  }, [path, requestId, sessionId, initialData])

  useEffect(() => {
    if (!data || data.payment.mode === 'counter') return undefined
    function updateTime() {
      const remaining = paymentSecondsRemaining(deadline.current)
      setSeconds(remaining)
      // Hết giờ quay lại form cũ; phiên QR chưa thanh toán không phải đơn đã lưu.
      if (!remaining && !finished.current) {
        finished.current = true
        paymentRequest.current?.abort()
        callbacks.current.onExit?.('expired')
      }
    }
    updateTime()
    const interval = window.setInterval(updateTime, 1000)
    window.addEventListener('focus', updateTime)
    document.addEventListener('visibilitychange', updateTime)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', updateTime)
      document.removeEventListener('visibilitychange', updateTime)
    }
  }, [data])

  useEffect(() => {
    if (!data || requestId || data.payment.mode !== 'manual') return undefined
    const controller = new AbortController()
    let polling = false
    const interval = window.setInterval(async () => {
      if (polling || gate.current || finished.current || !paymentSecondsRemaining(deadline.current)) return
      polling = true
      try {
        const result = await customerApi(path + (sessionId ? '' : '/payment-info'), {
          signal: controller.signal,
        })
        if (!controller.signal.aborted && !finished.current
          && paymentSecondsRemaining(deadline.current) > 0
          && ['paid', 'completed'].includes(result.order?.status)) {
          finished.current = true
          await callbacks.current.onDone?.('paid', result.order)
        }
      } catch {
        // Mất mạng tạm thời không xóa QR; người dùng vẫn có thể gửi mã giao dịch.
      } finally { polling = false }
    }, 5000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [data, path, requestId, sessionId])

  async function pay() {
    if (gate.current || finished.current || !data) return
    if (!paymentSecondsRemaining(deadline.current)) {
      finished.current = true
      callbacks.current.onExit?.('expired')
      return
    }
    gate.current = true
    const controller = new AbortController()
    paymentRequest.current = controller
    setBusy(true)
    setError('')
    try {
      const simulation = data.payment.mode === 'demo'
      const suffix = simulation
        ? requestId ? '/demo-paid' : '/simulate-pay'
        : requestId ? '/action' : '/payment-report'
      const result = await customerApi(path + suffix, {
        method: 'POST',
        signal: controller.signal,
        csrfToken: account.csrfToken,
        body: JSON.stringify(simulation ? {} : requestId ? { action: 'payment_report', reference } : { reference }),
      })
      if (controller.signal.aborted || finished.current) return
      finished.current = true
      await callbacks.current.onDone?.(simulation ? 'paid' : 'reported', result.order)
    } catch (failure) {
      if (controller.signal.aborted || finished.current) return
      finished.current = false
      setError(userMessage(failure))
    } finally {
      gate.current = false
      setBusy(false)
    }
  }

  function exit() {
    if (finished.current) return
    finished.current = true
    paymentRequest.current?.abort()
    callbacks.current.onExit?.('exit')
  }

  if (!data) return <PaymentModal onClose={exit}>
    <section className="bank-payment-card surface">
      <header className="bank-payment-card__head">
        <h1>Thanh toán chuyển khoản</h1>
        <button type="button" className="bank-payment-close" aria-label="Đóng thanh toán" onClick={exit}>
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <p role={error ? 'alert' : 'status'}>{error || 'Đang chuẩn bị mã QR ngân hàng…'}</p>
      <button type="button" className="button button--soft" onClick={exit}>
        Về trang thanh toán
      </button>
    </section>
  </PaymentModal>

  const payment = data.payment
  if (payment.mode === 'counter') return <section className="commerce-payment">
    <div>
      <p className="eyebrow">Thanh toán phí tại cửa hàng</p>
      <h3>{money.format(payment.amount)}</h3>
      <p>Đưa mã <code>{payment.reference}</code> cho nhân viên để xác nhận đã thu phí trực tiếp.</p>
    </div>
  </section>

  return <PaymentModal onClose={exit}>
    <section className="bank-payment-card surface" aria-label="Mã QR ngân hàng">
      <header className="bank-payment-card__head">
        <div className="bank-payment-card__title">
          <p className="eyebrow">{requestId ? 'Phí xử lý yêu cầu' : 'Thanh toán đơn hàng'}</p>
          <h1>Mã QR ngân hàng</h1>
          <p>{sessionId ? 'Mã thanh toán: ' : 'Mã đơn: '}<strong>{orderId}</strong></p>
        </div>
        <div className={'bank-payment-timer' + (seconds <= 60 ? ' is-ending' : '')}>
          <span>Thời gian còn lại</span>
          <strong role="timer" aria-label="Thời gian thanh toán còn lại">{formatPaymentTime(seconds)}</strong>
        </div>
        <button type="button" className="bank-payment-close" aria-label="Đóng thanh toán" onClick={exit}>
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className="bank-payment-card__body">
        <div className="bank-payment-qr">
          <div className="bank-payment-qr__frame">
            <img src={payment.qrImage} width="280" height="280" alt={'Mã QR: ' + payment.purpose} />
          </div>
          <p>{payment.mode === 'demo' ? 'QR thử nghiệm · không chuyển tiền thật' : 'Quét bằng ứng dụng ngân hàng'}</p>
        </div>
        <div className="bank-payment-details">
          <div className="bank-payment-total">
            <span>Số tiền cần thanh toán</span>
            <strong className="bank-payment-amount">{money.format(payment.amount)}</strong>
          </div>
          <dl className="commerce-facts">
            <div>
              <dt>Ngân hàng</dt>
              <dd>{payment.bankName}</dd>
            </div>
            <div>
              <dt>Số tài khoản</dt>
              <dd>{payment.accountNumber}</dd>
            </div>
            <div>
              <dt>Người nhận</dt>
              <dd>{payment.accountName}</dd>
            </div>
            <div className="bank-payment-reference">
              <dt>Nội dung chuyển khoản</dt>
              <dd><code>{payment.reference}</code></dd>
            </div>
          </dl>
          {payment.mode !== 'demo' && <label className="field">
            <span>Mã giao dịch của bạn</span>
            <input value={reference} maxLength="100" onChange={event => setReference(event.target.value)} />
          </label>}
          <button type="button" className="button"
            disabled={busy || !seconds || (payment.mode !== 'demo' && reference.trim().length < 3)} onClick={pay}>
            {busy ? 'Đang xác nhận…' : payment.mode === 'demo'
              ? 'Mô phỏng chuyển khoản thành công' : 'Tôi đã chuyển khoản'}
          </button>
          <p className="bank-payment-note">{payment.mode === 'demo'
            ? 'Dùng để kiểm tra quy trình thanh toán trong Store.'
            : 'Thông báo chuyển khoản được lưu trong trang cá nhân. Cửa hàng đối soát trước khi xác nhận nhận tiền.'}</p>
          {error && <p className="commerce-error" role="alert">{error}</p>}
        </div>
      </div>
      <footer className="bank-payment-card__footer">
        <p>Hết 2 phút sẽ trở lại trang thanh toán. Đơn chỉ được lưu sau khi bạn xác nhận thanh toán.</p>
        <button type="button" className="button button--soft" onClick={exit}>
          Thoát thanh toán
        </button>
      </footer>
    </section>
  </PaymentModal>
}
