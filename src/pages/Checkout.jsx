import { useMemo, useState } from 'react'
import { availableVouchers, evaluateVoucher, getMembershipPlan } from '../storefront/promotions'
import { cartTotal, createDemoOrder } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function Checkout({ cart, account, membershipTier='standard', selectedVoucher='', onVoucherChange, onComplete }) {
  const [completedOrder, setCompletedOrder] = useState(null)
  const [fulfillment, setFulfillment] = useState('delivery')
  const [voucherInput,setVoucherInput]=useState(selectedVoucher)
  const subtotal = cartTotal(cart)
  const evaluation=useMemo(()=>voucherInput.trim()?evaluateVoucher(voucherInput,subtotal,membershipTier):{valid:false,discount:0,reason:''},[voucherInput,subtotal,membershipTier])
  const discount=evaluation.valid?evaluation.discount:0
  const total=subtotal-discount
  const plan=getMembershipPlan(membershipTier)
  const quickVouchers=availableVouchers(subtotal,membershipTier)

  function applyVoucher(code){
    const normalized=String(code).trim().toUpperCase()
    setVoucherInput(normalized)
    onVoucherChange?.(normalized)
  }

  function submit(event) {
    event.preventDefault()
    const order = createDemoOrder(cart, {
      owner: account?.username || 'guest',
      fulfillment,
      voucherCode:evaluation.valid?voucherInput:'',
      discount,
      membershipTier,
    })
    setCompletedOrder(order)
    onComplete(order, cart)
  }

  if (completedOrder) return <div className="container page-shell"><section className="surface order-success"><span>✓</span><h1>Đơn demo đã được tạo</h1><p className="order-code">{completedOrder.id}</p>{completedOrder.discount>0&&<p className="order-saving">Voucher {completedOrder.voucherCode}: -{money.format(completedOrder.discount)}</p>}<p className="muted">Prototype chưa gửi đơn tới hệ thống nghiệp vụ hoặc cổng thanh toán thật.</p><div className="page-actions" style={{ justifyContent: 'center' }}><a className="button" href={account ? '/account' : '/'}>{account ? 'Xem tài khoản' : 'Về trang chủ'}</a></div></section></div>
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>Chưa chọn sản phẩm để thanh toán</h2><p className="muted">Quay lại giỏ và tích chọn những món muốn mua.</p><a className="button" href="/cart">Về giỏ hàng</a></section></div>

  return <div className="container page-shell">
    <div className="checkout-progress" aria-label="Tiến trình mua hàng"><span className="is-done">1 · Giỏ hàng</span><span className="is-active">2 · Giao nhận</span><span>3 · Xác nhận</span></div>
    <header className="page-head"><div><p className="eyebrow">Mua hàng</p><h1>Thông tin giao nhận.</h1></div><p className="muted">Bạn có thể mua dưới dạng khách; không bắt buộc tạo tài khoản.</p></header>
    <div className="checkout-layout">
      <form className="surface checkout-card" onSubmit={submit}>
        <fieldset className="fulfillment-picker">
          <legend>Cách nhận hàng</legend>
          <label className={fulfillment === 'delivery' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><span><b>Giao tận nơi</b><small>Phí và khả năng phục vụ được xác nhận theo địa chỉ.</small></span></label>
          <label className={fulfillment === 'pickup' ? 'is-active' : ''}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><span><b>Nhận tại cửa hàng</b><small>Prototype chưa kiểm tra tồn kho theo chi nhánh.</small></span></label>
        </fieldset>
        <section className="checkout-voucher"><div className="checkout-voucher__head"><div><span className="membership-badge">{plan.badge}</span><b>Voucher demo</b></div><a href="/rewards">Vòng quay may mắn →</a></div><div className="checkout-voucher__input"><input value={voucherInput} onChange={(event)=>setVoucherInput(event.target.value.toUpperCase())} placeholder="Nhập mã voucher" maxLength="20" /><button type="button" onClick={()=>applyVoucher(voucherInput)}>Áp dụng</button></div>{voucherInput&&<p className={evaluation.valid?'voucher-valid':'voucher-invalid'} role="status">{evaluation.valid?'✓ Giảm '+money.format(discount):evaluation.reason}</p>}{quickVouchers.length>0&&<div className="checkout-voucher__quick">{quickVouchers.map((voucher)=><button key={voucher.code} type="button" onClick={()=>applyVoucher(voucher.code)}>{voucher.code}</button>)}</div>}<small>Voucher và mức giảm chỉ là dữ liệu demo, chưa phải chương trình khuyến mại Store đã duyệt.</small></section>
        <div className="form-grid">
          <label className="field"><span>Tên người nhận</span><input required defaultValue={account?.username || ''} /></label>
          <label className="field"><span>Số điện thoại</span><input required inputMode="tel" autoComplete="tel" /></label>
          {fulfillment === 'delivery' ? <>
            <label className="field field--wide"><span>Địa chỉ nhận hàng</span><input required autoComplete="street-address" /></label>
            <label className="field"><span>Thành phố</span><input required defaultValue="TP.HCM" /></label>
          </> : <label className="field field--wide"><span>Cửa hàng nhận</span><select required><option value="">Chọn cửa hàng</option><option>Store Central · Quận 1, TP.HCM</option><option>Store East · TP. Thủ Đức</option><option>Store Coast · Vũng Tàu</option></select></label>}
          <label className="field"><span>Phương thức</span><select><option>Thanh toán khi nhận hàng</option><option disabled>Thanh toán trực tuyến (chưa kết nối)</option></select></label>
          <label className="field field--wide"><span>Ghi chú</span><textarea rows="4" placeholder="Tùy chọn" /></label>
        </div>
        <div className="checkout-assurance"><span>🔒 Không thu thập thông tin thẻ trong prototype</span><span>↩ Có thể quay lại giỏ trước khi xác nhận</span></div>
        <button className="button" type="submit">Xác nhận đơn demo · {money.format(total)}</button>
      </form>
      <aside className="surface summary-card">
        <p className="eyebrow">Đơn của bạn</p>
        {cart.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}
        <div className="summary-row"><span>Cách nhận</span><b>{fulfillment === 'delivery' ? 'Giao tận nơi' : 'Nhận tại cửa hàng'}</b></div>
        <div className="summary-row"><span>Tạm tính</span><span>{money.format(subtotal)}</span></div>
        <div className="summary-row"><span>Voucher</span><b>{discount>0?'-'+money.format(discount):'—'}</b></div>
        <div className="summary-row"><span>Phí vận chuyển</span><span>{fulfillment === 'delivery' ? 'Xác nhận theo địa chỉ' : 'Không áp dụng trong demo'}</span></div>
        <div className="summary-row summary-row--total"><span>Tổng demo</span><span>{money.format(total)}</span></div>
        <p className="checkout-disclaimer">Không có khoản thanh toán nào được thực hiện ở bản prototype này.</p>
      </aside>
    </div>
  </div>
}
