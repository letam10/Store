import { useEffect, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import LeadCapture from '../components/ui/LeadCapture'
import { mostViewed } from '../storefront/catalog'
import './Home.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const rows = [
  { category: 'Trang sức', subtitle: 'Điểm nhấn nhỏ, cá tính riêng' },
  { category: 'Trang phục', subtitle: 'Sẵn sàng cho mỗi ngày' },
  { category: 'Laptop', subtitle: 'Làm việc và học tập' },
  { category: 'Điện tử', subtitle: 'Công nghệ gần gũi' },
  { category: 'Linh kiện', subtitle: 'Chi tiết làm nên khác biệt' },
  { category: 'Đồ gia dụng', subtitle: 'Nhà cửa gọn gàng hơn' },
  { category: 'Thực phẩm', subtitle: 'Lựa chọn cho mỗi ngày' },
]

function ProductRow({ title, subtitle, products, onAddToCart, favoriteIds, onToggleFavorite, link, sale = false }) {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    if (products.length <= 6) return undefined
    const timer = setInterval(() => setOffset((current) => (current + 1) % products.length), 4500)
    return () => clearInterval(timer)
  }, [products.length])
  const visible = products.length <= 6 ? products : Array.from({ length: 6 }, (_, index) => products[(offset + index) % products.length])
  return <section className={'home-section home-product-row' + (sale ? ' home-section--sale' : '')}>
    <div className="section-heading"><div><p className="eyebrow">{subtitle}</p><h2>{title}</h2></div><a href={link}>Xem thêm →</a></div>
    {visible.length ? <div className="product-grid home-row-grid" key={offset} aria-live="off">{visible.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(product.id))} onToggleFavorite={onToggleFavorite} />)}</div> : <p className="surface home-empty-sale">Chưa có sản phẩm giảm giá. Quản trị viên có thể đặt mức giảm trong mục Hàng hóa.</p>}
  </section>
}

export default function Home({ appearance = {}, products, onAddToCart, favoriteIds = [], onToggleFavorite }) {
  const [slide, setSlide] = useState(0)
  const featured = mostViewed(products, 20)
  const heroProduct = featured[slide % featured.length]
  useEffect(() => {
    if (featured.length < 2) return undefined
    const timer = setInterval(() => setSlide((current) => current + 1), 5000)
    return () => clearInterval(timer)
  }, [featured.length])
  const sale = products.filter((product) => product.discountPercent > 0 && product.stockCount !== 0)

  return <>
    <section className="shop-hero container">
      <div className="shop-hero-copy">
        <p className="eyebrow">{appearance.bannerLabel || 'STORE EVERYDAY · KHÁM PHÁ MỖI NGÀY'}</p>
        <h1>{appearance.heroTitle || 'Chọn món bạn yêu. Sống theo cách riêng.'}</h1>
        <p>{appearance.heroDescription || 'Khám phá sản phẩm nổi bật, ưu đãi và các nhóm hàng dễ tìm. Sản phẩm được xem nhiều nhất sẽ tự xuất hiện ở đây.'}</p>
        <a className="button" href="/products">{appearance.heroButton || 'Khám phá cửa hàng'} <span aria-hidden="true">↗</span></a>
        <div className="hero-footnote"><span>{String(slide % featured.length + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}</span><span>Thay đổi sau mỗi 5 giây</span></div>
        <div className="hero-dots" aria-label="Chọn sản phẩm nổi bật">{featured.map((product, index) => <button key={product.id} type="button" className={slide % featured.length === index ? 'is-active' : ''} onClick={() => setSlide(index)} aria-label={'Xem ' + product.name} aria-pressed={slide % featured.length === index} />)}</div>
      </div>
      {heroProduct && <a className="shop-hero-art" href={'/products/' + heroProduct.id} aria-label={'Xem chi tiết ' + heroProduct.name}>
        <span className="hero-orbit" aria-hidden="true" /><span className="hero-art-caption">ĐƯỢC XEM NHIỀU</span>
        <img className="hero-art-image" key={heroProduct.id} src={heroProduct.image || '/products/' + ({ 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }[heroProduct.id] || 'headphones') + '.svg'} alt={'Ảnh ' + heroProduct.name} width="440" height="380" />
        <div className="hero-product-tag"><div><small>{heroProduct.viewCount} LƯỢT XEM CHI TIẾT</small><strong>{heroProduct.name}</strong><span>{money.format(heroProduct.price)} · Giá dữ liệu mẫu</span></div><b aria-hidden="true">↗</b></div>
      </a>}
    </section>
    <div className="container">
      <section className="shopping-shortcuts" aria-label="Lối tắt mua sắm">
        <a href="/products"><span aria-hidden="true">⌕</span><div><b>Tìm đúng món bạn cần</b><small>Lọc theo danh mục và mức giá</small></div></a>
        <a href="/cart"><span aria-hidden="true">▣</span><div><b>Giỏ hàng của bạn</b><small>Tích chọn món muốn thanh toán</small></div></a>
        <a href="/contact"><span aria-hidden="true">☏</span><div><b>Địa chỉ & liên hệ</b><small>Xem bản đồ và kênh hỗ trợ</small></div></a>
      </section>
      <ProductRow title="Sản phẩm nổi bật" subtitle="TOP 20 ĐƯỢC XEM NHIỀU NHẤT" products={featured} onAddToCart={onAddToCart} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} link="/products?featured=1&sort=popular" />
      <ProductRow title="Đang giảm giá" subtitle="ƯU ĐÃI TỪ QUẢN TRỊ" products={sale} onAddToCart={onAddToCart} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} link="/products?discount=1&sort=discount" sale />
      {rows.map(({ category, subtitle }) => <ProductRow key={category} title={category} subtitle={subtitle} products={products.filter((product) => product.category === category && product.stockCount !== 0)} onAddToCart={onAddToCart} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} link={'/products?category=' + encodeURIComponent(category)} />)}
      <section className="member-links" aria-label="Khám phá thêm">
        <a href="/membership"><span>01 — THÀNH VIÊN STORE</span><h2>Thêm quyền lợi.<br />Thêm niềm vui.</h2><p>Khám phá bốn hạng thành viên tích điểm.</p><b>Xem thành viên ↗</b></a>
        <a href="/rewards"><span>02 — STORE LUCKY</span><h2>Một vòng quay,<br />một bất ngờ nhỏ.</h2><p>Dùng lượt quay đã tích để nhận voucher.</p><b>Đến vòng quay ↗</b></a>
      </section>
      <LeadCapture />
      <section className="visit-strip"><div><p className="eyebrow">STORE, GẦN BẠN HƠN</p><h2>Muốn tìm đường hoặc liên hệ?</h2></div><a className="button button--soft" href="/contact">Xem địa chỉ & liên hệ ↗</a></section>
    </div>
  </>
}
