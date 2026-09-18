import { useMemo, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { products } from '../data/products'
import { productMatches } from '../storefront/state'
import './Storefront.css'

export default function Catalog({ onAddToCart }) {
  const [category, setCategory] = useState('Tất cả')
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const [sort, setSort] = useState('featured')
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    const list = products.filter((item) =>
      (category === 'Tất cả' || item.category === category) &&
      productMatches(item, query))
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
    <div className="catalog-suggestions"><span>Gợi ý:</span>{['tai nghe','túi','đồng hồ','đời sống'].map((term)=><button type="button" key={term} onClick={()=>setQuery(term)}>{term}</button>)}</div>
    <div className="category-pills">{categories.map((item)=><button key={item} className={item===category?'is-active':''} onClick={()=>setCategory(item)} type="button">{item}</button>)}</div>
    <div className="product-grid catalog-grid">{visible.map((product)=><ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>)}</div>
    {visible.length===0&&<div className="surface empty-panel"><h2>Không tìm thấy sản phẩm</h2><p className="muted">Thử từ khóa ngắn hơn, bỏ bớt thuộc tính hoặc chọn “Tất cả”.</p><div className="page-actions" style={{justifyContent:'center'}}><button className="button button--soft" type="button" onClick={()=>{setQuery('');setCategory('Tất cả')}}>Xóa bộ lọc</button></div></div>}
  </div>
}
