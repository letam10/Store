import SideBannerCard from './SideBannerCard'
import './SideBannerRail.css'

// Một đoạn rail banner: flex column lấp đầy chiều cao vùng neo (height:
// 100%), các thẻ flex: 1 1 0 nên cao bằng nhau tuyệt đối trong đoạn —
// không đo JS, không span, không style height riêng từng thẻ. Trái/phải
// cùng một vùng có cùng chiều cao vùng cha nên tự động thẳng hàng.
// segment="before": đoạn trước sale, neo trong vùng intro.
// segment="after": đoạn sau sale, neo trong vùng catalog sau mục sale.
// offset: số thẻ của đoạn trước cùng bên — để data-banner-id/key của thẻ
// là duy nhất trong cả cột khi slot trùng productId.
export default function SideBannerRail({ side, segment, banners = [], offset = 0 }) {
  return (
    <div
      className={'side-banner-rail__segment side-banner-rail__segment--' + segment}
      data-side={side}
      data-segment={segment}
    >
      {banners.map((banner, index) => (
        <SideBannerCard key={banner.productId + '-' + (offset + index)} banner={banner} index={offset + index} />
      ))}
    </div>
  )
}
