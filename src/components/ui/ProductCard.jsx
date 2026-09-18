import './ProductCard.css'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
export default function ProductCard({ product, onAddToCart }) {
  const href = '/products/' + product.id
  return (
    <article className="product-card">
      <a className="product-art-link" href={href} aria-label={'Xem chi tiết ' + product.name}>
        <div className={`product-art product-art--${product.tone}`}>
          <span className="product-label">{product.label}</span>
          <span className="product-symbol" aria-hidden="true">{product.symbol}</span>
        </div>
      </a>
      <div className="product-info">
        <p className="product-category">{product.category}</p><h3><a href={href}>{product.name}</a></h3>
        <div className="product-bottom">
          <strong>{currency.format(product.price)}</strong>
          <button type="button" onClick={() => onAddToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>+</button>
        </div>
      </div>
    </article>
  )
}
