/**
 * @codex-vn-doc
 * Tệp: src/pages/Favorites.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Favorites.
 * Liên kết trực tiếp: ../components/ui/ProductCard.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import ProductCard from '../components/ui/ProductCard'
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'

// Chức năng Favorites: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Favorites({ products, favoriteIds, onToggleFavorite, onAddToCart, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const favorites = favoriteIds.map((id) => products.find((product) => String(product.id) === id)).filter(Boolean)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">{english ? 'Just for you' : 'Dành riêng cho bạn'}</p><h1>{english ? 'Saved items' : 'Sản phẩm yêu thích'}</h1></div><span>{favorites.length} {english ? 'products' : 'sản phẩm'}</span></header>
    {favorites.length ? <div className="product-grid favorites-grid">{favorites.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite onToggleFavorite={onToggleFavorite} />)}</div>
      : <section className="surface empty-panel"><h2>{english ? 'No saved items yet' : 'Chưa có sản phẩm yêu thích'}</h2><p>{english ? 'Click the heart icon on any product to save it here.' : 'Nhấn biểu tượng trái tim ở một sản phẩm để lưu vào đây.'}</p><a className="button" href="/products">{english ? 'Explore products' : 'Xem hàng hóa'}</a></section>}
  </div>
}
