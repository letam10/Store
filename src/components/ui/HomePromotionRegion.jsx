import HomeSideBanner from './HomeSideBanner'
import './HomePromotionRegion.css'

export default function HomePromotionRegion({ overview, account, products, area = 'intro', appearance = {}, children }) {
  const showRails = area === 'page'
  return (
    <div className={'home-promotion-region home-promotion-region--' + area}>
      {showRails && <aside
        className="home-promotion-rail home-promotion-rail--left"
        aria-label="Ưu đãi cửa hàng và các nhóm hàng"
      >
        <HomeSideBanner side="left" overview={overview} account={account} products={products} area="page" appearance={appearance} />
      </aside>}
      <div className="home-promotion-region__body">
        {children}
      </div>
      {showRails && <aside
        className="home-promotion-rail home-promotion-rail--right"
        aria-label="Quyền lợi thành viên và tiện ích mua sắm"
      >
        <HomeSideBanner side="right" overview={overview} account={account} products={products} area="page" appearance={appearance} />
      </aside>}
    </div>
  )
}
