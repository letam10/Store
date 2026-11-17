import { membershipPlans } from '../../services/promotions'
import { computeSideBannerSync, resolveSideBanners } from '../../services/sideBanners'
import HomeBannerArtwork from './HomeBannerArtwork'
import HomeBannerOffers from './HomeBannerOffers'
import './HomeSideBanner.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Thẻ banner sản phẩm ở chế độ custom: ảnh + tên + giá, bấm vào trang chi tiết.
// Key và data-banner-id gồm cả index để slot trùng productId không bị trùng key.
function SideBannerCard({ banner, index }) {
  const { product } = banner
  const style = {}
  if (banner.bg) style.background = banner.bg
  if (banner.text) {
    style.color = banner.text
    style['--banner-ink'] = banner.text
    style['--banner-muted'] = banner.text
  }
  if (banner.accent) style['--banner-price'] = banner.accent
  return (
    <a
      className="home-side-banner home-banner-offer home-banner-custom"
      href={'/products/' + product.id}
      data-banner-id={banner.productId + '-' + index}
      aria-label={'Xem chi tiết ' + banner.title}
      style={style}
    >
      <div className="home-banner-offer__visual">
        {product.category && <p className="home-banner-offer__label">{product.category}</p>}
        {product.image && <div className="home-banner-offer__product-art">
          <img src={product.image} alt={product.name} width="240" height="220" loading="lazy" />
        </div>}
        <div className="home-banner-offer__product-caption">
          <strong>{banner.title}</strong>
          <b>{money.format(product.price)}</b>
        </div>
      </div>
      {banner.note && <p className="home-banner-offer__note">{banner.note}</p>}
      <span className="home-banner-offer__action">
        Xem chi tiết
        <span aria-hidden="true">↗</span>
      </span>
    </a>
  )
}

