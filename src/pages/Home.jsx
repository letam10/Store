/**
 * @codex-vn-doc
 * Tệp: src/pages/Home.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Home.
 * Liên kết trực tiếp: react, ../components/ui/ProductCard, ../components/ui/LeadCapture, ../storefront/catalog.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useState } from 'react'
import ProductCard from '../components/ui/ProductCard'
import MarketBanner from '../components/ui/MarketBanner'
import HomePromotionRegion from '../components/ui/HomePromotionRegion'
import { featuredSaleProducts, mostViewed } from '../storefront/catalog'
import { useLanguage, translateCategory } from '../storefront/i18n'
import './Home.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const rows = [
  { category: 'Trang sức', subtitle: 'Điểm nhấn nhỏ, cá tính riêng' },
  { category: 'Trang phục', subtitle: 'Sẵn sàng cho mỗi ngày' },
  { category: 'Laptop', subtitle: 'Làm việc và học tập' },
  { category: 'Điện tử', subtitle: 'Công nghệ gần gũi' },
  { category: 'Linh kiện', subtitle: 'Chi tiết làm nên khác biệt' },
  { category: 'Đồ gia dụng', subtitle: 'Nhà cửa gọn gàng hơn' },
  { category: 'Tự Thiết Kế', subtitle: 'Ý tưởng riêng cho mỗi ngày' },
]

const rowEnglish = {
  'Trang sức': { title: 'Jewelry', subtitle: 'Subtle accents, unique style' },
  'Trang phục': { title: 'Apparel', subtitle: 'Ready for every day' },
  'Laptop': { title: 'Laptops', subtitle: 'Work and study' },
  'Điện tử': { title: 'Electronics', subtitle: 'Accessible technology' },
  'Linh kiện': { title: 'Components', subtitle: 'Details that make a difference' },
  'Đồ gia dụng': { title: 'Home Appliances', subtitle: 'Neater, cozier home' },
  'Tự Thiết Kế': { title: 'Custom Designs', subtitle: 'Unique ideas for every day' },
}

// Chức năng ProductRow: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function ProductRow({ title, subtitle, products, onAddToCart, favoriteIds, onToggleFavorite, link, sale = false, english = false }) {
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (products.length <= 6 || paused) return undefined
    const timer = setInterval(() => setOffset((current) => (current + 1) % products.length), 4500)
    return () => clearInterval(timer)
  }, [products.length, paused])
  const visible = products.length <= 6 ? products : Array.from({ length: 6 }, (_, index) => products[(offset + index) % products.length])
  return <section
    id={sale ? 'home-sale-products' : undefined}
    className={'home-section home-product-row' + (sale ? ' home-section--sale' : '')}
    onPointerEnter={() => setPaused(true)}
    onPointerLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}
  >
    <div className="section-heading"><div><p className="eyebrow">{subtitle}</p><h2>{title}</h2></div><a href={link}>{english ? 'View more →' : 'Xem thêm →'}</a></div>
    {visible.length ? <div className="product-grid home-row-grid" aria-live="off">{visible.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(product.id))} onToggleFavorite={onToggleFavorite} />)}</div> : <p className="surface home-empty-sale">{english ? 'No sale products yet.' : 'Chưa có sản phẩm giảm giá. Quản trị viên có thể đặt mức giảm trong mục Hàng hóa.'}</p>}
  </section>
}

// Chức năng Home: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Home({
  appearance = {}, products, onAddToCart, favoriteIds = [], onToggleFavorite,
  promotions, promotionOverview, account, language = 'vi',
}) {
  const langContext = useLanguage()
  const activeLang = language || langContext.language || 'vi'
  const english = activeLang === 'en'
  const [slide, setSlide] = useState(0)
  const featured = mostViewed(products, 20)
  const heroProduct = featured.length ? featured[slide % featured.length] : null
  useEffect(() => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (featured.length < 2) return undefined
    const timer = setInterval(() => setSlide((current) => current + 1), 5000)
    return () => clearInterval(timer)
  }, [featured.length])
  const sale = featuredSaleProducts(products, 10)

  return <HomePromotionRegion overview={promotionOverview} account={account} products={products} area="page">
    <HomePromotionRegion overview={promotionOverview} account={account} products={products} area="intro">
      <section className="shop-hero container">
        <div className="shop-hero-copy">
          <p className="eyebrow">{appearance.bannerLabel || (english ? 'STORE EVERYDAY · DISCOVER EVERY DAY' : 'STORE EVERYDAY · KHÁM PHÁ MỖI NGÀY')}</p>
          <h1>{appearance.heroTitle || (english ? 'Choose what you love. Live your own way.' : 'Chọn món bạn yêu. Sống theo cách riêng.')}</h1>
          <p>{appearance.heroDescription || (english ? 'Discover featured products, exclusive offers and curated categories. Trending items appear here automatically.' : 'Khám phá sản phẩm nổi bật, ưu đãi và các nhóm hàng dễ tìm. Sản phẩm được xem nhiều nhất sẽ tự xuất hiện ở đây.')}</p>
          <a className="button" href="/products">{appearance.heroButton || (english ? 'Explore the store' : 'Khám phá cửa hàng')} <span aria-hidden="true">↗</span></a>
          <div className="hero-footnote"><span>{featured.length ? String(slide % featured.length + 1).padStart(2, '0') + ' / ' + String(featured.length).padStart(2, '0') : '00 / 00'}</span><span>{featured.length ? (english ? 'Rotates every 5 seconds' : 'Thay đổi sau mỗi 5 giây') : (english ? 'Catalog is updating' : 'Danh mục đang được cập nhật')}</span></div>
          <div className="hero-dots" aria-label={english ? 'Select featured product' : 'Chọn sản phẩm nổi bật'}>{featured.map((product, index) => <button key={product.id} type="button" className={slide % featured.length === index ? 'is-active' : ''} onClick={() => setSlide(index)} aria-label={(english ? 'View ' : 'Xem ') + product.name} aria-pressed={slide % featured.length === index} />)}</div>
        </div>
        {heroProduct && <a className="shop-hero-art" href={'/products/' + encodeURIComponent(heroProduct.id)} aria-label={(english ? 'View details for ' : 'Xem chi tiết ') + heroProduct.name}>
          <span className="hero-orbit" aria-hidden="true" /><span className="hero-art-caption">{english ? 'FEATURED · TOP 20' : 'NỔI BẬT · TOP 20'}</span>
          <span className="hero-product-frame"><img className="hero-art-image" key={heroProduct.id} src={heroProduct.image || '/products/' + ({ 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }[heroProduct.id] || 'headphones') + '.svg'} alt={'Ảnh ' + heroProduct.name} width="440" height="380" /></span>
          <div className="hero-product-tag"><div><small>{translateCategory(heroProduct.category, activeLang)} · {heroProduct.viewCount} {english ? 'VIEWS' : 'LƯỢT XEM'}</small><strong>{heroProduct.name}</strong><span>{money.format(heroProduct.price)}</span></div><b aria-hidden="true">↗</b></div>
        </a>}
      </section>
      <div className="container">
        <section className="shopping-shortcuts" aria-label={english ? 'Shopping shortcuts' : 'Lối tắt mua sắm'}>
          <a href="/products"><span aria-hidden="true">⌕</span><div><b>{english ? 'Find what you need' : 'Tìm đúng món bạn cần'}</b><small>{english ? 'Filter by category and price' : 'Lọc theo danh mục và mức giá'}</small></div></a>
          <a href="/cart"><span aria-hidden="true">▣</span><div><b>{english ? 'Your shopping cart' : 'Giỏ hàng của bạn'}</b><small>{english ? 'Select items ready for checkout' : 'Tích chọn món muốn thanh toán'}</small></div></a>
          <a href="/contact"><span aria-hidden="true">☏</span><div><b>{english ? 'Contact & stores' : 'Địa chỉ & liên hệ'}</b><small>{english ? 'View map and support channels' : 'Xem bản đồ và kênh hỗ trợ'}</small></div></a>
        </section>
        {promotions}
        <ProductRow title={english ? 'Featured Products' : 'Sản phẩm nổi bật'} subtitle={english ? 'TOP 20 MOST VIEWED' : 'TOP 20 ĐƯỢC XEM NHIỀU NHẤT'} products={featured} onAddToCart={onAddToCart} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} link="/products?featured=1&sort=popular" english={english} />
      </div>
    </HomePromotionRegion>
    <HomePromotionRegion overview={promotionOverview} account={account} products={products} area="catalog">
      <div className="container home-catalog">
        <ProductRow
          title={english ? 'On Sale' : 'Đang giảm giá'}
          subtitle={english ? 'SPECIAL OFFERS' : 'ƯU ĐÃI TỪ QUẢN TRỊ'}
          products={sale}
          onAddToCart={onAddToCart}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          link="/products?discount=1&sort=discount"
          sale
          english={english}
        />
        {rows.map(({ category, subtitle }) => {
          const trans = rowEnglish[category]
          return <ProductRow
            key={category}
            title={english && trans ? trans.title : category}
            subtitle={english && trans ? trans.subtitle : subtitle}
            products={products.filter(product => product.category === category && product.stockCount !== 0)}
            onAddToCart={onAddToCart}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            link={'/products?category=' + encodeURIComponent(category)}
            english={english}
          />
        })}
      </div>
    </HomePromotionRegion>
    <div className="container home-catalog">
      <section className="member-links" aria-label={english ? 'Discover more' : 'Khám phá thêm'}>
        <a href="/membership"><span>{english ? '01 — STORE MEMBERSHIP' : '01 — THÀNH VIÊN STORE'}</span><h2>{english ? <>More benefits.<br />More joy.</> : <>Thêm quyền lợi.<br />Thêm niềm vui.</>}</h2><p>{english ? 'Explore 4 membership tiers and earn reward points.' : 'Khám phá bốn hạng thành viên tích điểm.'}</p><b>{english ? 'View membership ↗' : 'Xem thành viên ↗'}</b></a>
        <a href="/rewards"><span>{english ? '02 — STORE LUCKY' : '02 — STORE LUCKY'}</span><h2>{english ? <>One spin,<br />a small surprise.</> : <>Một vòng quay,<br />một bất ngờ nhỏ.</>}</h2><p>{english ? 'Use your earned spins to unlock vouchers.' : 'Dùng lượt quay đã tích để nhận voucher.'}</p><b>{english ? 'To lucky wheel ↗' : 'Đến vòng quay ↗'}</b></a>
      </section>
      <MarketBanner />
      <section className="visit-strip"><div><p className="eyebrow">{english ? 'STORE, CLOSER TO YOU' : 'STORE, GẦN BẠN HƠN'}</p><h2>{english ? 'Looking for directions or contact?' : 'Muốn tìm đường hoặc liên hệ?'}</h2></div><a className="button button--soft" href="/contact">{english ? 'View locations & contact ↗' : 'Xem địa chỉ & liên hệ ↗'}</a></section>
    </div>
  </HomePromotionRegion>
}
