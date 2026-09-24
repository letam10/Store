import ProductCard from '../components/ui/ProductCard'
import LeadCapture from '../components/ui/LeadCapture'
import { products } from '../data/products'
import './Home.css'

const categories = [
  { name: 'Công nghệ', text: 'Nhịp sống kết nối', image: 'headphones', tone: 'green' },
  { name: 'Phụ kiện', text: 'Mang theo cá tính', image: 'bag', tone: 'sand' },
  { name: 'Đời sống', text: 'Chút vui mỗi ngày', image: 'cup', tone: 'rose' },
]

export default function Home({ onAddToCart }) {
  return <>
    <section className="shop-hero container">
      <div className="shop-hero-copy">
        <p className="eyebrow">THE EVERYDAY EDIT — BỘ SƯU TẬP 2026</p>
        <h1>Đồ dùng tốt.<br />Ngày <em>thảnh thơi.</em></h1>
        <p>Không cần quá nhiều. Chỉ cần những món đồ phù hợp với bạn — từ góc làm việc đến những chuyến đi.</p>
        <a className="button" href="/products">Khám phá cửa hàng <span aria-hidden="true">↗</span></a>
        <div className="hero-footnote"><span>01 / 03</span><span>Công nghệ · Phụ kiện · Đời sống</span></div>
      </div>
      <a className="shop-hero-art" href="/products/1" aria-label="Khám phá tai nghe Everyday">
        <span className="hero-orbit" aria-hidden="true" />
        <span className="hero-art-caption">LESS, BUT BETTER.</span>
        <img src="/products/headphones.svg" alt="Minh họa tai nghe Everyday màu xanh" width="440" height="380" />
        <div className="hero-product-tag"><div><small>ĐIỂM NHẤN MỖI NGÀY</small><strong>Tai nghe Everyday</strong><span>890.000 ₫ · Sản phẩm demo</span></div><b aria-hidden="true">↗</b></div>
      </a>
    </section>
    <div className="container">
      <section className="shopping-shortcuts" aria-label="Mua sắm dễ dàng">
        <a href="/products"><span aria-hidden="true">⌕</span><div><b>Tìm đúng món bạn cần</b><small>Lọc danh mục, mức giá, tên sản phẩm</small></div></a>
        <a href="/cart"><span aria-hidden="true">▣</span><div><b>Giỏ hàng luôn sẵn</b><small>Lưu trên trình duyệt của bạn</small></div></a>
        <a href="/contact"><span aria-hidden="true">☏</span><div><b>Cần một chút tư vấn?</b><small>Xem kênh liên hệ và hỗ trợ</small></div></a>
      </section>
      <section className="home-section">
        <div className="section-heading"><div><p className="eyebrow">BẮT ĐẦU TỪ ĐIỀU BẠN THÍCH</p><h2>Mỗi ngày, một lựa chọn tốt.</h2></div><a href="/products">Tất cả danh mục ↗</a></div>
        <div className="editorial-categories">{categories.map((category) => <a className={'category-tile category-tile--' + category.tone} key={category.name} href={'/products?q=' + encodeURIComponent(category.name)}>
          <div><small>{category.text}</small><h3>{category.name}</h3></div>
          <img src={'/products/' + category.image + '.svg'} alt="" width="440" height="380" loading="lazy" />
          <span className="tile-arrow" aria-hidden="true">↗</span>
        </a>)}</div>
      </section>
      <section className="home-section">
        <div className="section-heading"><div><p className="eyebrow">TUYỂN CHỌN TỪ STORE</p><h2>Những món đáng khám phá</h2></div><a href="/products">Xem tất cả sản phẩm ↗</a></div>
        <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>
      </section>
      <section className="editorial-banner">
        <div><p className="eyebrow">MỘT CHÚT CHẬM LẠI</p><h2>Dành chỗ cho<br />những điều giản đơn.</h2><p>Một chiếc ly quen, một góc ngồi yêu thích. Bắt đầu buổi sáng theo cách của bạn.</p><a className="button" href="/products?q=Đời+sống">Khám phá đồ dùng đời sống ↗</a></div>
        <img src="/products/cup.svg" alt="Minh họa ly cà phê Morning" width="440" height="380" loading="lazy" />
      </section>
      <section className="member-links" aria-label="Khám phá thêm">
        <a href="/membership"><span>01 — STORE MEMBERSHIP</span><h2>Thêm quyền lợi.<br />Thêm niềm vui.</h2><p>Khám phá các hạng thành viên thử nghiệm.</p><b>Xem thành viên ↗</b></a>
        <a href="/rewards"><span>02 — STORE LUCKY</span><h2>Một vòng quay,<br />một bất ngờ nhỏ.</h2><p>Thử vòng quay và voucher demo, không giải thưởng thật.</p><b>Trải nghiệm vòng quay ↗</b></a>
      </section>
      <LeadCapture />
      <section className="visit-strip"><div><p className="eyebrow">STORE, GẦN BẠN HƠN</p><h2>Muốn xem trước khi chọn?</h2></div><a className="button button--soft" href="/locations">Thông tin cửa hàng ↗</a></section>
    </div>
  </>
}
