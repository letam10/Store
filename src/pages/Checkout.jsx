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
import { useLanguage } from '../storefront/i18n'
import DropdownMenu from '../components/ui/DropdownMenu'
import OrderCenter from '../components/commerce/OrderCenter'
import CheckoutOrder from '../components/commerce/CheckoutOrder'
import PaymentBox from '../components/commerce/PaymentBox'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Chức năng Checkout: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Checkout({ cart: currentCart, account, membershipTier = 'bronze', wallet = [],
  selectedVoucherCodes = [], onCatalogRefresh,
  onToggleVoucher, onApplyVoucherCode, onComplete, onRefresh, search = '', onNavigate, onPaymentComplete, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const paymentOptions = [
    { value: 'bank_transfer', label: english ? 'Bank Transfer / QR' : 'Chuyển khoản / QR' },
    { value: 'later', label: english ? 'Payment on delivery' : 'Thanh toán khi nhận hàng' },
  ]
  const fulfillmentOptions = [
    { value: 'delivery', label: english ? 'Home delivery' : 'Giao tận nơi' },
    { value: 'pickup', label: english ? 'Store pickup' : 'Nhận tại cửa hàng' },
  ]
  const regionOptions = [
    ...DOMESTIC_REGIONS.map(([value, label]) => ({ value, label })),
    { value: 'international', label: english ? 'International shipping' : 'Ship ngoại quốc · quốc tế' },
  ]
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
  const [manualVoucherCode, setManualVoucherCode] = useState('')
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
      .catch((error) => {
        if (controller.signal.aborted) return
        setQuote(null)
        setQuoteError(userMessage(error))
        if (error.code === 'CATALOG_OUT_OF_SYNC') Promise.resolve(onCatalogRefresh?.()).catch(() => {})
      })
    return () => controller.abort()
  }, [account.csrfToken, itemKey, fulfillment, region, weightKg, selectedVoucherCodes, onCatalogRefresh])

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
  if (completedOrder) return <div className="container page-shell"><section className="surface checkout-card"><div className="checkout-email-badge" style={{background:'#eaf8ee',border:'1px solid #c3e6cb',color:'#1e5e34',padding:'12px 18px',borderRadius:'10px',marginBottom:'18px',fontSize:'14px',display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'18px'}}>✉</span><span><strong>Đã gửi hóa đơn điện tử:</strong> Bản chi tiết đơn hàng đã được gửi tới <u>{account.email}</u>. Vui lòng kiểm tra hộp thư của bạn.</span></div><h1>Đơn hàng đã được tạo</h1><OrderCenter orderId={completedOrder.id} account={account} onRefresh={onRefresh} /><div className="commerce-actions"><a className="button button--soft" href="/account">Tất cả đơn hàng</a><a className="button button--soft" href="/rewards">Đến vòng quay may mắn</a></div></section></div>
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>{english ? 'No items selected for checkout' : 'Chưa chọn sản phẩm để thanh toán'}</h2><a className="button" href="/cart">{english ? 'Back to cart' : 'Về giỏ hàng'}</a></section></div>

  const goodsVouchers = wallet.filter((voucher) => (voucher.scope || 'goods') === 'goods')
  const shippingVouchers = wallet.filter((voucher) => voucher.scope === 'shipping')
  const manualCodes = selectedVoucherCodes.filter((code) => !wallet.some((voucher) => voucher.code === code))
  // Chức năng voucherGroup: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const voucherGroup = (key, title, icon, vouchers) => <div className={'checkout-voucher-group' + (openVoucher === key ? ' is-open' : '')}>
    <button className="checkout-voucher-group__trigger" type="button" aria-expanded={openVoucher === key} onClick={() => setOpenVoucher((current) => current === key ? '' : key)}><span className="voucher-type-icon" aria-hidden="true">{icon}</span><span><b>{title}</b><small>{vouchers.length ? (english ? `${vouchers.length} vouchers available` : `${vouchers.length} voucher đang có`) : (english ? 'No vouchers' : 'Chưa có voucher')}</small></span><span aria-hidden="true">{openVoucher === key ? '⌃' : '⌄'}</span></button>
    {openVoucher === key && <div className="checkout-voucher-group__panel">{vouchers.length ? vouchers.map((voucher) => <label className={'checkout-voucher-option' + (selectedVoucherCodes.includes(voucher.code) ? ' is-selected' : '')} key={voucher.code}><input type="checkbox" checked={selectedVoucherCodes.includes(voucher.code)} onChange={() => onToggleVoucher(voucher.code)} /><span><b>{voucher.label}</b><code>{voucher.code}</code><small>{english ? 'Expires: ' : 'Hạn dùng: '}{new Date(voucher.expiresAt).toLocaleDateString(english ? 'en-US' : 'vi-VN')}</small></span><strong>{voucher.type === 'percent' ? voucher.value + '%' : money.format(voucher.value)}</strong></label>) : <p className="muted">{english ? 'You have no vouchers in this category.' : 'Bạn chưa có voucher loại này.'}</p>}</div>}
  </div>

  return <div className="container page-shell">
    <header className="page-head">
      <div><p className="eyebrow">{english ? 'Shopping' : 'Mua hàng'}</p><h1>{english ? 'Checkout' : 'Thanh toán'}</h1></div>
      <span className="membership-badge">{plan.badge}</span>
    </header>
    {paymentNotice && <p className="checkout-payment-notice" role="status">{paymentNotice}</p>}
    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <label className="field"><span>{english ? 'Payment method' : 'Thanh toán'}</span><DropdownMenu value={paymentChoice} options={paymentOptions.map((option) => ({ ...option, label: option.value === 'later' && fulfillment === 'pickup' ? (english ? 'Pay at counter' : 'Thanh toán trực tiếp tại quầy') : option.label }))} ariaLabel={english ? 'Payment method' : 'Phương thức thanh toán'} onChange={setPaymentChoice} /></label>
        <label className="field"><span>{english ? 'Delivery / pickup schedule' : 'Lịch giao / nhận'}</span><input type="datetime-local" value={schedule} onChange={event => setSchedule(event.target.value)} required /></label>
        <label className="field"><span>{english ? 'Fulfillment method' : 'Cách nhận hàng'}</span><DropdownMenu value={fulfillment} options={fulfillmentOptions} ariaLabel={english ? 'Fulfillment method' : 'Cách nhận hàng'} onChange={setFulfillment} /></label>
        <section className="checkout-voucher"><div className="checkout-voucher__head"><div><span className="eyebrow">{english ? 'OFFERS' : 'ƯU ĐÃI'}</span><b>{english ? 'Select vouchers for your order' : 'Chọn voucher cho đơn hàng'}</b></div><a href="/rewards">{english ? 'Lucky Spin →' : 'Vòng quay →'}</a></div>
          <form className="checkout-voucher__input" onSubmit={(event) => { event.preventDefault(); onApplyVoucherCode?.(manualVoucherCode); setManualVoucherCode('') }}><input aria-label={english ? 'Voucher code' : 'Mã voucher'} value={manualVoucherCode} onChange={(event) => setManualVoucherCode(event.target.value)} placeholder={english ? 'Enter voucher code' : 'Nhập mã voucher'} maxLength="80" /><button type="submit">{english ? 'Apply' : 'Áp dụng mã'}</button></form>
          {manualCodes.length > 0 && <small className="voucher-valid">Mã nhập: {manualCodes.join(', ')}</small>}
          <div className="checkout-voucher-groups">{voucherGroup('goods', english ? 'Goods vouchers' : 'Voucher hàng hóa', '⌂', goodsVouchers)}{voucherGroup('shipping', english ? 'Shipping vouchers' : 'Voucher phí vận chuyển', '✈', shippingVouchers)}</div>
        </section>
        <div className="form-grid">
          <label className="field">
            <span>{english ? 'Recipient name' : 'Tên người nhận'}</span>
            <input name="recipient" required value={recipient} onChange={event => setRecipient(event.target.value)} />
          </label>
          <label className="field">
            <span>{english ? 'Phone number' : 'Số điện thoại'}</span>
            <input name="phone" placeholder={english ? 'Delivery phone number' : 'Số điện thoại nhận hàng'} required inputMode="tel"
              autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} />
          </label>
          {fulfillment === 'delivery' && <>
            <label className="field field--wide">
              <span>{english ? 'Delivery address' : 'Địa chỉ nhận hàng'}</span>
              <input name="address" placeholder={english ? 'House number, street, ward / commune' : 'Số nhà, đường, phường / xã'} required
                autoComplete="street-address" value={address} onChange={event => setAddress(event.target.value)} />
            </label>
            <label className="field field--wide"><span>{english ? 'Province / city' : 'Tỉnh / thành nhận hàng'}</span><DropdownMenu value={region} options={regionOptions} ariaLabel={english ? 'Province or city' : 'Tỉnh hoặc thành phố nhận hàng'} onChange={setRegion} /></label>
            {region === 'international' && <label className="field"><span>{english ? 'Package weight (kg)' : 'Khối lượng hàng (kg)'}</span><input type="number" min="0.1" max="1000" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /></label>}
          </>}
        </div>
        <p className="checkout-disclaimer">{english ? 'Inner HCM City, Binh Duong & Ba Ria - Vung Tau: 30,000 ₫. Other provinces: 60,000 ₫ flat rate. International: 200,000 ₫ up to 1 kg, 400,000 ₫ for 2–5 kg.' : 'Nội thành TP. Hồ Chí Minh, Bình Dương và Bà Rịa - Vũng Tàu: 30.000 ₫. Các tỉnh, thành khác: 60.000 ₫ cố định. Ship quốc tế: 200.000 ₫ cho tối đa 1 kg, từ 2–5 kg là 400.000 ₫.'}</p>
        {quoteError && <p className="voucher-invalid" role="alert">{quoteError}</p>}
        <button className="button" type="submit" data-payment-trigger disabled={busy || !quote}>
          {busy ? (english ? 'Processing…' : 'Đang xử lý…') : (paymentChoice === 'bank_transfer' ? (english ? 'Pay · ' : 'Thanh toán · ') : (english ? 'Confirm order · ' : 'Xác nhận đơn · '))
            + money.format(quote?.total ?? cartTotal(cart))}
        </button>
      </form>
      <aside className="surface summary-card"><p className="eyebrow">{english ? 'Your order' : 'Đơn của bạn'}</p>
        {cart.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}
        <div className="summary-row"><span>{english ? 'Subtotal' : 'Tạm tính'}</span><span>{money.format(quote?.subtotal ?? cartTotal(cart))}</span></div>
        <div className="summary-row"><span>{english ? `Voucher + Tier ${plan.name}` : `Voucher + hạng ${plan.name}`}</span><b>-{money.format(quote ? quote.subtotal - quote.goodsTotal : 0)}</b></div>
        <div className="summary-row"><span>{english ? 'Shipping fee' : 'Phí giao hàng'}</span><span>{money.format(quote?.shippingFeeBeforeDiscount ?? quote?.shippingFee ?? 0)}</span></div>
        {quote?.shippingDiscount > 0 && <div className="summary-row"><span>{english ? 'Shipping discount' : 'Đã giảm phí ship'}</span><b>-{money.format(quote.shippingDiscount)}</b></div>}
        <div className="summary-row summary-row--total"><span>{english ? 'Total' : 'Tổng'}</span><span>{money.format(quote?.total ?? 0)}</span></div>
        <p className="checkout-disclaimer">
          {english ? 'Check total before scanning QR. Bank transfer orders are saved only after payment confirmation.' : 'Kiểm tra tổng tiền trước khi mở QR. Đơn chuyển khoản chỉ được lưu sau khi bạn xác nhận thanh toán.'}
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
