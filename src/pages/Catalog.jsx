/**
 * @codex-vn-doc
 * Tệp: src/pages/Catalog.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Catalog.
 * Liên kết trực tiếp: react, ../components/ui/ProductCard, ../storefront/state, ../storefront/catalog.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useMemo, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { filterProducts } from '../storefront/state'
import { mostViewed } from '../storefront/catalog'
import './Storefront.css'

const PAGE_SIZE = 25

// Chức năng Catalog: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Catalog({ products, search, onAddToCart, favoriteIds = [], onToggleFavorite }) {
  const params = new URLSearchParams(search)
  const [category, setCategory] = useState(params.get('category') || 'Tất cả')
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const [query, setQuery] = useState(params.get('q') || '')
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [maxPrice, setMaxPrice] = useState(0)
  const [discountOnly, setDiscountOnly] = useState(params.get('discount') === '1')
  const [featuredOnly, setFeaturedOnly] = useState(params.get('featured') === '1')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    const featuredIds = featuredOnly ? new Set(mostViewed(products, 20).map((item) => String(item.id))) : null
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    const list = filterProducts(products, { category, query, maxPrice }).filter((item) =>
      (!discountOnly || item.discountPercent > 0) && (!featuredIds || featuredIds.has(String(item.id))))
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'popular') return [...list].sort((a, b) => b.viewCount - a.viewCount)
    if (sort === 'discount') return [...list].sort((a, b) => b.discountPercent - a.discountPercent)
    return list
  }, [products, category, query, maxPrice, sort, discountOnly, featuredOnly])
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const filtersActive = query.trim() || category !== 'Tất cả' || Number(maxPrice) > 0 || sort !== 'featured' || discountOnly || featuredOnly

  // Chức năng resetFilters: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function resetFilters() {
    setQuery('')
    setCategory('Tất cả')
    setMaxPrice(0)
    setSort('featured')
    setDiscountOnly(false)
    setFeaturedOnly(false)
    setVisibleCount(PAGE_SIZE)
  }

  return <div className="container page-shell">
    <header className="page-head catalog-page-head"><div><p className="eyebrow">Danh sách hàng hóa</p><h1>Chọn món phù hợp với bạn.</h1></div><p className="muted">Hiển thị {Math.min(visibleCount, visible.length)}/{visible.length} sản phẩm</p></header>
    <div className="catalog-layout">
      <aside className="catalog-sidebar surface" aria-label="Bộ lọc sản phẩm">
        <div className="catalog-sidebar__head"><h2>Tìm & lọc</h2>{filtersActive && <button type="button" onClick={resetFilters}>Xóa lọc</button>}</div>
        // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
        <label className="field"><span>Tìm kiếm</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE) }} placeholder="Tên hoặc nhóm hàng…" /></label>
        <fieldset className="catalog-category-list"><legend>Loại sản phẩm</legend>{categories.map((item) => <button key={item} className={item === category ? 'is-active' : ''} aria-pressed={item === category} onClick={() => { setCategory(item); setVisibleCount(PAGE_SIZE) }} type="button">{item}</button>)}</fieldset>
        <label className="catalog-checkbox"><input type="checkbox" checked={discountOnly} onChange={(event) => { setDiscountOnly(event.target.checked); setVisibleCount(PAGE_SIZE) }} />Chỉ sản phẩm giảm giá</label>
        <label className="catalog-checkbox"><input type="checkbox" checked={featuredOnly} onChange={(event) => { setFeaturedOnly(event.target.checked); setVisibleCount(PAGE_SIZE) }} />Top 20 xem nhiều</label>
        <label className="field"><span>Giá tối đa</span><select value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setVisibleCount(PAGE_SIZE) }}><option value="0">Không giới hạn</option><option value="500000">500.000 ₫</option><option value="1000000">1.000.000 ₫</option><option value="5000000">5.000.000 ₫</option><option value="10000000">10.000.000 ₫</option><option value="25000000">25.000.000 ₫</option></select></label>
        <label className="field"><span>Sắp xếp</span><select value={sort} onChange={(event) => { setSort(event.target.value); setVisibleCount(PAGE_SIZE) }}><option value="featured">Mặc định</option><option value="popular">Xem nhiều nhất</option><option value="discount">Giảm giá cao nhất</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option></select></label>
        <p className="catalog-sidebar__hint">Bộ lọc luôn ở bên cạnh khi bạn cuộn danh sách.</p>
      </aside>
      <div className="catalog-results">
        <div className="catalog-results__head"><div><p className="eyebrow">DANH SÁCH HIỆN TẠI</p><h2>Các sản phẩm đang hiển thị</h2></div><span>{Math.min(visibleCount, visible.length)} / {visible.length}</span></div>
        <div className="product-grid catalog-grid">{visible.slice(0, visibleCount).map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(product.id))} onToggleFavorite={onToggleFavorite} />)}</div>
        {visibleCount < visible.length && <div className="catalog-load-more"><button className="button" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Xem Thêm</button></div>}
        {visible.length === 0 && <div className="surface empty-panel"><h2>Không tìm thấy sản phẩm</h2><p className="muted">Thử từ khóa khác hoặc bỏ bộ lọc.</p><button className="button button--soft" type="button" onClick={resetFilters}>Xóa bộ lọc</button></div>}
        <p className="muted catalog-attribution">{products.filter((product) => ['mock-store-api', 'dummyjson'].includes(product.source)).length} sản phẩm nhập từ nguồn dữ liệu mẫu. Giá VND chỉ minh họa; ảnh từ <a href="https://amazon-berkeley-objects.s3.amazonaws.com/index.html" target="_blank" rel="noopener noreferrer">Amazon Berkeley Objects</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>) và <a href="https://dummyjson.com/docs/products" target="_blank" rel="noopener noreferrer">DummyJSON</a>.</p>
      </div>
    </div>
  </div>
}
