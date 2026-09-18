import './ProductCard.css'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
export default function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div className={`product-art product-art--${product.tone}`}>
        <span className="product-label">{product.label}</span>
        <span className="product-symbol" aria-hidden="true">{product.symbol}</span>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p><h3>{product.name}</h3>
        <div className="product-bottom">
          <strong>{currency.format(product.price)}</strong>
          <button type="button" onClick={() => onAddToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>+</button>
        </div>
      </div>
    </article>
  )
}
