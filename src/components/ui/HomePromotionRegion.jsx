/*
  FILE NOTE
  - Mục đích: Bao bọc vùng hiển thị khuyến mãi và điều phối rail banner hai bên (trước và sau mục sale) tại trang chủ.
  - Liên kết trực tiếp: Store/src/components/ui/SideBannerRail.jsx, Store/src/services/sideBanners.js, Store/src/pages/Home.jsx.
  - Vùng ảnh hưởng khi sửa: Cấu trúc phân đoạn rail banner trang chủ storefront.
*/
import { Children } from 'react'
import { resolveSideBannersWithDefaults, splitSideBanners } from '../../services/sideBanners'
import SideBannerRail from './SideBannerRail'
import './HomePromotionRegion.css'

// Vòng 3 (làm lại từ đầu): cột banner tách thành HAI ĐOẠN ĐỘC LẬP, mỗi đoạn
// neo vào đúng vùng nội dung của nó — KHÔNG còn một cột dài duy nhất, KHÔNG
// đo chiều cao khe sale bằng JS, KHÔNG lưới hàng chung, KHÔNG span bù.
//
// - Đoạn TRƯỚC sale (segment="before"): rail tuyệt đối trong vùng intro
//   (hero + Sản phẩm nổi bật), top ngang hero, bottom đúng mép dưới vùng
//   intro. Render bởi region area="intro".
// - Đoạn SAU sale (segment="after"): rail tuyệt đối trong vùng
//   .home-promotion-region__after — phần catalog sau mục Đang giảm giá —
//   top đúng mép dưới mục sale, kéo dài chạm ngay vạch đường kẻ của section visit.
//   Render bởi region area="catalog"; mục Đang giảm giá full-width nằm
//   GIỮA hai vùng nên tự nhiên ngắt cột.
// - Region area="page" chỉ bọc toàn trang, không render rail nữa.
// - Mỗi đoạn là flex column, height: 100%, các thẻ flex: 1 1 0 nên cao bằng
//   nhau tuyệt đối trong đoạn; trái/phải cùng một vùng có cùng chiều cao
//   vùng cha nên tự động thẳng hàng.
// - Thẻ hero ở giữa trang là nội dung trung tâm, không phải banner cột bên:
//   không động vào. Thẻ hero cũ và các offer cũ KHÔNG còn render trong rail
//   (xem SideBannerRail/SideBannerCard).
export default function HomePromotionRegion({ products, area = 'intro', appearance = {}, children }) {
  const showBeforeRails = area === 'intro'
  const showAfterRails = area === 'catalog'
  const showRails = showBeforeRails || showAfterRails

  // Danh sách banner cuối mỗi bên: cấu hình đã lưu nếu còn slot hợp lệ,
  // không thì banner mặc định mới (mỗi bên 5, tổng 10). Tính một lần cho
  // cả hai bên rồi chia trước/sau sale theo CÙNG một quy tắc.
  const lists = showRails
    ? resolveSideBannersWithDefaults(appearance?.sideBanners, products)
    : { left: [], right: [] }
  const splitLeft = showRails ? splitSideBanners(lists.left) : { before: [], after: [] }
  const splitRight = showRails ? splitSideBanners(lists.right) : { before: [], after: [] }

  if (showAfterRails) {
    // Vùng catalog nhận đúng mục Đang giảm giá và phần sau sale (các hàng catalog,
    // liên kết thành viên, market banner). Phần sau sale bọc trong
    // .home-promotion-region__after (position: relative) để rail đoạn sau
    // neo đúng vào nó, chạm ngay vạch đường kẻ của section.visit-strip.
    const [saleChild, ...afterChildren] = Children.toArray(children)
    return (
      <div className="home-promotion-region home-promotion-region--catalog">
        <div className="home-promotion-region__body">
          {saleChild}
          <div className="home-promotion-region__after">
            {afterChildren}
            <aside
              className="home-promotion-rail home-promotion-rail--left"
              aria-label="Banner sản phẩm bên trái"
            >
              <SideBannerRail
                side="left"
                segment="after"
                banners={splitLeft.after}
                offset={splitLeft.before.length}
                totalCount={lists.left.length}
              />
            </aside>
            <aside
              className="home-promotion-rail home-promotion-rail--right"
              aria-label="Banner sản phẩm bên phải"
            >
              <SideBannerRail
                side="right"
                segment="after"
                banners={splitRight.after}
                offset={splitRight.before.length}
                totalCount={lists.right.length}
              />
            </aside>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={'home-promotion-region home-promotion-region--' + area}>
      {showBeforeRails && <aside
        className="home-promotion-rail home-promotion-rail--left"
        aria-label="Banner sản phẩm bên trái"
      >
        <SideBannerRail side="left" segment="before" banners={splitLeft.before} totalCount={lists.left.length} />
      </aside>}
      <div className="home-promotion-region__body">
        {children}
      </div>
      {showBeforeRails && <aside
        className="home-promotion-rail home-promotion-rail--right"
        aria-label="Banner sản phẩm bên phải"
      >
        <SideBannerRail side="right" segment="before" banners={splitRight.before} totalCount={lists.right.length} />
      </aside>}
    </div>
  )
}
