/**
 * @codex-vn-doc
 * Tệp: src/pages/Cart.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Cart.
 * Liên kết trực tiếp: react, ../storefront/catalog, ../storefront/state.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useState } from 'react'
import { similarProducts } from '../storefront/catalog'
import { canPurchase, cartTotal } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const pictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }

// Chức năng SimilarProducts: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function SimilarProducts({ products, item }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(0)
  const [dragStart, setDragStart] = useState(null)
  const items = similarProducts(products, item, 40)
  const canNavigate = items.length > 1
  // Chức năng shift: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const shift = (amount) => setStart((current) => items.length ? (current + amount + items.length) % items.length : 0)

  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!items.length) return <section className="cart-similar"><div className="cart-similar__head"><h4>{item.stockCount === 0 ? 'Món thay thế bạn có thể thích' : 'Gợi ý theo sản phẩm này'}</h4><button className="cart-similar__toggle" type="button" disabled>Sản phẩm tương tự</button></div><div className="cart-similar__grid cart-similar__legacy-grid"><span className="product-card cart-similar__empty-card" aria-hidden="true" /></div></section>
  return <section className="cart-similar">
    <div className="cart-similar__head"><h4>{item.stockCount === 0 ? 'Món thay thế bạn có thể thích' : 'Gợi ý theo sản phẩm này'}</h4><button className="cart-similar__toggle" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>{open ? 'Ẩn sản phẩm tương tự' : 'Sản phẩm tương tự'}</button></div>
    <div className="cart-similar__grid cart-similar__legacy-grid"><span className="product-card cart-similar__empty-card" aria-hidden="true" /></div>
    {open && <div className="cart-similar__body">
      <div className="cart-similar__toolbar"><button type="button" className="cart-similar__arrow" aria-label="Previous similar product" onClick={() => shift(-1)} disabled={!canNavigate}>&#8249;</button><span>{start + 1} / {items.length}</span><button type="button" className="cart-similar__arrow" aria-label="Next similar product" onClick={() => shift(1)} disabled={!canNavigate}>&#8250;</button></div>
      <input className="cart-similar__range" type="range" min="0" max={Math.max(items.length - 1, 0)} step="1" value={start} onChange={(event) => setStart(Number(event.target.value))} aria-label="Choose similar product" />
      <div className="cart-similar__viewport" onPointerDown={(event) => { setDragStart(event.clientX); event.currentTarget.setPointerCapture?.(event.pointerId) }} onPointerUp={(event) => { if (dragStart !== null && Math.abs(event.clientX - dragStart) > 32) shift(event.clientX < dragStart ? 1 : -1); setDragStart(null) }} onPointerCancel={() => setDragStart(null)}>
        <div className="cart-similar__track" style={{ transform: `translateX(-${start * 100}%)` }}>
          {items.map((product) => <a className="cart-similar__thumb" key={product.id} href={'/products/' + product.id} aria-label={'View ' + product.name}><span className="cart-similar__image-wrap">{product.discountPercent > 0 && <span className="cart-similar__sale" aria-label={'Sale ' + product.discountPercent + '%'}>{String.fromCodePoint(0x1f525)}</span>}<img src={product.image || '/products/' + (pictures[product.id] || 'headphones') + '.svg'} alt="" loading="lazy" /></span></a>)}
        </div>
      </div>
    </div>}
  </section>
}

// Chức năng Cart: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Cart({ cart, products, onQuantity, onToggle }) {
  const selected = cart.filter((item) => item.selected && canPurchase(item))
  const total = cartTotal(selected)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Giỏ hàng</p><h1>Chọn món muốn thanh toán.</h1></div><a href="/products">← Tiếp tục mua sắm</a></header>
    {cart.length === 0 ? <section className="surface empty-panel"><h2>Giỏ hàng đang trống</h2><p className="muted">Thêm vài món bạn thích rồi quay lại đây.</p><div className="page-actions" style={{ justifyContent: 'center' }}><a className="button" href="/products">Xem hàng hóa</a></div></section> :
      <div className="cart-layout"><div className="cart-list">{cart.map((item) => <div key={item.id}>
        <article className={'surface cart-item cart-item--selectable' + (item.stockCount === 0 ? ' cart-item--out' : '')}>
          <label className="cart-select"><input type="checkbox" checked={item.selected && canPurchase(item)} disabled={!canPurchase(item)} onChange={() => onToggle(item.id)} aria-label={'Chọn ' + item.name + ' để thanh toán'} /><span aria-hidden="true">✓</span></label>
          <div className="cart-item__art"><img src={item.image || '/products/' + (pictures[item.id] || 'headphones') + '.svg'} alt="" width="82" height="82" /></div>
          <div className="cart-item__body"><small>{item.category}</small><h3><a href={'/products/' + item.id}>{item.name}</a></h3><strong>{money.format(item.price)}</strong>{item.discountPercent > 0 && <del>{money.format(item.originalPrice)}</del>}{!canPurchase(item) && <p className="cart-out-note">{item.stockCount === 0 ? 'Hết hàng · không thể chọn thanh toán' : 'Chỉ còn ' + item.stockCount + ' sản phẩm demo · hãy giảm số lượng'}</p>}</div>
          <div className="qty-control"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={'Giảm số lượng ' + item.name}>−</button><b>{item.quantity}</b><button type="button" disabled={item.stockCount === 0 || (item.stockCount !== null && item.quantity >= item.stockCount)} onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={'Tăng số lượng ' + item.name}>+</button><button className="remove-item" type="button" onClick={() => onQuantity(item.id, 0)}>Xóa</button></div>
        </article>
        <SimilarProducts products={products} item={item} />
      </div>)}</div>
        <aside className="surface summary-card"><p className="eyebrow">Tóm tắt thanh toán</p><p className="muted">Chỉ những món được tích chọn mới vào đơn.</p><div className="summary-row"><span>Đã chọn</span><b>{selected.length}/{cart.length} sản phẩm</b></div><div className="summary-row summary-row--total"><span>Tạm tính</span><span>{money.format(total)}</span></div>{selected.length > 0 ? <a className="button" href="/checkout">Thanh toán sản phẩm đã chọn</a> : <button className="button" type="button" disabled>Chọn ít nhất một sản phẩm</button>}<p className="checkout-disclaimer">Sản phẩm chưa chọn vẫn nằm trong giỏ. Sau khi tạo đơn demo, chỉ các món đã thanh toán được gỡ khỏi giỏ.</p></aside>
      </div>}
  </div>
}