export default function HomeSideBanner({ side, overview, account, products, area, appearance = {}, sync = null }) {
  const { sales, maxDiscount, plan, points } = overview
  const isStore = side === 'left'
  const bestPlan = membershipPlans.at(-1)
  const discount = account ? plan.discount : bestPlan.discount
  const hasSale = sales.length > 0
  const isIntro = area === 'intro' || area === 'page'
  const isPage = area === 'page'
  const compactCount = isStore ? 1 : 2
  const title = isStore ? 'Món cần. Giá tốt.' : account ? 'Hạng ' + plan.name : 'Thêm nhiều quyền lợi.'

  // Cấu hình banner custom (nếu có) resolve từ appearance.sideBanners.
  // Bên nào không còn slot hợp lệ thì trả null để bên đó fallback y như cũ.
  // Đồng bộ hai rail: dùng sync chung do HomePromotionRegion tính từ cả hai
  // bên (số hàng chung mỗi đoạn + span bù hàng thiếu); render lẻ không qua
  // region thì tự tính lại bằng cùng hàm computeSideBannerSync.
  const resolved = isPage ? resolveSideBanners(appearance?.sideBanners, products) : { left: null, right: null }
  const railSync = isPage ? (sync ?? computeSideBannerSync(resolved.left, resolved.right)) : null
  const sideSync = railSync ? railSync[side] : null
  const customBanners = sideSync?.isCustom ? sideSync.banners : null
  const isCustom = isPage && customBanners !== null
  const split = isCustom ? { before: sideSync.before, after: sideSync.after } : null
  // Biến lưới hàng chung: cả hai rail cùng số hàng mỗi đoạn, mục đầu mỗi
  // đoạn span bù hàng thiếu — xem .home-side-banner-stack--synced trong CSS.
  const syncStyle = isPage ? {
    '--rows-before': railSync.rowsBefore,
    '--rows-after': railSync.rowsAfter,
    '--before-lead-span': sideSync.leadBeforeSpan,
    '--after-lead-span': sideSync.leadAfterSpan,
  } : {}

  // Chế độ custom thay toàn bộ cột: thẻ đầu và offer mặc định không render,
  // tổng số card trong cột đúng bằng số slot đã resolve, chia trước/sau khe sale.
  if (isCustom) {
    return (
      <div
        className="home-side-banner-stack home-side-banner-stack--custom home-side-banner-stack--synced"
        style={{ '--home-banner-card-count': customBanners.length, ...syncStyle }}
      >
        {split.before.map((banner, index) => <SideBannerCard key={banner.productId + '-' + index} banner={banner} index={index} />)}
        <div className="home-promotion-rail__sale-gap" aria-hidden="true" />
        {split.after.map((banner, index) => <SideBannerCard key={banner.productId + '-' + (split.before.length + index)} banner={banner} index={split.before.length + index} />)}
      </div>
    )
  }

  return (
    <div
      className={'home-side-banner-stack' + (isPage ? ' home-side-banner-stack--synced' : '')}
      style={{ '--home-banner-card-count': isPage ? (isStore ? 11 : 13) : isIntro ? 3 : 5, ...syncStyle }}
    >
      {isIntro && <a
        className={'home-side-banner home-side-banner--' + (isStore ? 'store' : 'member')}
        href={isStore ? '#home-sale-products' : '/membership'}
        data-banner-id={isStore ? 'store' : 'member'}
        aria-label={title + '. ' + (isStore ? 'Xem khu giá tốt' : 'Xem quyền lợi thành viên')}
      >
        <div className="home-side-banner__identity">
          <p className="home-side-banner__brand">omnicart.</p>
          <span className="home-side-banner__edition">{isStore ? 'MỖI NGÀY' : 'MEMBER'}</span>
        </div>
        <HomeBannerArtwork kind={isStore ? 'store' : 'member'} />
        <p className="home-side-banner__kicker">{isStore ? 'CHỌN ĐIỀU THIẾT THỰC' : 'GẮN BÓ CÙNG OMNICART'}</p>
        <h2>{title}</h2>
        <div className="home-side-banner__offer">
          <span>{isStore ? hasSale ? 'Ưu đãi hàng hóa đến' : 'Khám phá cửa hàng' : 'Giảm thêm khi thanh toán'}</span>
          <strong>
            {isStore ? hasSale ? '−' + maxDiscount : 'Mỗi ngày' : discount}
            {(!isStore || hasSale) && <small>%</small>}
          </strong>
          <p>
            {isStore
              ? hasSale ? sales.length + ' sản phẩm đang giảm giá.' : 'Đồ dùng thiết thực cho bạn.'
              : account ? points.toLocaleString('vi-VN') + ' điểm đã tích.'
                : 'Hạng ' + bestPlan.name + ' từ ' + bestPlan.points.toLocaleString('vi-VN') + ' điểm.'}
          </p>
        </div>
        <p className="home-side-banner__description">
          {isStore
            ? 'Những món dùng mỗi ngày, thêm nhiều lựa chọn cho cuộc sống của bạn.'
            : 'Mua sắm, tích điểm và khám phá quyền lợi theo hạng thành viên của bạn.'}
        </p>
        <ul className="home-side-banner__details">
          <li>{isStore ? 'Khám phá nhiều nhóm hàng' : 'Theo dõi điểm và hạng hiện tại'}</li>
          <li>{isStore ? 'So sánh thông tin và mức giá' : 'Xem điều kiện từng quyền lợi'}</li>
        </ul>
        <span className="home-side-banner__action">
          {isStore ? 'Xem khu giá tốt' : 'Quyền lợi & điều kiện'}
          <span aria-hidden="true">{isStore ? '↓' : '↗'}</span>
        </span>
      </a>}
      {isPage ? <>
        <HomeBannerOffers side={side} overview={overview} account={account} products={products} offset={0} count={2} />
        <HomeBannerOffers
          side={side}
          overview={overview}
          account={account}
          products={products}
          offset={2}
          count={compactCount}
          compact
        />
        <div className="home-promotion-rail__sale-gap" aria-hidden="true" />
        <HomeBannerOffers
          side={side}
          overview={overview}
          account={account}
          products={products}
          offset={2 + compactCount}
          count={isStore ? 7 : 8}
        />
      </> : <HomeBannerOffers
        side={side}
        overview={overview}
        account={account}
        products={products}
        offset={isIntro ? 0 : 2}
        count={isIntro ? 2 : 5}
      />}
    </div>
  )
}
