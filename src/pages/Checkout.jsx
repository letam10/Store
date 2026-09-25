import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { cartTotal } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const destinations = [
  ['hcm', 'TP. Hồ Chí Minh'], ['binh-duong', 'Bình Dương cũ · TP. Hồ Chí Minh'],
  ['ba-ria-vung-tau', 'Bà Rịa - Vũng Tàu cũ · TP. Hồ Chí Minh'],
  ['nearby', 'Ngoại thành lân cận'], ['far', 'Tỉnh xa hơn'],
]

export default function Checkout({ cart, account, membershipTier = 'bronze', wallet = [], selectedVoucherCodes = [], onToggleVoucher, onComplete }) {
  const [completedOrder, setCompletedOrder] = useState(null)
  const [fulfillment, setFulfillment] = useState('delivery')
  const [region, setRegion] = useState('hcm')
  const [distanceKm, setDistanceKm] = useState(0)
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [busy, setBusy] = useState(false)
  const items = useMemo(() => cart.map((item) => ({ id: item.id, quantity: item.quantity })), [cart])
  const itemKey = JSON.stringify(items)
  const plan = getMembershipPlan(membershipTier)
  const request = { items, fulfillment, region, distanceKm: Number(distanceKm), voucherCodes: selectedVoucherCodes }

  useEffect(() => {
    const selectedItems = JSON.parse(itemKey)
    if (!selectedItems.length) return undefined
    const controller = new AbortController()
    customerApi('/api/customer/quote', { method: 'POST', csrfToken: account.csrfToken,
      body: JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: Number(distanceKm), voucherCodes: selectedVoucherCodes }), signal: controller.signal })
      .then((result) => { setQuote(result); setQuoteError('') })
      .catch((error) => { if (!controller.signal.aborted) { setQuote(null); setQuoteError(error.message) } })
    return () => controller.abort()
  }, [account.csrfToken, itemKey, fulfillment, region, distanceKm, selectedVoucherCodes])

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setQuoteError('')
    const fields = new FormData(event.currentTarget)
    try {
      const payload = await customerApi('/api/customer/orders', { method: 'POST', csrfToken: account.csrfToken,
        body: JSON.stringify({ ...request, recipient: fields.get('recipient'), phone: fields.get('phone'), address: fields.get('address') || '' }) })
      setCompletedOrder(payload.order)
      onComplete(payload.order, cart)
    } catch (error) { setQuoteError(error.message) }
    finally { setBusy(false) }
  }

  if (completedOrder) return <div className="container page-shell"><section className="surface order-success"><span>✓</span><h1>Đơn đã được tạo</h1><p className="order-code">{completedOrder.id}</p><p>Tổng cần thanh toán: {money.format(completedOrder.total)}</p><p className="muted">Điểm và lượt quay được cộng sau khi quản trị viên ghi nhận thanh toán.</p><a className="button" href="/account">Xem đơn hàng</a></section></div>
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>Chưa chọn sản phẩm để thanh toán</h2><a className="button" href="/cart">Về giỏ hàng</a></section></div>

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Mua hàng</p><h1>Thông tin giao nhận</h1></div><span className="membership-badge">{plan.badge}</span></header>
    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <fieldset className="fulfillment-picker"><legend>Cách nhận hàng</legend>
          <label className={fulfillment === 'delivery' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><span><b>Giao tận nơi</b><small>Phí giao theo khu vực.</small></span></label>
          <label className={fulfillment === 'pickup' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><span><b>Nhận tại cửa hàng</b><small>Không tính phí giao.</small></span></label>
        </fieldset>
        <section className="checkout-voucher"><div className="checkout-voucher__head"><b>Voucher của bạn · có thể dùng nhiều mã</b><a href="/rewards">Vòng quay →</a></div>
          {wallet.length ? <div className="checkout-voucher-list">{wallet.map((voucher) => <label key={voucher.code}><input type="checkbox" checked={selectedVoucherCodes.includes(voucher.code)} onChange={() => onToggleVoucher(voucher.code)} /><span><b>{voucher.label}</b><code>{voucher.code}</code><small>Hạn {new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}</small></span></label>)}</div> : <p className="muted">Bạn chưa có voucher.</p>}
        </section>
        <div className="form-grid">
          <label className="field"><span>Tên người nhận</span><input name="recipient" required defaultValue={account.username} /></label>
          <label className="field"><span>Số điện thoại</span><input name="phone" required inputMode="tel" autoComplete="tel" /></label>
          {fulfillment === 'delivery' && <>
            <label className="field field--wide"><span>Địa chỉ nhận hàng</span><input name="address" required autoComplete="street-address" /></label>
            <label className="field"><span>Khu vực</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{destinations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {region === 'far' && <label className="field"><span>Khoảng cách ngoài tỉnh (km)</span><input type="number" min="0" max="3000" step="1" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} required /></label>}
          </>}
          <label className="field"><span>Phương thức</span><select><option>Thanh toán khi nhận hàng</option></select></label>
        </div>
        <p className="checkout-disclaimer">TP. Hồ Chí Minh gồm Bình Dương và Bà Rịa - Vũng Tàu cũ: 30.000 ₫. Ngoại thành lân cận: 60.000 ₫. Tỉnh xa: 60.000 ₫ + 1.000 ₫ cho mỗi km.</p>
        {quoteError && <p className="voucher-invalid" role="alert">{quoteError}</p>}
        <button className="button" type="submit" disabled={busy || !quote}>{busy ? 'Đang tạo đơn…' : 'Xác nhận đơn · ' + money.format(quote?.total ?? cartTotal(cart))}</button>
      </form>
      <aside className="surface summary-card"><p className="eyebrow">Đơn của bạn</p>
        {cart.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}
        <div className="summary-row"><span>Tạm tính</span><span>{money.format(quote?.subtotal ?? cartTotal(cart))}</span></div>
        <div className="summary-row"><span>Voucher + hạng {plan.name}</span><b>-{money.format(quote?.discount ?? 0)}</b></div>
        <div className="summary-row"><span>Phí giao hàng</span><span>{money.format(quote?.shippingFee ?? 0)}</span></div>
        <div className="summary-row summary-row--total"><span>Tổng</span><span>{money.format(quote?.total ?? 0)}</span></div>
        <p className="checkout-disclaimer">Giá và hàng hóa là dữ liệu mẫu; không có cổng thanh toán trực tuyến trong phiên bản này.</p>
      </aside>
    </div>
  </div>
}
