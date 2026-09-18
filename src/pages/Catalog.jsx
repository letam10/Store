import { useMemo, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { products } from '../data/products'
import './Storefront.css'

export default function Catalog({ onAddToCart }) {
  const [category, setCategory] = useState('Tất cả')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    const list = products.filter((item) =>
      (category === 'Tất cả' || item.category === category) &&
      (!normalized || item.name.toLocaleLowerCase('vi').includes(normalized)))
    if (sort === 'price-asc') return [...list].sort((a,b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a,b) => b.price - a.price)
    return list
  }, [category, query, sort])

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Danh sách hàng hóa</p><h1>Chọn món phù hợp với bạn.</h1></div><p className="muted">{visible.length} sản phẩm đang hiển thị</p></header>
    <section className="catalog-toolbar surface">
      <label className="field"><span>Tìm kiếm</span><input type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Tên sản phẩm…" /></label>
      <label className="field"><span>Sắp xếp</span><select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option></select></label>
    </section>
    <div className="category-pills">{categories.map((item)=><button key={item} className={item===category?'is-active':''} onClick={()=>setCategory(item)} type="button">{item}</button>)}</div>
    <div className="product-grid catalog-grid">{visible.map((product)=><ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>)}</div>
    {visible.length===0&&<div className="surface empty-panel"><h2>Không tìm thấy sản phẩm</h2><p className="muted">Thử từ khóa hoặc danh mục khác.</p></div>}
  </div>
}
