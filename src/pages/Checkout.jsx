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
import { getMembershipPlan } from '../services/promotions'
import { cartTotal } from '../services/storefrontState'
import { DOMESTIC_REGIONS } from '../data/shipping'
import { useLanguage, translateVoucherLabel } from '../context/i18n'
import DropdownMenu from '../components/ui/DropdownMenu'
import OrderCenter from '../components/commerce/OrderCenter'
import CheckoutOrder from '../components/commerce/CheckoutOrder'
import PaymentBox from '../components/commerce/PaymentBox'
import VoucherCodeInput from '../components/commerce/VoucherCodeInput'
import './Storefront.css'
import './Checkout.css'

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
    { value: 'international', label: english ? 'International shipping' : 'Vận chuyển quốc tế' },
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
  const checkoutRequest = useRef(null)
  const [paymentChoice, setPaymentChoice] = useState('bank_transfer')
  const [schedule, setSchedule] = useState(() => { const d = new Date(Date.now() + 86400000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) })
  const [fulfillment, setFulfillment] = useState('delivery')
  const [region, setRegion] = useState('hcm')
  const [weightKg, setWeightKg] = useState(1)
  const [openVoucher, setOpenVoucher] = useState('goods')
  const [quoteResult, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteVersion, setQuoteVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const items = useMemo(() => cart.map((item) => ({ id: item.id, quantity: item.quantity })), [cart])
  const itemKey = JSON.stringify(items)
  const plan = getMembershipPlan(membershipTier)
  const request = { items, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }
  const quoteKey = JSON.stringify(request)
  const quote = quoteResult?.quoteKey === quoteKey ? quoteResult : null
  const quotedItems = new Map((quote?.items || []).map(item => [String(item.id), item]))

  useEffect(() => {
    const selectedItems = JSON.parse(itemKey)
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!selectedItems.length) return undefined
    const controller = new AbortController()
    const requestKey = JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes })
    customerApi('/api/customer/quote', { method: 'POST', csrfToken: account.csrfToken,
      body: JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }), signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) { setQuote({ ...result, quoteKey: requestKey }); setQuoteError('') } })
      .catch((error) => {
        if (controller.signal.aborted) return
        setQuote(null)
        setQuoteError(userMessage(error))
        if (error.code === 'CATALOG_OUT_OF_SYNC') Promise.resolve(onCatalogRefresh?.()).catch(() => {})
      })
    return () => controller.abort()
  }, [account.csrfToken, itemKey, fulfillment, region, weightKg, selectedVoucherCodes, onCatalogRefresh, quoteVersion])

  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  async function submit(event) {
    event.preventDefault()
    if (submitGate.current || !quote) return
    submitGate.current = true; setBusy(true); setQuoteError('')
    const fields = new FormData(event.currentTarget)
    try {
      const bankTransfer = paymentChoice === 'bank_transfer'
      const path = bankTransfer ? '/api/customer/payment-sessions' : '/api/customer/orders'
      const body = {
        ...request, expectedTotal: quote.total,
        paymentMethod: bankTransfer ? 'bank_transfer' : fulfillment === 'pickup' ? 'cash' : 'cod',
        scheduledAt: new Date(schedule).toISOString(), recipient: fields.get('recipient'),
        phone: fields.get('phone'), address: fields.get('address') || '',
      }
      const fingerprint = JSON.stringify(body)
      if (checkoutRequest.current?.fingerprint !== fingerprint) checkoutRequest.current = {
        fingerprint, id: globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2),
      }
      const payload = await customerApi(path, { method: 'POST', csrfToken: account.csrfToken,
        body: JSON.stringify({ ...body, requestId: checkoutRequest.current.id }) })
      if (payload.status === 'paid') {
        onComplete(payload.order, cart)
        onPaymentComplete?.('paid')
        onNavigate?.('/checkout?order=' + encodeURIComponent(payload.order.id))
      } else if (bankTransfer) {
        setPaymentNotice('')
        setPaymentSession({ ...payload, purchasedItems: cart })
        localStorage.setItem('storeCheckoutItems:' + account.id + ':' + payload.sessionId, JSON.stringify(cart.map(item => ({ id: item.id, quantity: item.quantity }))))
        onNavigate?.('/checkout?payment=' + encodeURIComponent(payload.sessionId), { preserveScroll: true })
      } else {
        setCompletedOrder(payload.order)
        onComplete(payload.order, cart)
      }
    } catch (error) {
      setQuoteError(userMessage(error, 'Vui lòng kiểm tra thông tin giao nhận và lịch hẹn.'))
      if (error.code === 'QUOTE_CHANGED') {
        setQuote(null)
        setQuoteVersion(value => value + 1)
        setPaymentNotice('Giá đã thay đổi. Hãy kiểm tra tổng mới trước khi bấm thanh toán lại.')
        onCatalogRefresh?.()
      }
    }
    finally { submitGate.current = false; setBusy(false) }
  }

  function exitPayment(state) {
    setPaymentSession(null)
    if (['expired', 'cancelled'].includes(state)) checkoutRequest.current = null
    setPaymentNotice('Bạn có thể theo dõi phiên chuyển khoản trong trang cá nhân. Nếu đã chuyển tiền, vui lòng chờ đối soát và không chuyển lại.')
    onNavigate?.('/checkout', { preserveScroll: true })
  }

  function finishPayment(state, order) {
    if (state !== 'paid' || !order) return
    const key = 'storeCheckoutItems:' + account.id + ':' + order.id
    let purchased = paymentSession?.purchasedItems || []
    try { purchased = JSON.parse(localStorage.getItem(key) || 'null') || purchased } catch { /* Dùng bản nháp trong phiên hiện tại. */ }
    localStorage.removeItem(key)
    setCompletedOrder(order)
    setPaymentSession(null)
    onComplete(order, purchased)
    onPaymentComplete?.('paid')
    onNavigate?.('/checkout?order=' + encodeURIComponent(order.id))
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
  const savedPaymentId = new URLSearchParams(search).get('payment')
  const paymentId = savedPaymentId || paymentSession?.sessionId
  const paymentModal = paymentId && <PaymentBox key={paymentId} orderId={paymentId} sessionId={paymentId}
    initialData={paymentSession?.sessionId === paymentId ? paymentSession : undefined}
    account={account} onExit={exitPayment} onDone={finishPayment} />
  const savedOrderId = new URLSearchParams(search).get('order')
  if (savedOrderId || completedOrder?.paymentMethod === 'bank_transfer') return <CheckoutOrder
    key={savedOrderId || completedOrder.id} orderId={savedOrderId || completedOrder.id}
    initialOrder={completedOrder?.id === (savedOrderId || completedOrder.id) ? completedOrder : undefined}
    account={account} onRefresh={onRefresh} onPaymentComplete={onPaymentComplete} onExit={exitSavedPayment} />
  if (completedOrder) return <div className="container page-shell"><section className="surface checkout-card"><h1>Đã tiếp nhận yêu cầu đặt hàng</h1><p>Chưa xác nhận thanh toán. Biên nhận và thư điện tử được gửi sau khi cửa hàng xác nhận đã thu tiền.</p><OrderCenter orderId={completedOrder.id} account={account} onRefresh={onRefresh} /><a href="/checkout">Các phiên chờ xử lý</a></section></div>
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>{english ? 'No items selected for checkout' : 'Chưa chọn sản phẩm để thanh toán'}</h2><a className="button" href="/cart">{english ? 'Back to cart' : 'Về giỏ hàng'}</a><a className="button button--soft" href="/account">{english ? 'View your orders' : 'Theo dõi đơn hàng'}</a></section>{paymentModal}</div>

  const goodsVouchers = wallet.filter((voucher) => (voucher.scope || 'goods') === 'goods')
  const shippingVouchers = wallet.filter((voucher) => voucher.scope === 'shipping')
  const manualCodes = selectedVoucherCodes.filter((code) => !wallet.some((voucher) => voucher.code === code))
  // Chức năng voucherGroup: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const voucherGroup = (key, title, icon, vouchers) => <div className={'checkout-voucher-group' + (openVoucher === key ? ' is-open' : '')}>
    <button className="checkout-voucher-group__trigger" type="button" aria-expanded={openVoucher === key} onClick={() => setOpenVoucher((current) => current === key ? '' : key)}>
      <span className="voucher-type-icon" aria-hidden="true">{icon}</span>
      <span className="voucher-group-info">
        <b>{title}</b>
        <small>{vouchers.length ? (english ? `${vouchers.length} vouchers available` : `${vouchers.length} mã giảm giá đang có`) : (english ? 'No vouchers' : 'Chưa có mã giảm giá')}</small>
      </span>
      <span className="voucher-group-chevron" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
    {openVoucher === key && <div className="checkout-voucher-group__panel">{vouchers.length ? vouchers.map((voucher) => <label className={'checkout-voucher-option' + (selectedVoucherCodes.includes(voucher.code) ? ' is-selected' : '')} key={voucher.code}><input type="checkbox" checked={selectedVoucherCodes.includes(voucher.code)} onChange={() => onToggleVoucher(voucher.code)} /><span><b>{translateVoucherLabel(voucher.label, english ? 'en' : 'vi')}</b><code>{voucher.code}</code><small>{english ? 'Expires: ' : 'Hạn dùng: '}{new Date(voucher.expiresAt).toLocaleDateString(english ? 'en-US' : 'vi-VN')}</small></span><strong>{voucher.type === 'percent' ? voucher.value + '%' : money.format(voucher.value)}</strong></label>) : <p className="muted">{english ? 'You have no vouchers in this category.' : 'Bạn chưa có mã giảm giá loại này.'}</p>}</div>}
  </div>

  return <div className="container page-shell">
    <header className="page-head checkout-page-head">
      <div className="checkout-page-head__title">
        <p className="eyebrow">{english ? 'OmniCart Shopping' : 'OmniCart · Mua hàng'}</p>
        <h1>{english ? 'Checkout' : 'Thanh toán'}</h1>
      </div>
      <span className="membership-badge">{plan.badge}</span>
    </header>

    <div className="checkout-stepper" aria-label="Tiến trình thanh toán">
      <span className="checkout-stepper__step is-done">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        {english ? '1. Cart' : '1. Giỏ hàng'}
      </span>
      <span className="checkout-stepper__divider" aria-hidden="true">→</span>
      <span className="checkout-stepper__step is-active">
        {english ? '2. Delivery & Vouchers' : '2. Giao nhận & Ưu đãi'}
      </span>
      <span className="checkout-stepper__divider" aria-hidden="true">→</span>
      <span className="checkout-stepper__step">
        {english ? '3. VietQR Payment' : '3. Thanh toán VietQR'}
      </span>
    </div>

    {paymentNotice && <p className="checkout-payment-notice" role="status">{paymentNotice}</p>}

    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <div className="checkout-section">
          <div className="checkout-section__title">
            <span className="checkout-section__step-num">1</span>
            <span>{english ? 'Fulfillment & Schedule' : 'Hình thức & Lịch nhận hàng'}</span>
          </div>
          <label className="field">
            <span>{english ? 'Fulfillment method' : 'Cách nhận hàng'}</span>
            <DropdownMenu value={fulfillment} options={fulfillmentOptions} ariaLabel={english ? 'Fulfillment method' : 'Cách nhận hàng'} onChange={setFulfillment} />
          </label>
          <label className="field">
            <span>{english ? 'Delivery / pickup schedule' : 'Lịch giao / nhận'}</span>
            <input type="datetime-local" value={schedule} onChange={event => setSchedule(event.target.value)} required />
          </label>
        </div>

        <div className="checkout-section">
          <div className="checkout-section__title">
            <span className="checkout-section__step-num">2</span>
            <span>{english ? 'Recipient Details' : 'Thông tin người nhận'}</span>
          </div>
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
              <label className="field field--wide">
                <span>{english ? 'Province / city' : 'Tỉnh / thành nhận hàng'}</span>
                <DropdownMenu value={region} options={regionOptions} ariaLabel={english ? 'Province or city' : 'Tỉnh hoặc thành phố nhận hàng'} onChange={setRegion} />
              </label>
              {region === 'international' && <label className="field"><span>{english ? 'Package weight (kg)' : 'Khối lượng hàng (kg)'}</span><input type="number" min="0.1" max="1000" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /></label>}
            </>}
          </div>
        </div>

        <div className="checkout-section">
          <div className="checkout-section__title">
            <span className="checkout-section__step-num">3</span>
            <span>{english ? 'Payment Method' : 'Phương thức thanh toán'}</span>
          </div>
          <label className="field">
            <span>{english ? 'Payment method' : 'Phương thức thanh toán'}</span>
            <DropdownMenu value={paymentChoice} options={paymentOptions.map((option) => ({ ...option, label: option.value === 'later' && fulfillment === 'pickup' ? (english ? 'Pay at counter' : 'Thanh toán trực tiếp tại quầy') : option.label }))} ariaLabel={english ? 'Payment method' : 'Phương thức thanh toán'} onChange={setPaymentChoice} />
          </label>
        </div>

        <div className="checkout-section">
          <div className="checkout-section__title">
            <span className="checkout-section__step-num">4</span>
            <span>{english ? 'Promotions & Vouchers' : 'Khuyến mãi & Mã giảm giá'}</span>
          </div>
          <section className="checkout-voucher">
            <div className="checkout-voucher__head">
              <div>
                <span className="eyebrow">{english ? 'OFFERS' : 'ƯU ĐÃI'}</span>
                <b>{english ? 'Select vouchers for your order' : 'Chọn mã giảm giá cho đơn hàng'}</b>
              </div>
              <a href="/rewards">{english ? 'Lucky Spin →' : 'Vòng quay may mắn →'}</a>
            </div>
            <VoucherCodeInput onApply={onApplyVoucherCode} english={english} />
            {manualCodes.length > 0 && <small className="voucher-valid">Mã nhập: {manualCodes.join(', ')}</small>}
            <div className="checkout-voucher-groups">
              {voucherGroup('goods', english ? 'Goods vouchers' : 'Mã giảm giá hàng hóa', <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>, goodsVouchers)}
              {voucherGroup('shipping', english ? 'Shipping vouchers' : 'Mã giảm giá phí vận chuyển', <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, shippingVouchers)}
            </div>
          </section>
        </div>

        <div className="checkout-disclaimer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          <span>{english ? 'Inner HCM City, Binh Duong & Ba Ria - Vung Tau: 30,000 ₫. Other provinces: 60,000 ₫ flat rate. International: 200,000 ₫ up to 1 kg, 400,000 ₫ for 2–5 kg.' : 'Nội thành TP. Hồ Chí Minh, Bình Dương và Bà Rịa - Vũng Tàu: 30.000 ₫. Các tỉnh, thành khác: 60.000 ₫ cố định. Vận chuyển quốc tế: 200.000 ₫ cho tối đa 1 kg, từ 2–5 kg là 400.000 ₫.'}</span>
        </div>

        {quoteError && <p className="voucher-invalid" role="alert">{quoteError}</p>}
        <button className="button" type="submit" data-payment-trigger disabled={busy || !quote}>
          {busy ? (english ? 'Processing…' : 'Đang xử lý…') : (paymentChoice === 'bank_transfer' ? (english ? 'Pay with VietQR · ' : 'Thanh toán VietQR · ') : (english ? 'Confirm order · ' : 'Xác nhận đơn · '))
            + money.format(quote?.total ?? cartTotal(cart))}
        </button>
      </form>

      <aside className="surface summary-card">
        <p className="eyebrow">{english ? 'Your order' : 'Đơn của bạn'}</p>
        <div className="summary-card__head">
          <h3>{english ? 'Order Summary' : 'Tóm tắt đơn hàng'}</h3>
          <span className="summary-card__badge">{cart.reduce((s, i) => s + i.quantity, 0)} {english ? 'items' : 'món'}</span>
        </div>

        <div className="checkout-items-list">
          {cart.map((item) => {
            const line = quotedItems.get(String(item.id)) || item
            const artImg = item.image
              ? (item.image.startsWith('/') || item.image.startsWith('http') ? item.image : '/products/' + item.image + '.svg')
              : null
            return (
              <div className="checkout-item-row" key={item.id}>
                <div className="checkout-item-row__art">
                  {artImg ? <img src={artImg} alt={line.name} loading="lazy" /> : <span>{item.symbol || '✦'}</span>}
                </div>
                <div className="checkout-item-row__info">
                  <div className="checkout-item-row__name" title={line.name}>{line.name}</div>
                  <div className="checkout-item-row__meta">{money.format(line.price)} × {item.quantity}</div>
                </div>
                <div className="checkout-item-row__total">{money.format(line.price * item.quantity)}</div>
              </div>
            )
          })}
        </div>

        {cart.map((item) => { const line = quotedItems.get(String(item.id)) || item; return <div className="summary-row" key={item.id} style={{ display: 'none' }}><span>{line.name} × {item.quantity}</span><b>{money.format(line.price * item.quantity)}</b></div> })}
        <div className="summary-row"><span>{english ? 'Subtotal' : 'Tạm tính'}</span><span>{money.format(quote?.subtotal ?? cartTotal(cart))}</span></div>
        <div className="summary-row"><span>{english ? `Voucher + Tier ${plan.name}` : `Voucher + hạng ${plan.name}`}</span><b className="discount-text">-{money.format(quote ? quote.subtotal - quote.goodsTotal : 0)}</b></div>
        <div className="summary-row"><span>{english ? 'Shipping fee' : 'Phí giao hàng'}</span><span>{money.format(quote?.shippingFeeBeforeDiscount ?? quote?.shippingFee ?? 0)}</span></div>
        {quote?.shippingDiscount > 0 && <div className="summary-row"><span>{english ? 'Shipping discount' : 'Đã giảm phí vận chuyển'}</span><b className="discount-text">-{money.format(quote.shippingDiscount)}</b></div>}
        <div className="summary-row summary-row--total">
          <span>{english ? 'Total' : 'Tổng cộng'}</span>
          <span className="total-amount">{money.format(quote?.total ?? 0)}</span>
        </div>

        <p className="checkout-disclaimer" style={{ marginTop: '14px', marginBottom: '0' }}>
          {english ? 'Check total before scanning QR. Bank transfer orders are saved only after payment confirmation.' : 'Kiểm tra tổng tiền trước khi mở QR. Đơn chỉ vào lịch sử mua sau khi cửa hàng xác nhận đã nhận tiền.'}
        </p>

        <div className="checkout-guarantees">
          <div className="checkout-guarantee">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>{english ? 'Secure payment via VietQR' : 'Thanh toán bảo mật qua VietQR'}</span>
          </div>
          <div className="checkout-guarantee">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{english ? 'Instant automatic confirmation' : 'Tự động kiểm tra sao kê sau 10 giây'}</span>
          </div>
          <div className="checkout-guarantee">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{english ? '7-day returns & official support' : 'Miễn phí đổi trả trong 7 ngày'}</span>
          </div>
        </div>
      </aside>
    </div>
    {paymentModal}
  </div>
}
