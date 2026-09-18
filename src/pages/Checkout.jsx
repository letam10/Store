import { useState } from 'react'
import { cartTotal, createDemoOrder } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function Checkout({ cart, account, onComplete }) {
  const [completedOrder, setCompletedOrder] = useState(null)
  const [fulfillment, setFulfillment] = useState('delivery')
  const total = cartTotal(cart)

  function submit(event) {
    event.preventDefault()
    const order = createDemoOrder(cart, { owner: account?.username || 'guest', fulfillment })
    setCompletedOrder(order)
    onComplete(order)
  }

  if (completedOrder) return <div className="container page-shell"><section className="surface order-success"><span>✓</span><h1>Đơn demo đã được tạo</h1><p className="order-code">{completedOrder.id}</p><p className="muted">Prototype chưa gửi đơn tới hệ thống nghiệp vụ hoặc cổng thanh toán thật.</p><div className="page-actions" style={{ justifyContent: 'center' }}><a className="button" href={account ? '/account' : '/'}>{account ? 'Xem tài khoản' : 'Về trang chủ'}</a></div></section></div>
  if (!cart.length) return <div className="container page-shell"><section className="surface empty-panel"><h2>Không có hàng để thanh toán</h2><a className="button" href="/products">Chọn sản phẩm</a></section></div>

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
        <div className="summary-row"><span>Phí vận chuyển</span><span>{fulfillment === 'delivery' ? 'Xác nhận theo địa chỉ' : 'Không áp dụng trong demo'}</span></div>
        <div className="summary-row summary-row--total"><span>Tạm tính hiện tại</span><span>{money.format(total)}</span></div>
        <p className="checkout-disclaimer">Không có khoản thanh toán nào được thực hiện ở bản prototype này.</p>
      </aside>
    </div>
  </div>
}
