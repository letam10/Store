import { useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import { products } from '../data/products'
import './Home.css'
const categories = ['Tất cả', ...new Set(products.map((product) => product.category))]
export default function Home({ onAddToCart }) {
  const [category, setCategory] = useState('Tất cả')
  const [query, setQuery] = useState('')
  const filteredProducts = products.filter((product) =>
    (category === 'Tất cả' || product.category === category)
    && product.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')),
  )
  return (
    <div className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">Everyday essentials / 2026</p>
          <h1>Chọn đơn giản.<br />Sống chất hơn.</h1>
          <p className="hero-description">Một vài món đồ vừa đủ, một chút cảm hứng mỗi ngày. Khám phá những lựa chọn dành cho bạn.</p>
          <a className="button" href="#products">Khám phá sản phẩm ↗</a>
        </div>
        <div className="hero-note"><span aria-hidden="true">✳</span><p>Ít hơn.<br /><strong>Nhưng tốt hơn.</strong></p><small>BỘ SƯU TẬP MỖI NGÀY</small></div>
      </section>
      <section id="products" aria-labelledby="products-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Dành cho bạn</p><h2 id="products-heading">Khám phá cửa hàng</h2></div>
          <label className="search">Tìm sản phẩm<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nhập tên sản phẩm…" /></label>
        </div>
        <div className="categories" aria-label="Lọc theo danh mục">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="product-grid">
          {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}
        </div>
        {filteredProducts.length === 0 && <p className="empty-state" role="status">Không tìm thấy sản phẩm phù hợp.</p>}
        <p className="demo-note">Bản mẫu: nút + tăng số lượng giỏ hàng; tải lại trang sẽ đặt lại số lượng.</p>
      </section>
    </div>
  )
}
