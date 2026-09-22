import './ProductCard.css'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const pictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }
export default function ProductCard({ product, onAddToCart }) {
  const href = '/products/' + product.id
  return <article className="product-card">
    <a className="product-art-link" href={href} aria-label={'Xem chi tiết ' + product.name}>
      <div className={`product-art product-art--${product.tone}`}>
        <span className="product-label">{product.label}</span>
        {pictures[product.id] ? <img src={'/products/' + pictures[product.id] + '.svg'} alt={'Minh họa ' + product.name} width="440" height="380" loading="lazy" /> : <span className="product-symbol" aria-hidden="true">{product.symbol}</span>}
        <span className="product-view">Xem chi tiết ↗</span>
      </div>
    </a>
    <div className="product-info"><p className="product-category">{product.category}</p><h3><a href={href}>{product.name}</a></h3>
      <div className="product-bottom"><strong>{currency.format(product.price)}</strong><button type="button" onClick={() => onAddToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>+ Thêm</button></div>
    </div>
  </article>
}
