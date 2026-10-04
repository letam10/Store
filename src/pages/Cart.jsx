/**
 * @codex-vn-doc
 * Tệp: src/pages/Cart.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Cart.
 * Liên kết trực tiếp: react, ../storefront/catalog, ../storefront/state.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useMemo, useRef, useState } from 'react'
import { similarProducts } from '../storefront/catalog'
import { canPurchase, cartTotal } from '../storefront/state'
import './Storefront.css'
import './CartSuggestions.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const pictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }

// Chức năng mở chi tiết: điều hướng trực tiếp để không phụ thuộc vào bắt sự kiện click ở lớp cha.
function openProduct(event, id, onNavigate) {
  if (!onNavigate || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
  event.preventDefault()
  onNavigate('/products/' + encodeURIComponent(id))
}

// Chức năng SimilarProducts: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function SimilarProducts({ products, item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const drag = useRef(null)
  const items = useMemo(() => similarProducts(products, item, 20), [products, item])
  // Chuyển trọn nhóm ba sản phẩm; nhóm cuối chỉ hiển thị số sản phẩm còn lại.
  const maxPage = Math.max(0, Math.ceil(items.length / 3) - 1)
  const position = Math.min(page, maxPage)
  const start = position * 3
  const visibleItems = items.slice(start, start + 3)
  const shift = (amount) => setPage((current) => Math.max(0, Math.min(maxPage, current + amount)))

  return <section className="cart-similar">
    <div className="cart-similar__head">
      <h4>{item.stockCount === 0 ? 'Sản phẩm thay thế' : 'Gợi ý sản phẩm'}</h4>
      <button className="cart-similar__toggle" type="button" disabled={!items.length} aria-expanded={open} aria-label={open ? 'Ẩn sản phẩm tương tự' : 'Sản phẩm tương tự'} onClick={() => setOpen((current) => !current)}>
        <span className="cart-similar__toggle-long">{open ? 'Ẩn sản phẩm tương tự' : 'Sản phẩm tương tự'}</span><span className="cart-similar__toggle-short" aria-hidden="true">{open ? 'Ẩn' : 'Xem'}</span>
      </button>
      {open && items.length > 0 && <div className="cart-similar__toolbar">
        <span aria-live="polite">{start + 1}–{start + visibleItems.length} / {items.length}</span>
        <button type="button" className="cart-similar__arrow" aria-label="Sản phẩm gợi ý trước" onClick={() => shift(-1)} disabled={position === 0}>‹</button>
        <button type="button" className="cart-similar__arrow" aria-label="Sản phẩm gợi ý tiếp theo" onClick={() => shift(1)} disabled={position === maxPage}>›</button>
      </div>}
    </div>
    {!items.length && <p className="muted">Chưa có sản phẩm cùng danh mục để gợi ý.</p>}
    {open && items.length > 0 && <div className="cart-similar__body">
      <input className="cart-similar__range" type="range" min="0" max={maxPage} step="1" value={position} onChange={(event) => setPage(Number(event.target.value))} aria-label="Chọn vị trí sản phẩm gợi ý" />
      <div className="cart-similar__viewport"
        onPointerDown={(event) => { if (event.button === 0) drag.current = { x: event.clientX, y: event.clientY, moved: false } }}
        onPointerMove={(event) => {
          if (!drag.current) return
          const dx = Math.abs(event.clientX - drag.current.x)
          if (dx > 8 && dx > Math.abs(event.clientY - drag.current.y)) {
            drag.current.moved = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }
        }}
        onPointerUp={(event) => {
          if (!drag.current?.moved) { drag.current = null; return }
          const distance = event.clientX - drag.current.x
          shift(distance < 0 ? 1 : -1)
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { drag.current = null }}
        onClickCapture={(event) => {
          // Chỉ chặn click phát sinh sau kéo; click ảnh bình thường vẫn mở chi tiết.
          if (drag.current?.moved) { event.preventDefault(); event.stopPropagation() }
          drag.current = null
        }}>
        <div className="cart-similar__products">
          {visibleItems.map((product) => <a className="cart-similar__product" key={product.id} draggable={false} href={'/products/' + encodeURIComponent(product.id)} onClick={(event) => openProduct(event, product.id, onNavigate)} aria-label={'Xem chi tiết ' + product.name}>
            <span className="cart-similar__product-image">{product.discountPercent > 0 && <span className="cart-similar__product-sale" aria-label={'Giảm ' + product.discountPercent + '%'}>🔥</span>}<img draggable={false} src={product.image || '/products/' + (pictures[product.id] || 'headphones') + '.svg'} alt={'Ảnh ' + product.name} loading="lazy" /></span>
            <span className="cart-similar__product-name" title={product.name}>{product.name}</span>
            <span className="cart-similar__product-price"><small>Đơn giá</small><strong>{money.format(product.price)}</strong></span>
          </a>)}
        </div>
      </div>
    </div>}
  </section>
}

// Chức năng Cart: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Cart({ cart, products, onQuantity, onToggle, onNavigate }) {
  const selected = cart.filter((item) => item.selected && canPurchase(item))
  const total = cartTotal(selected)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Giỏ hàng</p><h1>Chọn món muốn thanh toán.</h1></div><a href="/products">← Tiếp tục mua sắm</a></header>
    {cart.length === 0 ? <section className="surface empty-panel"><h2>Giỏ hàng đang trống</h2><p className="muted">Thêm vài món bạn thích rồi quay lại đây.</p><div className="page-actions" style={{ justifyContent: 'center' }}><a className="button" href="/products">Xem hàng hóa</a></div></section> :
      <div className="cart-layout"><div className="cart-list">{cart.map((item) => <div key={item.id}>
        <article className={'surface cart-item cart-item--selectable' + (item.stockCount === 0 ? ' cart-item--out' : '')}>
          <label className="cart-select"><input type="checkbox" checked={item.selected && canPurchase(item)} disabled={!canPurchase(item)} onChange={() => onToggle(item.id)} aria-label={'Chọn ' + item.name + ' để thanh toán'} /><span aria-hidden="true">✓</span></label>
          <a className="cart-item__art cart-item__art-link" href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)} aria-label={'Xem chi tiết ' + item.name}><img src={item.image || '/products/' + (pictures[item.id] || 'headphones') + '.svg'} alt={'Ảnh ' + item.name} width="82" height="82" /></a>
          <div className="cart-item__body"><small>{item.category}</small><h3><a href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)}>{item.name}</a></h3><a className="cart-item__detail-link" href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)}>Xem chi tiết ↗</a><strong>{money.format(item.price)}</strong>{item.discountPercent > 0 && <del>{money.format(item.originalPrice)}</del>}{!canPurchase(item) && <p className="cart-out-note">{item.stockCount === 0 ? 'Hết hàng · không thể chọn thanh toán' : 'Chỉ còn ' + item.stockCount + ' sản phẩm · hãy giảm số lượng'}</p>}</div>
          <div className="qty-control"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={'Giảm số lượng ' + item.name}>−</button><b>{item.quantity}</b><button type="button" disabled={item.stockCount === 0 || (item.stockCount !== null && item.quantity >= item.stockCount)} onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={'Tăng số lượng ' + item.name}>+</button><button className="remove-item" type="button" onClick={() => onQuantity(item.id, 0)}>Xóa</button></div>
        </article>
        <SimilarProducts products={products} item={item} onNavigate={onNavigate} />
      </div>)}</div>
        <aside className="surface summary-card"><p className="eyebrow">Tóm tắt thanh toán</p><p className="muted">Chỉ những món được tích chọn mới vào đơn.</p><div className="summary-row"><span>Đã chọn</span><b>{selected.length}/{cart.length} sản phẩm</b></div><div className="summary-row summary-row--total"><span>Tạm tính</span><span>{money.format(total)}</span></div>{selected.length > 0 ? <a className="button" href="/checkout">Thanh toán sản phẩm đã chọn</a> : <button className="button" type="button" disabled>Chọn ít nhất một sản phẩm</button>}<p className="checkout-disclaimer">Sản phẩm chưa chọn vẫn nằm trong giỏ. Sau khi tạo đơn, các món đã đặt được gỡ khỏi giỏ.</p></aside>
      </div>}
  </div>
}
