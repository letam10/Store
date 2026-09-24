import { useMemo, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { filterProducts } from '../storefront/state'
import { mostViewed } from '../storefront/catalog'
import './Storefront.css'

export default function Catalog({ products, search, onAddToCart }) {
  const params = new URLSearchParams(search)
  const [category, setCategory] = useState(params.get('category') || 'Tất cả')
  const [query, setQuery] = useState(params.get('q') || '')
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [maxPrice, setMaxPrice] = useState(0)
  const [discountOnly, setDiscountOnly] = useState(params.get('discount') === '1')
  const [featuredOnly, setFeaturedOnly] = useState(params.get('featured') === '1')
  const [visibleCount, setVisibleCount] = useState(25)
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    const featuredIds = featuredOnly ? new Set(mostViewed(products, 20).map((item) => String(item.id))) : null
    const list = filterProducts(products, { category, query, maxPrice }).filter((item) =>
      (!discountOnly || item.discountPercent > 0) && (!featuredIds || featuredIds.has(String(item.id))))
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'popular') return [...list].sort((a, b) => b.viewCount - a.viewCount)
    if (sort === 'discount') return [...list].sort((a, b) => b.discountPercent - a.discountPercent)
    return list
  }, [products, category, query, maxPrice, sort, discountOnly, featuredOnly])
  const filtersActive = query.trim() || category !== 'Tất cả' || Number(maxPrice) > 0 || sort !== 'featured' || discountOnly || featuredOnly

  function resetFilters() {
    setQuery('')
    setCategory('Tất cả')
    setMaxPrice(0)
    setSort('featured')
    setDiscountOnly(false)
    setFeaturedOnly(false)
    setVisibleCount(25)
  }

  return <div className="container page-shell">
    <header className="page-head catalog-page-head"><div><p className="eyebrow">Danh sách hàng hóa</p><h1>Chọn món phù hợp với bạn.</h1></div><p className="muted">Hiển thị {Math.min(visibleCount, visible.length)}/{visible.length} sản phẩm</p></header>
    <div className="catalog-layout">
      <aside className="catalog-sidebar surface" aria-label="Bộ lọc sản phẩm">
        <div className="catalog-sidebar__head"><h2>Tìm & lọc</h2>{filtersActive && <button type="button" onClick={resetFilters}>Xóa lọc</button>}</div>
        <label className="field"><span>Tìm kiếm</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(25) }} placeholder="Tên hoặc nhóm hàng…" /></label>
        <fieldset className="catalog-category-list"><legend>Loại sản phẩm</legend>{categories.map((item) => <button key={item} className={item === category ? 'is-active' : ''} aria-pressed={item === category} onClick={() => { setCategory(item); setVisibleCount(25) }} type="button">{item}</button>)}</fieldset>
        <label className="catalog-checkbox"><input type="checkbox" checked={discountOnly} onChange={(event) => { setDiscountOnly(event.target.checked); setVisibleCount(25) }} />Chỉ sản phẩm giảm giá</label>
        <label className="catalog-checkbox"><input type="checkbox" checked={featuredOnly} onChange={(event) => { setFeaturedOnly(event.target.checked); setVisibleCount(25) }} />Top 20 xem nhiều</label>
        <label className="field"><span>Giá tối đa</span><select value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setVisibleCount(25) }}><option value="0">Không giới hạn</option><option value="500000">500.000 ₫</option><option value="1000000">1.000.000 ₫</option><option value="5000000">5.000.000 ₫</option><option value="10000000">10.000.000 ₫</option><option value="25000000">25.000.000 ₫</option></select></label>
        <label className="field"><span>Sắp xếp</span><select value={sort} onChange={(event) => { setSort(event.target.value); setVisibleCount(25) }}><option value="featured">Mặc định</option><option value="popular">Xem nhiều nhất</option><option value="discount">Giảm giá cao nhất</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option></select></label>
        <p className="catalog-sidebar__hint">Bộ lọc luôn ở bên cạnh khi bạn cuộn danh sách.</p>
      </aside>
      <div className="catalog-results">
        <div className="product-grid catalog-grid">{visible.slice(0, visibleCount).map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>
        {visibleCount < visible.length && <div className="catalog-load-more"><button className="button" type="button" onClick={() => setVisibleCount((count) => count + 25)}>Xem thêm 25 sản phẩm</button></div>}
        {visible.length === 0 && <div className="surface empty-panel"><h2>Không tìm thấy sản phẩm</h2><p className="muted">Thử từ khóa khác hoặc bỏ bộ lọc.</p><button className="button button--soft" type="button" onClick={resetFilters}>Xóa bộ lọc</button></div>}
        <p className="muted catalog-attribution">{products.filter((product) => product.source === 'mock-store-api').length} sản phẩm nhập từ API mẫu. Giá VND chỉ minh họa; ảnh từ <a href="https://amazon-berkeley-objects.s3.amazonaws.com/index.html" target="_blank" rel="noopener noreferrer">Amazon Berkeley Objects</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>).</p>
      </div>
    </div>
  </div>
}
