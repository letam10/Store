import ProductCard from '../components/ui/ProductCard'
import './Storefront.css'

export default function Favorites({ products, favoriteIds, onToggleFavorite, onAddToCart }) {
  const favorites = favoriteIds.map((id) => products.find((product) => String(product.id) === id)).filter(Boolean)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Dành riêng cho bạn</p><h1>Sản phẩm yêu thích</h1></div><span>{favorites.length} sản phẩm</span></header>
    {favorites.length ? <div className="product-grid catalog-grid">{favorites.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite onToggleFavorite={onToggleFavorite} />)}</div>
      : <section className="surface empty-panel"><h2>Chưa có sản phẩm yêu thích</h2><p>Nhấn biểu tượng trái tim ở một sản phẩm để lưu vào đây.</p><a className="button" href="/products">Xem hàng hóa</a></section>}
  </div>
}
