/**
 * @codex-vn-doc
 * Tệp: src/pages/Checkout.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Checkout.
 * Liên kết trực tiếp: react, ../api/customer, ../storefront/promotions, ../storefront/state, ../data/shipping.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useMemo, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { cartTotal } from '../storefront/state'
import { DOMESTIC_REGIONS } from '../data/shipping'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Chức năng Checkout: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Checkout({ cart, account, membershipTier = 'bronze', wallet = [], selectedVoucherCodes = [], onToggleVoucher, onComplete }) {
  const [completedOrder, setCompletedOrder] = useState(null)
  const [fulfillment, setFulfillment] = useState('delivery')
  const [region, setRegion] = useState('hcm')
  const [weightKg, setWeightKg] = useState(1)
  const [openVoucher, setOpenVoucher] = useState('goods')
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [busy, setBusy] = useState(false)
  const [paidSuccess, setPaidSuccess] = useState(false)
  const [paying, setPaying] = useState(false)
  const items = useMemo(() => cart.map((item) => ({ id: item.id, quantity: item.quantity })), [cart])
  const itemKey = JSON.stringify(items)
  const plan = getMembershipPlan(membershipTier)
  const request = { items, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }

  useEffect(() => {
    const selectedItems = JSON.parse(itemKey)
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!selectedItems.length) return undefined
    const controller = new AbortController()
    customerApi('/api/customer/quote', { method: 'POST', csrfToken: account.csrfToken,
      body: JSON.stringify({ items: selectedItems, fulfillment, region, distanceKm: 0, weightKg: Number(weightKg), voucherCodes: selectedVoucherCodes }), signal: controller.signal })
      .then((result) => { setQuote(result); setQuoteError('') })
      .catch((error) => { if (!controller.signal.aborted) { setQuote(null); setQuoteError(error.message) } })
    return () => controller.abort()
  }, [account.csrfToken, itemKey, fulfillment, region, weightKg, selectedVoucherCodes])

  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
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

  // Chức năng simulatePay: mô phỏng thanh toán trực tuyến qua VietQR / Webhook
  async function simulatePay() {
    if (!completedOrder || paying) return
    setPaying(true)
    setQuoteError('')
    try {
      await customerApi('/api/customer/orders/' + encodeURIComponent(completedOrder.id) + '/simulate-pay', {
        method: 'POST',
        csrfToken: account.csrfToken,
      })
      setPaidSuccess(true)
    } catch (error) {
      setQuoteError(error.message)
    } finally {
      setPaying(false)
    }
  }

  if (completedOrder) {
    const qrUrl = `https://img.vietqr.io/image/MB-0388888999-compact2.png?amount=${completedOrder.total}&addInfo=ST%20${completedOrder.id}&accountName=STORE%20VIETNAM`
    return <div className="container page-shell">
      <section className="surface order-success">
        <span>{paidSuccess ? '✓' : '💳'}</span>
        <h1>{paidSuccess ? 'Thanh toán thành công!' : 'Đơn hàng đã được tạo'}</h1>
        <p className="order-code">{completedOrder.id}</p>
        <p>Tổng tiền: <strong>{money.format(completedOrder.total)}</strong></p>
        
        {paidSuccess ? (
          <div className="payment-success-card" style={{ margin: '1rem 0', padding: '1rem', background: '#eef8ee', borderRadius: '8px', border: '1px solid #7cb382' }}>
            <p style={{ color: '#254535', fontWeight: 'bold' }}>✓ Đã ghi nhận thanh toán tự động qua VietQR Webhook!</p>
            <p className="muted" style={{ margin: '0.25rem 0' }}>Điểm tích lũy và lượt quay may mắn đã được cộng vào tài khoản của bạn.</p>
          </div>
        ) : (
          <div className="payment-vietqr-box" style={{ margin: '1.25rem 0', padding: '1rem', background: '#fdfbf7', borderRadius: '8px', border: '1px solid #e0d8cc' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Quét mã VietQR để thanh toán tự động:</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <img src={qrUrl} alt="Mã QR thanh toán VietQR" style={{ maxWidth: '280px', width: '100%', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              <div style={{ fontSize: '0.875rem', lineHeight: '1.4', textAlign: 'left', width: '100%', maxWidth: '300px' }}>
                <p>🏦 <b>Ngân hàng:</b> MB Bank</p>
                <p>🔢 <b>STK:</b> 0388888999</p>
                <p>👤 <b>Tên:</b> STORE VIETNAM</p>
                <p>📝 <b>Nội dung:</b> <code>ST {completedOrder.id}</code></p>
              </div>
              <button className="button" type="button" onClick={simulatePay} disabled={paying} style={{ marginTop: '0.5rem', width: '100%', maxWidth: '300px' }}>
                {paying ? 'Đang xác nhận…' : '⚡ Thanh toán ngay (Mô phỏng VietQR)'}
              </button>
            </div>
          </div>
        )}

        <div className="page-actions" style={{ marginTop: '1rem' }}>
          <a className="button" href="/account">Xem danh sách đơn hàng</a>
          <a className="button button--soft" href="/rewards">Đến vòng quay may mắn</a>
        </div>
      </section>
    </div>
  }
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
    <header className="page-head"><div><p className="eyebrow">Mua hàng</p><h1>Thông tin giao nhận</h1></div><span className="membership-badge">{plan.badge}</span></header>
    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <fieldset className="fulfillment-picker"><legend>Cách nhận hàng</legend>
          <label className={fulfillment === 'delivery' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><span><b>Giao tận nơi</b><small>Phí giao theo khu vực.</small></span></label>
          <label className={fulfillment === 'pickup' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><span><b>Nhận tại cửa hàng</b><small>Không tính phí giao.</small></span></label>
        </fieldset>
        <section className="checkout-voucher"><div className="checkout-voucher__head"><div><span className="eyebrow">ƯU ĐÃI</span><b>Chọn voucher cho đơn hàng</b></div><a href="/rewards">Vòng quay →</a></div>
          <div className="checkout-voucher-groups">{voucherGroup('goods', 'Voucher hàng hóa', '⌂', goodsVouchers)}{voucherGroup('shipping', 'Voucher phí vận chuyển', '✈', shippingVouchers)}</div>
        </section>
        <div className="form-grid">
          <label className="field"><span>Tên người nhận</span><input name="recipient" required defaultValue={account.username} /></label>
          <label className="field"><span>Số điện thoại</span><input name="phone" required inputMode="tel" autoComplete="tel" /></label>
          {fulfillment === 'delivery' && <>
            <label className="field field--wide"><span>Địa chỉ nhận hàng</span><input name="address" required autoComplete="street-address" /></label>
            <label className="field field--wide"><span>Tỉnh / thành nhận hàng</span><select value={region} onChange={(event) => setRegion(event.target.value)}><optgroup label="Nội thành Store"><option value="hcm">TP. Hồ Chí Minh · nội thành</option><option value="binh-duong">Bình Dương · nội thành</option><option value="ba-ria-vung-tau">Bà Rịa - Vũng Tàu · nội thành</option></optgroup><optgroup label="Các tỉnh, thành Việt Nam">{DOMESTIC_REGIONS.slice(3).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</optgroup><option value="international">Ship ngoại quốc · quốc tế</option></select></label>
            {region === 'international' && <label className="field"><span>Khối lượng hàng (kg)</span><input type="number" min="0.1" max="1000" step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /></label>}
          </>}
          <label className="field"><span>Phương thức</span><select><option>Thanh toán khi nhận hàng</option></select></label>
        </div>
        <p className="checkout-disclaimer">Nội thành TP. Hồ Chí Minh, Bình Dương và Bà Rịa - Vũng Tàu: 30.000 ₫. Các tỉnh, thành khác: 60.000 ₫ cố định. Ship quốc tế: 200.000 ₫ cho tối đa 1 kg, từ 2–5 kg là 400.000 ₫.</p>
        {quoteError && <p className="voucher-invalid" role="alert">{quoteError}</p>}
        <button className="button" type="submit" disabled={busy || !quote}>{busy ? 'Đang tạo đơn…' : 'Xác nhận đơn · ' + money.format(quote?.total ?? cartTotal(cart))}</button>
      </form>
      <aside className="surface summary-card"><p className="eyebrow">Đơn của bạn</p>
        {cart.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}
        <div className="summary-row"><span>Tạm tính</span><span>{money.format(quote?.subtotal ?? cartTotal(cart))}</span></div>
        <div className="summary-row"><span>Voucher + hạng {plan.name}</span><b>-{money.format(quote?.discount ?? 0)}</b></div>
        <div className="summary-row"><span>Phí giao hàng</span><span>{money.format(quote?.shippingFee ?? 0)}</span></div>
        {quote?.shippingDiscount > 0 && <div className="summary-row"><span>Đã giảm phí ship</span><b>-{money.format(quote.shippingDiscount)}</b></div>}
        <div className="summary-row summary-row--total"><span>Tổng</span><span>{money.format(quote?.total ?? 0)}</span></div>
        <p className="checkout-disclaimer">Giá và hàng hóa là dữ liệu mẫu; không có cổng thanh toán trực tuyến trong phiên bản này.</p>
      </aside>
    </div>
  </div>
}
