/**
 * @codex-vn-doc
 * Tệp: src/components/ui/ProductCard.jsx
 * Mục đích: Thẻ sản phẩm dùng chung, hiển thị giá, giảm giá, tồn kho, yêu thích và thêm giỏ.
 * Thành phần chính: ProductCard.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import './ProductCard.css'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const pictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }
// Chức năng ProductCard: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function ProductCard({ product, onAddToCart, isFavorite = false, onToggleFavorite }) {
  const href = '/products/' + product.id
  return <article className={'product-card' + (product.stockCount === 0 ? ' product-card--out' : '') + (product.discountPercent > 0 ? ' product-card--sale' : '')}>
    {onToggleFavorite && <button className={'product-favorite' + (isFavorite ? ' is-active' : '')} type="button" aria-label={isFavorite ? 'Bỏ yêu thích ' + product.name : 'Yêu thích ' + product.name} aria-pressed={isFavorite} onClick={() => onToggleFavorite(product.id)}>{isFavorite ? '♥' : '♡'}</button>}
    <a className="product-art-link" href={href} aria-label={'Xem chi tiết ' + product.name}>
      <div className={`product-art product-art--${product.tone}`}>
        {product.discountPercent > 0 ? <span className="product-label product-label--sale" aria-label={'Giảm ' + product.discountPercent + ' phần trăm'}><i aria-hidden="true">🔥</i><b>-{product.discountPercent}%</b></span> : <span className="product-label">{product.label}</span>}
        {product.image || pictures[product.id] ? <><img className="product-image" src={product.image || '/products/' + pictures[product.id] + '.svg'} alt={'Ảnh ' + product.name} width="440" height="380" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.parentElement?.querySelector('.product-symbol-fallback'); if (fallback) fallback.hidden = false }} /><span className="product-symbol product-symbol-fallback" aria-hidden="true" hidden>{product.symbol}</span></> : <span className="product-symbol" aria-hidden="true">{product.symbol}</span>}
        <span className="product-view">Xem chi tiết ↗</span>
      </div>
    </a>
    <div className="product-info"><p className="product-category">{product.category}</p><h3><a href={href}>{product.name}</a></h3>
      <div className="product-bottom"><div className="product-prices"><strong>{currency.format(product.price)}</strong>{product.discountPercent > 0 && <del>{currency.format(product.originalPrice)}</del>}</div><button type="button" disabled={product.stockCount === 0} onClick={() => onAddToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>{product.stockCount === 0 ? 'Hết hàng' : 'Thêm'}</button></div>
    </div>
  </article>
}
