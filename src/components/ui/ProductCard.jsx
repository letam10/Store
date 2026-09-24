import './ProductCard.css'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const pictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }
export default function ProductCard({ product, onAddToCart }) {
  const href = '/products/' + product.id
  return <article className={'product-card' + (product.stockCount === 0 ? ' product-card--out' : '')}>
    <a className="product-art-link" href={href} aria-label={'Xem chi tiết ' + product.name}>
      <div className={`product-art product-art--${product.tone}`}>
        <span className="product-label">{product.discountPercent > 0 ? '-' + product.discountPercent + '%' : product.label}</span>
        {product.image || pictures[product.id] ? <img src={product.image || '/products/' + pictures[product.id] + '.svg'} alt={'Ảnh ' + product.name} width="440" height="380" loading="lazy" /> : <span className="product-symbol" aria-hidden="true">{product.symbol}</span>}
        <span className="product-view">Xem chi tiết ↗</span>
      </div>
    </a>
    <div className="product-info"><p className="product-category">{product.category}</p><h3><a href={href}>{product.name}</a></h3>
      <div className="product-bottom"><div className="product-prices"><strong>{currency.format(product.price)}</strong>{product.discountPercent > 0 && <del>{currency.format(product.originalPrice)}</del>}</div><button type="button" disabled={product.stockCount === 0} onClick={() => onAddToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>{product.stockCount === 0 ? 'Hết hàng' : '+ Thêm'}</button></div>
    </div>
  </article>
}
