import { useLayoutEffect, useRef, useState } from 'react'
import { computeSideBannerSync, resolveSideBanners } from '../../services/sideBanners'
import HomeSideBanner from './HomeSideBanner'
import './HomePromotionRegion.css'

export default function HomePromotionRegion({ overview, account, products, area = 'intro', appearance = {}, children }) {
  const showRails = area === 'page'
  const regionRef = useRef(null)
  const [saleGapHeight, setSaleGapHeight] = useState(null)

  // Đồng bộ hai rail: tính CHUNG một lần ở region — số hàng mỗi đoạn
  // (rowsBefore/rowsAfter) lấy max của cả hai bên, kèm span bù hàng thiếu
  // cho bên ít banner hơn — rồi truyền cùng một sync xuống cả hai rail,
  // thay vì mỗi rail tự chia tỉ lệ riêng như vòng 1.
  const resolved = showRails ? resolveSideBanners(appearance?.sideBanners, products) : { left: null, right: null }
  const sync = showRails ? computeSideBannerSync(resolved.left, resolved.right) : null

  // Khe sale chỉ đo MỘT lần chung cho cả region: lấy khe của rail trái làm
  // mốc (hai rail dùng chung lưới hàng nên mép trên khe bằng nhau), đặt
  // chiều cao đo được vào biến chung --home-sale-gap-height trên region để
  // cả hai rail cùng áp — không đo riêng từng rail như vòng 1.
  useLayoutEffect(() => {
    if (!showRails) return undefined
    const region = regionRef.current
    if (!region) return undefined
    const sale = region.querySelector('#home-sale-products')
    const gap = region.querySelector('.home-promotion-rail--left .home-promotion-rail__sale-gap')
    if (!sale || !gap) return undefined

    const syncSaleGap = () => {
      const gapTop = gap.getBoundingClientRect().top
      const saleBottom = sale.getBoundingClientRect().bottom
      const next = Math.max(0, Math.round(saleBottom - gapTop))
      setSaleGapHeight((prev) => (prev === null || Math.abs(prev - next) > 1 ? next : prev))
    }

    syncSaleGap()
    // Lưới hàng làm mép trên khe sale dịch chuyển sau lần đo đầu, đo lại thêm 1 nhịp.
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
  }, [showRails, products.length, overview?.sales?.length, sync?.left.beforeCount, sync?.left.afterCount, sync?.right.beforeCount, sync?.right.afterCount])

  return (
    <div
      ref={regionRef}
      className={'home-promotion-region home-promotion-region--' + area}
      style={saleGapHeight === null ? undefined : { '--home-sale-gap-height': saleGapHeight + 'px' }}
    >
      {showRails && <aside
        className="home-promotion-rail home-promotion-rail--left"
        aria-label="Ưu đãi cửa hàng và các nhóm hàng"
      >
        <HomeSideBanner side="left" overview={overview} account={account} products={products} area="page" appearance={appearance} sync={sync} />
      </aside>}
      <div className="home-promotion-region__body">
        {children}
      </div>
      {showRails && <aside
        className="home-promotion-rail home-promotion-rail--right"
        aria-label="Quyền lợi thành viên và tiện ích mua sắm"
      >
        <HomeSideBanner side="right" overview={overview} account={account} products={products} area="page" appearance={appearance} sync={sync} />
      </aside>}
    </div>
  )
}
