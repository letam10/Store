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
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'
import './Cart.css'
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
function SimilarProducts({ products, item, onNavigate, english }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const drag = useRef(null)
  const items = useMemo(() => similarProducts(products, item, 20), [products, item])
  // Chuyển trọn nhóm ba sản phẩm; nhóm cuối chỉ hiển thị số sản phẩm còn lại.
  const maxPage = Math.max(0, Math.ceil(items.length / 3) - 1)
  const position = Math.min(page, maxPage)
  const start = position * 3
  const visibleItems = items.slice(start, start + 3)
  // Giữ các nhóm trong đường trượt; nhóm ngoài màn hình không nhận click hoặc focus.
  const pages = Array.from({ length: Math.ceil(items.length / 3) }, (_, index) => items.slice(index * 3, index * 3 + 3))
  const shift = (amount) => setPage((current) => Math.max(0, Math.min(maxPage, current + amount)))

  return <section className="cart-similar">
    <div className="cart-similar__head">
      <h4>{item.stockCount === 0 ? (english ? 'Alternative products' : 'Sản phẩm thay thế') : (english ? 'Recommended products' : 'Gợi ý sản phẩm')}</h4>
      <button className="cart-similar__toggle" type="button" disabled={!items.length} aria-expanded={open} aria-label={open ? (english ? 'Hide similar products' : 'Ẩn sản phẩm tương tự') : (english ? 'Similar products' : 'Sản phẩm tương tự')} onClick={() => setOpen((current) => !current)}>
        <span className="cart-similar__toggle-long">{open ? (english ? 'Hide similar products' : 'Ẩn sản phẩm tương tự') : (english ? 'Similar products' : 'Sản phẩm tương tự')}</span><span className="cart-similar__toggle-short" aria-hidden="true">{open ? (english ? 'Hide' : 'Ẩn') : (english ? 'View' : 'Xem')}</span>
      </button>
      {open && items.length > 0 && <div className="cart-similar__toolbar">
        <span aria-live="polite">{start + 1}–{start + visibleItems.length} / {items.length}</span>
        <button type="button" className="cart-similar__arrow" aria-label={english ? 'Previous suggestions' : 'Sản phẩm gợi ý trước'} onClick={() => shift(-1)} disabled={position === 0}>‹</button>
        <button type="button" className="cart-similar__arrow" aria-label={english ? 'Next suggestions' : 'Sản phẩm gợi ý tiếp theo'} onClick={() => shift(1)} disabled={position === maxPage}>›</button>
      </div>}
    </div>
    {!items.length && <p className="muted">{english ? 'No similar products in this category to recommend.' : 'Chưa có sản phẩm cùng danh mục để gợi ý.'}</p>}
    {open && items.length > 0 && <div className="cart-similar__body">
      <input className="cart-similar__range" type="range" min="0" max={maxPage} step="1" value={position} onChange={(event) => setPage(Number(event.target.value))} aria-label={english ? 'Select suggestion position' : 'Chọn vị trí sản phẩm gợi ý'} />
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
        <div className="cart-similar__pages" style={{ transform: 'translateX(-' + position * 100 + '%)', '--similar-count': visibleItems.length }}>
          {pages.map((pageItems, index) => <div className="cart-similar__products" key={index} aria-hidden={index !== position} inert={index !== position}>
          {pageItems.map((product) => <a className="cart-similar__product" key={product.id} draggable={false} href={'/products/' + encodeURIComponent(product.id)} onClick={(event) => openProduct(event, product.id, onNavigate)} aria-label={(english ? 'View details ' : 'Xem chi tiết ') + product.name}>
            <span className="cart-similar__product-image">{product.discountPercent > 0 && <span className="cart-similar__product-sale" aria-label={(english ? 'Save ' : 'Giảm ') + product.discountPercent + '%'}>🔥</span>}<img draggable={false} src={product.image || '/products/' + (pictures[product.id] || 'headphones') + '.svg'} alt={'Ảnh ' + product.name} loading="lazy" /></span>
            <span className="cart-similar__product-name" title={product.name}>{product.name}</span>
            <span className="cart-similar__product-price"><small>{english ? 'Unit price' : 'Đơn giá'}</small><strong>{money.format(product.price)}</strong></span>
          </a>)}
          </div>)}
        </div>
      </div>
    </div>}
  </section>
}

