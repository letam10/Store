/*
  FILE NOTE
  - Mục đích: Hiển thị một phân đoạn dải banner (trước hoặc sau sale), tự động điều chỉnh gap gấp đôi khi số banner ít.
  - Liên kết trực tiếp: Store/src/components/ui/SideBannerCard.jsx, Store/src/components/ui/HomePromotionRegion.jsx.
  - Vùng ảnh hưởng khi sửa: Danh sách thẻ banner và khoảng cách giữa các thẻ trong dải banner hai bên trang chủ.
*/
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
// Khi số lượng banner ít (như mỗi bên 10 cái hoặc ít hơn): các thẻ cách nhau
// một khoảng trống dài gấp đôi (gap từ 20px lên 40px) để banner thoáng đãng, không bị xấu.
export default function SideBannerRail({ side, segment, banners = [], offset = 0, totalCount }) {
  const isSparse = typeof totalCount === 'number'
    ? totalCount <= 12
    : (segment === 'before' ? banners.length <= 4 : banners.length <= 6)

  return (
    <div
      className={
        'side-banner-rail__segment side-banner-rail__segment--' + segment +
        (isSparse ? ' side-banner-rail__segment--sparse' : '')
      }
      data-side={side}
      data-segment={segment}
      data-sparse={isSparse ? 'true' : 'false'}
    >
      {banners.map((banner, index) => (
        <SideBannerCard key={banner.productId + '-' + (offset + index)} banner={banner} index={offset + index} />
      ))}
    </div>
  )
}
