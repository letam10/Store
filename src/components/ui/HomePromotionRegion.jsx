import HomeSideBanner from './HomeSideBanner'
import './HomePromotionRegion.css'

export default function HomePromotionRegion({ overview, account, products, area = 'intro', children }) {
  return (
    <div className={'home-promotion-region home-promotion-region--' + area}>
      <aside
        className="home-promotion-rail home-promotion-rail--left"
        aria-label="Ưu đãi cửa hàng và các nhóm hàng"
      >
        <HomeSideBanner side="left" overview={overview} account={account} products={products} area={area} />
      </aside>
      <div className="home-promotion-region__body">
        {children}
      </div>
      <aside
        className="home-promotion-rail home-promotion-rail--right"
        aria-label="Quyền lợi thành viên và tiện ích mua sắm"
      >
        <HomeSideBanner side="right" overview={overview} account={account} products={products} area={area} />
      </aside>
    </div>
  )
}
