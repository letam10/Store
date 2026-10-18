import { useLayoutEffect, useRef } from 'react'
import { membershipPlans } from '../../storefront/promotions'
import HomeBannerArtwork from './HomeBannerArtwork'
import HomeBannerOffers from './HomeBannerOffers'
import './HomeSideBanner.css'

export default function HomeSideBanner({ side, overview, account, products, area }) {
  const stackRef = useRef(null)
  const saleGapRef = useRef(null)
  const { sales, maxDiscount, plan, points } = overview
  const isStore = side === 'left'
  const bestPlan = membershipPlans.at(-1)
  const discount = account ? plan.discount : bestPlan.discount
  const hasSale = sales.length > 0
  const isIntro = area === 'intro' || area === 'page'
  const isPage = area === 'page'
  const title = isStore ? 'Món cần. Giá tốt.' : account ? 'Hạng ' + plan.name : 'Thêm nhiều quyền lợi.'

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
    }

    syncSaleGap()
    window.addEventListener('resize', syncSaleGap)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(syncSaleGap) : null
    observer?.observe(region)
    observer?.observe(sale)
    return () => {
      window.removeEventListener('resize', syncSaleGap)
      observer?.disconnect()
    }
  }, [isPage, products.length, sales.length])

  return (
    <div
      className="home-side-banner-stack"
      ref={stackRef}
      style={{ '--home-banner-card-count': isPage ? 10 : isIntro ? 3 : 5 }}
    >
      {isIntro && <a
        className={'home-side-banner home-side-banner--' + (isStore ? 'store' : 'member')}
        href={isStore ? '#home-sale-products' : '/membership'}
        data-banner-id={isStore ? 'store' : 'member'}
        aria-label={title + '. ' + (isStore ? 'Xem khu giá tốt' : 'Xem quyền lợi thành viên')}
      >
        <div className="home-side-banner__identity">
          <p className="home-side-banner__brand">store.</p>
          <span className="home-side-banner__edition">{isStore ? 'MỖI NGÀY' : 'MEMBER'}</span>
        </div>
        <HomeBannerArtwork kind={isStore ? 'store' : 'member'} />
        <p className="home-side-banner__kicker">{isStore ? 'CHỌN ĐIỀU THIẾT THỰC' : 'GẮN BÓ CÙNG STORE'}</p>
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
        <div ref={saleGapRef} className="home-promotion-rail__sale-gap" aria-hidden="true" />
        <HomeBannerOffers side={side} overview={overview} account={account} products={products} offset={2} count={7} />
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
