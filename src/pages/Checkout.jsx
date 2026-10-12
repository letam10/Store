/**
 * @codex-vn-doc
 * Tệp: src/pages/Checkout.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Checkout.
 * Liên kết trực tiếp: react, ../api/customer, ../storefront/promotions, ../storefront/state, ../data/shipping.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { customerApi } from '../api/customer'
import { userMessage } from '../api/userMessages'
import { getMembershipPlan } from '../storefront/promotions'
import { cartTotal } from '../storefront/state'
import { DOMESTIC_REGIONS } from '../data/shipping'
import OrderCenter from '../components/commerce/OrderCenter'
import CheckoutOrder from '../components/commerce/CheckoutOrder'
import PaymentBox from '../components/commerce/PaymentBox'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Chức năng Checkout: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Checkout({ cart: currentCart, account, membershipTier = 'bronze', wallet = [],
  selectedVoucherCodes = [],
  onToggleVoucher, onComplete, onRefresh, search = '', onNavigate, onPaymentComplete }) {
  const [completedOrder, setCompletedOrder] = useState(null)
  const [paymentSession, setPaymentSession] = useState(null)
  const [paymentNotice, setPaymentNotice] = useState('')
  const [recipient, setRecipient] = useState(account.username)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [returnedItems, setReturnedItems] = useState([])
  const cart = currentCart.length ? currentCart : returnedItems
  const submitGate = useRef(false)
  const [paymentChoice, setPaymentChoice] = useState('bank_transfer')
  const [schedule, setSchedule] = useState(() => { const d = new Date(Date.now() + 86400000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) })
  const [fulfillment, setFulfillment] = useState('delivery')
  const [region, setRegion] = useState('hcm')
  const [weightKg, setWeightKg] = useState(1)
  const [openVoucher, setOpenVoucher] = useState('goods')
  const [quoteResult, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [busy, setBusy] = useState(false)
  const items = useMemo(() => cart.map((item) => ({ id: item.id, quantity: item.quantity })), [cart])
  const itemKey = JSON.stringify(items)
  const plan = getMembershipPlan(membershipTier)
  const request = { items, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }
  const quoteKey = JSON.stringify(request)
  const quote = quoteResult?.quoteKey === quoteKey ? quoteResult : null

  useEffect(() => {
    const selectedItems = JSON.parse(itemKey)
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!selectedItems.length) return undefined
    const controller = new AbortController()
    const requestKey = JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes })
    customerApi('/api/customer/quote', { method: 'POST', csrfToken: account.csrfToken,
      body: JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }), signal: controller.signal })
      .then((result) => { setQuote({ ...result, quoteKey: requestKey }); setQuoteError('') })
      .catch((error) => { if (!controller.signal.aborted) { setQuote(null); setQuoteError(userMessage(error)) } })
    return () => controller.abort()
  }, [account.csrfToken, itemKey, fulfillment, region, weightKg, selectedVoucherCodes])

  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  async function submit(event) {
    event.preventDefault()
    if (submitGate.current || !quote) return
    submitGate.current = true; setBusy(true); setQuoteError('')
    const fields = new FormData(event.currentTarget)
    try {
      const bankTransfer = paymentChoice === 'bank_transfer'
      const path = bankTransfer ? '/api/customer/payment-sessions' : '/api/customer/orders'
      const payload = await customerApi(path, {
        method: 'POST',
        csrfToken: account.csrfToken,
        body: JSON.stringify({
          ...request,
          expectedTotal: quote.total,
          paymentMethod: bankTransfer ? 'bank_transfer' : fulfillment === 'pickup' ? 'cash' : 'cod',
          scheduledAt: new Date(schedule).toISOString(),
          recipient: fields.get('recipient'),
          phone: fields.get('phone'),
          address: fields.get('address') || '',
        }),
      })
      if (bankTransfer) {
        setPaymentNotice('')
        setPaymentSession({ ...payload, purchasedItems: cart })
      } else {
        setCompletedOrder(payload.order)
        onComplete(payload.order, cart)
      }
    } catch (error) { setQuoteError(userMessage(error, 'Vui lòng kiểm tra thông tin giao nhận và lịch hẹn.')) }
    finally { submitGate.current = false; setBusy(false) }
  }

  function exitPayment(reason) {
    const session = paymentSession
    setPaymentSession(null)
    setPaymentNotice(reason === 'expired'
      ? 'Đã hết 2 phút. Bạn có thể kiểm tra lại thông tin và thanh toán; đơn chưa được lưu.'
      : 'Đã thoát thanh toán. Thông tin đã nhập và giỏ hàng được giữ nguyên; đơn chưa được lưu.')
    if (session) customerApi('/api/customer/payment-sessions/' + encodeURIComponent(session.sessionId), {
      method: 'DELETE', csrfToken: account.csrfToken,
    }).catch(() => {
      // Phiên tạm tự hết hạn trên API nếu mất mạng lúc đóng QR.
    })
  }

  function finishPayment(state, order) {
    onComplete(order, paymentSession.purchasedItems)
    onPaymentComplete?.(state)
  }

  function exitSavedPayment(reason, order) {
    if (order) {
      setRecipient(order.recipient)
      setPhone(order.phone)
      setAddress(order.address)
      setFulfillment(order.fulfillment)
      setRegion(order.region || 'hcm')
      setReturnedItems(order.items || [])
      if (order.scheduledAt) {
        const scheduled = new Date(order.scheduledAt)
        setSchedule(new Date(scheduled.getTime() - scheduled.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16))
      }
    }
    setPaymentNotice(reason === 'expired' ? 'Đã hết 2 phút. Bạn đã trở lại trang thanh toán.'
      : 'Bạn đã trở lại trang thanh toán.')
    onNavigate?.('/checkout')
  }

  // VietQR, xác nhận thanh toán và biên nhận dùng chung dữ liệu ngân hàng từ API.
  const savedOrderId = new URLSearchParams(search).get('order')
  if (savedOrderId || completedOrder?.paymentMethod === 'bank_transfer') return <CheckoutOrder
    key={savedOrderId || completedOrder.id} orderId={savedOrderId || completedOrder.id}
    initialOrder={completedOrder?.id === (savedOrderId || completedOrder.id) ? completedOrder : undefined}
    account={account} onRefresh={onRefresh} onPaymentComplete={onPaymentComplete} onExit={exitSavedPayment} />
  if (completedOrder) return <div className="container page-shell"><section className="surface checkout-card"><h1>Đơn hàng đã được tạo</h1><OrderCenter orderId={completedOrder.id} account={account} onRefresh={onRefresh} /><div className="commerce-actions"><a className="button button--soft" href="/account">Tất cả đơn hàng</a><a className="button button--soft" href="/rewards">Đến vòng quay may mắn</a></div></section></div>
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>Chưa chọn sản phẩm để thanh toán</h2><a className="button" href="/cart">Về giỏ hàng</a></section></div>

  const goodsVouchers = wallet.filter((voucher) => (voucher.scope || 'goods') === 'goods')
  const shippingVouchers = wallet.filter((voucher) => voucher.scope === 'shipping')
  // Chức năng voucherGroup: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const voucherGroup = (key, title, icon, vouchers) => <div className={'checkout-voucher-group' + (openVoucher === key ? ' is-open' : '')}>
    <button className="checkout-voucher-group__trigger" type="button" aria-expanded={openVoucher === key} onClick={() => setOpenVoucher((current) => current === key ? '' : key)}><span className="voucher-type-icon" aria-hidden="true">{icon}</span><span><b>{title}</b><small>{vouchers.length ? `${vouchers.length} voucher đang có` : 'Chưa có voucher'}</small></span><span aria-hidden="true">{openVoucher === key ? '⌃' : '⌄'}</span></button>
    {openVoucher === key && <div className="checkout-voucher-group__panel">{vouchers.length ? vouchers.map((voucher) => <label className={'checkout-voucher-option' + (selectedVoucherCodes.includes(voucher.code) ? ' is-selected' : '')} key={voucher.code}><input type="checkbox" checked={selectedVoucherCodes.includes(voucher.code)} onChange={() => onToggleVoucher(voucher.code)} /><span><b>{voucher.label}</b><code>{voucher.code}</code><small>Hạn dùng: {new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}</small></span><strong>{voucher.type === 'percent' ? voucher.value + '%' : money.format(voucher.value)}</strong></label>) : <p className="muted">Bạn chưa có voucher loại này.</p>}</div>}
  </div>

  return <div className="container page-shell">
    <header className="page-head">
      <div><p className="eyebrow">Mua hàng</p><h1>Thanh toán</h1></div>
      <span className="membership-badge">{plan.badge}</span>
    </header>
    {paymentNotice && <p className="checkout-payment-notice" role="status">{paymentNotice}</p>}
    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <fieldset className="fulfillment-picker"><legend>Thanh toán</legend><label className={paymentChoice === "bank_transfer" ? "is-active" : ""}><input type="radio" name="payment-choice" checked={paymentChoice === "bank_transfer"} onChange={() => setPaymentChoice("bank_transfer")} /><span><b>Chuyển khoản / QR</b><small>Quét mã và nhận bill online.</small></span></label><label className={paymentChoice === "later" ? "is-active" : ""}><input type="radio" name="payment-choice" checked={paymentChoice === "later"} onChange={() => setPaymentChoice("later")} /><span><b>{fulfillment === "pickup" ? "Thanh toán trực tiếp tại quầy" : "Thanh toán khi nhận hàng"}</b><small>Nhân viên xác nhận tiền thực nhận.</small></span></label></fieldset>
        <label className="field"><span>Lịch giao / nhận</span><input type="datetime-local" value={schedule} onChange={event => setSchedule(event.target.value)} required /></label>
        <fieldset className="fulfillment-picker"><legend>Cách nhận hàng</legend>
          <label className={fulfillment === 'delivery' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><span><b>Giao tận nơi</b><small>Phí giao theo khu vực.</small></span></label>
          <label className={fulfillment === 'pickup' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><span><b>Nhận tại cửa hàng</b><small>Không tính phí giao.</small></span></label>
        </fieldset>
        <section className="checkout-voucher"><div className="checkout-voucher__head"><div><span className="eyebrow">ƯU ĐÃI</span><b>Chọn voucher cho đơn hàng</b></div><a href="/rewards">Vòng quay →</a></div>
          <div className="checkout-voucher-groups">{voucherGroup('goods', 'Voucher hàng hóa', '⌂', goodsVouchers)}{voucherGroup('shipping', 'Voucher phí vận chuyển', '✈', shippingVouchers)}</div>
        </section>
        <div className="form-grid">
          <label className="field">
            <span>Tên người nhận</span>
            <input name="recipient" required value={recipient} onChange={event => setRecipient(event.target.value)} />
          </label>
          <label className="field">
            <span>Số điện thoại</span>
            <input name="phone" placeholder="Số điện thoại nhận hàng" required inputMode="tel"
              autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} />
          </label>
          {fulfillment === 'delivery' && <>
            <label className="field field--wide">
              <span>Địa chỉ nhận hàng</span>
              <input name="address" placeholder="Số nhà, đường, phường / xã" required
                autoComplete="street-address" value={address} onChange={event => setAddress(event.target.value)} />
            </label>
            <label className="field field--wide"><span>Tỉnh / thành nhận hàng</span><select value={region} onChange={(event) => setRegion(event.target.value)}><optgroup label="Nội thành Store"><option value="hcm">TP. Hồ Chí Minh · nội thành</option><option value="binh-duong">Bình Dương · nội thành</option><option value="ba-ria-vung-tau">Bà Rịa - Vũng Tàu · nội thành</option></optgroup><optgroup label="Các tỉnh, thành Việt Nam">{DOMESTIC_REGIONS.slice(3).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</optgroup><option value="international">Ship ngoại quốc · quốc tế</option></select></label>
            {region === 'international' && <label className="field"><span>Khối lượng hàng (kg)</span><input type="number" min="0.1" max="1000" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /></label>}
          </>}
        </div>
        <p className="checkout-disclaimer">Nội thành TP. Hồ Chí Minh, Bình Dương và Bà Rịa - Vũng Tàu: 30.000 ₫. Các tỉnh, thành khác: 60.000 ₫ cố định. Ship quốc tế: 200.000 ₫ cho tối đa 1 kg, từ 2–5 kg là 400.000 ₫.</p>
        {quoteError && <p className="voucher-invalid" role="alert">{quoteError}</p>}
        <button className="button" type="submit" data-payment-trigger disabled={busy || !quote}>
          {busy ? 'Đang xử lý…' : (paymentChoice === 'bank_transfer' ? 'Thanh toán · ' : 'Xác nhận đơn · ')
            + money.format(quote?.total ?? cartTotal(cart))}
        </button>
      </form>
      <aside className="surface summary-card"><p className="eyebrow">Đơn của bạn</p>
        {cart.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}
        <div className="summary-row"><span>Tạm tính</span><span>{money.format(quote?.subtotal ?? cartTotal(cart))}</span></div>
        <div className="summary-row"><span>Voucher + hạng {plan.name}</span><b>-{money.format(quote ? quote.subtotal - quote.goodsTotal : 0)}</b></div>
        <div className="summary-row"><span>Phí giao hàng</span><span>{money.format(quote?.shippingFeeBeforeDiscount ?? quote?.shippingFee ?? 0)}</span></div>
        {quote?.shippingDiscount > 0 && <div className="summary-row"><span>Đã giảm phí ship</span><b>-{money.format(quote.shippingDiscount)}</b></div>}
        <div className="summary-row summary-row--total"><span>Tổng</span><span>{money.format(quote?.total ?? 0)}</span></div>
        <p className="checkout-disclaimer">
          Kiểm tra tổng tiền trước khi mở QR. Đơn chuyển khoản chỉ được lưu sau khi bạn xác nhận thanh toán.
        </p>
      </aside>
    </div>
    {paymentSession && <PaymentBox
      key={paymentSession.sessionId}
      orderId={paymentSession.order.id}
      sessionId={paymentSession.sessionId}
      initialData={paymentSession}
      account={account}
      onExit={exitPayment}
      onDone={finishPayment}
    />}
  </div>
}
