import { useLayoutEffect, useRef } from 'react'
import { membershipPlans } from '../../services/promotions'
import { resolveSideBanners, splitSideBanners } from '../../services/sideBanners'
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

export default function HomeSideBanner({ side, overview, account, products, area, appearance = {} }) {
  const stackRef = useRef(null)
  const saleGapRef = useRef(null)
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
  const resolved = isPage ? resolveSideBanners(appearance?.sideBanners, products) : { left: null, right: null }
  const customBanners = isStore ? resolved.left : resolved.right
  const isCustom = isPage && customBanners !== null
  const anyCustom = resolved.left !== null || resolved.right !== null
  const split = isCustom ? splitSideBanners(customBanners, side) : null

  useLayoutEffect(() => {
    if (!isPage) return undefined
    const stack = stackRef.current
    const saleGap = saleGapRef.current
    const region = stack?.closest('.home-promotion-region--page')
    const sale = region?.querySelector('#home-sale-products')
    if (!stack || !saleGap || !region || !sale) return undefined

    const syncSaleGap = () => {
      const gapTop = saleGap.getBoundingClientRect().top
      const saleBottom = sale.getBoundingClientRect().bottom
      saleGap.style.height = Math.max(0, saleBottom - gapTop) + 'px'

      // Chế độ custom: bỏ cân minHeight 2 card cuối — 2 rail cùng stretch tới
      // đáy region và flex chia đều nên đáy tự thẳng. Chỉ cân ở chế độ fallback.
      if (anyCustom) return
      // Cân đối mép đáy của 2 card cuối cùng hai bên rail
      const leftCards = region.querySelectorAll('.home-promotion-rail--left .home-side-banner')
      const rightCards = region.querySelectorAll('.home-promotion-rail--right .home-side-banner')
      const lastLeft = leftCards[leftCards.length - 1]
      const lastRight = rightCards[rightCards.length - 1]
      if (lastLeft && lastRight) {
        lastLeft.style.minHeight = ''
        lastRight.style.minHeight = ''
        const leftBottom = lastLeft.getBoundingClientRect().bottom
        const rightBottom = lastRight.getBoundingClientRect().bottom
        const diff = leftBottom - rightBottom
        if (diff > 1) {
          lastRight.style.minHeight = Math.round(lastRight.offsetHeight + diff) + 'px'
        } else if (diff < -1) {
          lastLeft.style.minHeight = Math.round(lastLeft.offsetHeight + (-diff)) + 'px'
        }
      }
    }

    syncSaleGap()
    // Stack flex làm mép trên khe sale dịch chuyển sau lần đo đầu, đo lại thêm 1 nhịp.
    const raf = requestAnimationFrame(syncSaleGap)
    window.addEventListener('resize', syncSaleGap)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(syncSaleGap) : null
    observer?.observe(region)
    observer?.observe(sale)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', syncSaleGap)
      observer?.disconnect()
    }
  }, [isPage, products.length, sales.length, customBanners?.length, anyCustom])

  // Chế độ custom thay toàn bộ cột: thẻ đầu và offer mặc định không render,
  // tổng số card trong cột đúng bằng số slot đã resolve, chia trước/sau khe sale.
  if (isCustom) {
    return (
      <div
        className="home-side-banner-stack home-side-banner-stack--custom"
        ref={stackRef}
        style={{ '--home-banner-card-count': customBanners.length }}
      >
        {split.before.map((banner, index) => <SideBannerCard key={banner.productId + '-' + index} banner={banner} index={index} />)}
        <div ref={saleGapRef} className="home-promotion-rail__sale-gap" aria-hidden="true" />
        {split.after.map((banner, index) => <SideBannerCard key={banner.productId + '-' + (split.before.length + index)} banner={banner} index={split.before.length + index} />)}
      </div>
    )
  }

  return (
    <div
      className="home-side-banner-stack"
      ref={stackRef}
      style={{ '--home-banner-card-count': isPage ? (isStore ? 11 : 13) : isIntro ? 3 : 5 }}
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
        <div ref={saleGapRef} className="home-promotion-rail__sale-gap" aria-hidden="true" />
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
