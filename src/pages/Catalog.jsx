import { useMemo, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { products } from '../data/products'
import { filterProducts } from '../storefront/state'
import './Storefront.css'

export default function Catalog({ onAddToCart }) {
  const [category, setCategory] = useState('Tất cả')
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const [sort, setSort] = useState('featured')
  const [maxPrice, setMaxPrice] = useState(0)
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    const list = filterProducts(products, { category, query, maxPrice })
    if (sort === 'price-asc') return [...list].sort((a,b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a,b) => b.price - a.price)
    return list
  }, [category, query, maxPrice, sort])
  const filtersActive = query.trim() || category !== 'Tất cả' || Number(maxPrice) > 0

  function resetFilters() {
    setQuery('')
    setCategory('Tất cả')
    setMaxPrice(0)
    setSort('featured')
  }

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Danh sách hàng hóa</p><h1>Chọn món phù hợp với bạn.</h1></div><p className="muted">{visible.length} sản phẩm đang hiển thị</p></header>
    <section className="catalog-toolbar surface">
      <label className="field"><span>Tìm kiếm</span><input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Tên, danh mục hoặc nhãn…" /></label>
      <label className="field"><span>Giá tối đa</span><select value={maxPrice} onChange={(event)=>setMaxPrice(Number(event.target.value))}><option value="0">Không giới hạn</option><option value="300000">300.000 ₫</option><option value="1000000">1.000.000 ₫</option><option value="1500000">1.500.000 ₫</option></select></label>
      <label className="field"><span>Sắp xếp</span><select value={sort} onChange={(event)=>setSort(event.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option></select></label>
    </section>
    <div className="catalog-filter-meta">
      <div className="catalog-suggestions"><span>Gợi ý:</span>{['tai nghe','túi','đồng hồ','đời sống'].map((term)=><button type="button" key={term} onClick={()=>setQuery(term)}>{term}</button>)}</div>
      {filtersActive && <button className="catalog-reset" type="button" onClick={resetFilters}>Xóa toàn bộ bộ lọc</button>}
    </div>
    <div className="category-pills" aria-label="Danh mục sản phẩm">{categories.map((item)=><button key={item} className={item===category?'is-active':''} aria-pressed={item===category} onClick={()=>setCategory(item)} type="button">{item}</button>)}</div>
    <div className="product-grid catalog-grid">{visible.map((product)=><ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>)}</div>
    <p className="muted">{products.filter((product) => product.source === 'mock-store-api').length} sản phẩm nhập từ API cửa hàng mẫu để thử giao diện. Giá VND chỉ mang tính minh họa; ảnh từ <a href="https://amazon-berkeley-objects.s3.amazonaws.com/index.html" target="_blank" rel="noopener noreferrer">Amazon Berkeley Objects</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>).</p>
    {visible.length===0&&<div className="surface empty-panel"><h2>Không tìm thấy sản phẩm</h2><p className="muted">Thử từ khóa ngắn hơn, tăng mức giá hoặc chọn “Tất cả”.</p><div className="page-actions" style={{justifyContent:'center'}}><button className="button button--soft" type="button" onClick={resetFilters}>Xóa bộ lọc</button></div></div>}
  </div>
}