// Chức năng Cart: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Cart({ cart, products, account, onQuantity, onToggle, onRequireLogin, onNavigate, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish, translateCategory } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
  const selected = cart.filter((item) => item.selected && canPurchase(item))
  const total = cartTotal(selected)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">{english ? 'Cart' : 'Giỏ hàng'}</p><h1>{english ? 'Choose items to checkout.' : 'Chọn món muốn thanh toán.'}</h1></div><a href="/products">{english ? '← Continue shopping' : '← Tiếp tục mua sắm'}</a></header>
    {!account && <section className="surface cart-guest-cta"><div><p className="eyebrow">{english ? 'Guest cart' : 'Giỏ hàng khách'}</p><h2>{english ? 'Sign in for full shopping experience.' : 'Đăng nhập để mua sắm trọn vẹn.'}</h2><p className="muted">{english ? 'You can still view and modify this cart. Sign in to add items and checkout.' : 'Bạn vẫn có thể xem và chỉnh giỏ hàng này. Đăng nhập để thêm món và thanh toán.'}</p></div><button className="button button--soft" type="button" onClick={() => onRequireLogin?.()}>{english ? 'Sign in to checkout' : 'Đăng nhập để mua hàng'}</button></section>}
    {cart.length === 0 ? <section className="surface empty-panel"><h2>{english ? 'Your cart is empty' : 'Giỏ hàng đang trống'}</h2><p className="muted">{account ? (english ? 'Add some items you love and come back.' : 'Thêm vài món bạn thích rồi quay lại đây.') : (english ? 'Sign in to add items to your cart.' : 'Đăng nhập để thêm sản phẩm vào giỏ hàng.')}</p><div className="page-actions" style={{ justifyContent: 'center' }}>{account ? <a className="button" href="/products">{english ? 'Explore products' : 'Xem hàng hóa'}</a> : <><a className="button" href="/login?next=%2Fcart">{english ? 'Sign in' : 'Đăng nhập'}</a><a className="button button--soft" href="/register?next=%2Fcart">{english ? 'Register' : 'Đăng ký'}</a></>}</div></section> :
      <div className="cart-layout"><div className="cart-list">{cart.map((item) => <div key={item.id}>
        <article className={'surface cart-item cart-item--selectable' + (item.stockCount === 0 ? ' cart-item--out' : '')}>
          <label className="cart-select"><input type="checkbox" checked={item.selected && canPurchase(item)} disabled={!canPurchase(item)} onChange={() => onToggle(item.id)} aria-label={(english ? 'Select ' : 'Chọn ') + item.name + (english ? ' for checkout' : ' để thanh toán')} /><span aria-hidden="true">✓</span></label>
          <a className="cart-item__art cart-item__art-link" href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)} aria-label={(english ? 'View details ' : 'Xem chi tiết ') + item.name}><img src={item.image || '/products/' + (pictures[item.id] || 'headphones') + '.svg'} alt={'Ảnh ' + item.name} width="82" height="82" /></a>
          <div className="cart-item__body"><small>{translateCategory ? translateCategory(item.category) : item.category}</small><h3><a href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)}>{item.name}</a></h3><a className="cart-item__detail-link" href={'/products/' + encodeURIComponent(item.id)} onClick={(event) => openProduct(event, item.id, onNavigate)}>{english ? 'View details ↗' : 'Xem chi tiết ↗'}</a><strong>{money.format(item.price)}</strong>{item.discountPercent > 0 && <del>{money.format(item.originalPrice)}</del>}{!canPurchase(item) && <p className="cart-out-note">{item.stockCount === 0 ? (english ? 'Out of stock · cannot checkout' : 'Hết hàng · không thể chọn thanh toán') : (english ? `Only ${item.stockCount} left in stock · please reduce quantity` : 'Chỉ còn ' + item.stockCount + ' sản phẩm · hãy giảm số lượng')}</p>}</div>
          <div className="qty-control"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={(english ? 'Decrease quantity ' : 'Giảm số lượng ') + item.name}>−</button><b>{item.quantity}</b><button type="button" disabled={item.stockCount === 0 || (item.stockCount !== null && item.quantity >= item.stockCount)} onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={(english ? 'Increase quantity ' : 'Tăng số lượng ') + item.name}>+</button><button className="remove-item" type="button" onClick={() => onQuantity(item.id, 0)}>{english ? 'Remove' : 'Xóa'}</button></div>
        </article>
        <SimilarProducts products={products} item={item} onNavigate={onNavigate} english={english} />
      </div>)}</div>
        <aside className="surface summary-card"><p className="eyebrow">{english ? 'Order summary' : 'Tóm tắt thanh toán'}</p><p className="muted">{english ? 'Only checked items will be included.' : 'Chỉ những món được tích chọn mới vào đơn.'}</p><div className="summary-row"><span>{english ? 'Selected' : 'Đã chọn'}</span><b>{selected.length}/{cart.length} {english ? 'items' : 'sản phẩm'}</b></div><div className="summary-row summary-row--total"><span>{english ? 'Subtotal' : 'Tạm tính'}</span><span>{money.format(total)}</span></div>{selected.length > 0 && account ? <a className="button" href="/checkout">{english ? 'Checkout selected items' : 'Thanh toán sản phẩm đã chọn'}</a> : selected.length > 0 ? <button className="button" type="button" onClick={() => onRequireLogin?.()}>{english ? 'Sign in to checkout' : 'Đăng nhập để thanh toán'}</button> : <button className="button" type="button" disabled>{english ? 'Select at least one product' : 'Chọn ít nhất một sản phẩm'}</button>}<p className="checkout-disclaimer">{english ? 'Unchecked items stay in your cart. After ordering, purchased items will be removed.' : 'Sản phẩm chưa chọn vẫn nằm trong giỏ. Sau khi tạo đơn, các món đã đặt được gỡ khỏi giỏ.'}</p></aside>
      </div>}
  </div>
}
