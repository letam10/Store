import HomeSideBanner from './HomeSideBanner'
import './HomePromotionRegion.css'

export default function HomePromotionRegion({ overview, account, children }) {
  return (
    <div className="home-promotion-region">
      <aside className="home-promotion-rail home-promotion-rail--left" aria-label="Banner cửa hàng và giá tốt">
        <HomeSideBanner side="left" overview={overview} account={account} />
      </aside>
      <div className="home-promotion-region__body">
        {children}
      </div>
      <aside className="home-promotion-rail home-promotion-rail--right" aria-label="Banner thành viên và quà tặng">
        <HomeSideBanner side="right" overview={overview} account={account} />
      </aside>
    </div>
  )
}
