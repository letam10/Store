import ProductCard from '../components/ui/ProductCard'
import { products } from '../data/products'
import './Home.css'

export default function Home({ onAddToCart }) {
  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Store everyday / 2026</p>
            <h1>Mua sắm gọn hơn.<br /><span>Sống nhẹ hơn.</span></h1>
            <p>Những món đồ thiết thực cho công nghệ, phụ kiện và đời sống. Tìm nhanh, giá rõ, giỏ hàng đơn giản.</p>
            <div className="hero-actions"><a className="button" href="/products">Xem hàng hóa</a><a className="button button--soft" href="/locations">Tìm cửa hàng</a></div>
            <div className="hero-trust"><span>✓ Giá hiển thị rõ</span><span>✓ Hỗ trợ AI local</span><span>✓ Giao diện thân thiện mobile</span></div>
          </div>
          <div className="hero-showcase" aria-hidden="true">
            <div className="hero-card hero-card--main"><span>🎧</span><b>Everyday sound</b><small>Nhẹ · Gọn · Dễ dùng</small></div>
            <div className="hero-card hero-card--mini">New<br /><strong>2026</strong></div>
          </div>
        </div>
      </section>
      <div className="container">
        <section className="benefit-strip" aria-label="Lợi ích"><div><b>01</b><span>Chọn nhanh theo danh mục</span></div><div><b>02</b><span>Giỏ hàng lưu trên thiết bị</span></div><div><b>03</b><span>Liên hệ và địa chỉ rõ ràng</span></div></section>
        <section className="home-section">
          <div className="section-heading"><div><p className="eyebrow">Sản phẩm nổi bật</p><h2>Được chọn nhiều</h2></div><a href="/products">Xem tất cả →</a></div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>
        </section>
        <section className="story-grid">
          <div className="story-card"><p className="eyebrow">Store care</p><h2>Mua xong vẫn có người hỗ trợ.</h2><p>Chat hỗ trợ AI local nằm ở góc màn hình; các câu hỏi về giá dùng dữ liệu Store có cấu trúc.</p><a href="/contact">Kênh liên hệ →</a></div>
          <div className="story-card story-card--dark"><span>📍</span><h2>Ghé cửa hàng gần bạn</h2><p>Xem địa chỉ, giờ mở cửa và thông tin nhận hàng trực tiếp.</p><a href="/locations">Xem địa chỉ →</a></div>
        </section>
      </div>
    </>
  )
}
