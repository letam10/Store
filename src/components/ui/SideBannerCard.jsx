/*
  FILE NOTE
  - Mục đích: Hiển thị thẻ banner sản phẩm hai bên trang chủ; hỗ trợ màu custom riêng (nếu có) hoặc tự động kế thừa màu sắc theme cửa hàng.
  - Liên kết trực tiếp: Store/src/components/ui/SideBannerCard.css, Store/src/components/ui/SideBannerRail.jsx.
  - Vùng ảnh hưởng khi sửa: Cấu trúc thẻ banner sản phẩm hai bên trang chủ và cách áp dụng inline style màu sắc.
*/
import './SideBannerCard.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Thẻ banner sản phẩm mới — MỘT thiết kế duy nhất cho cả hai bên, cả mặc
// định lẫn custom: ảnh + nhãn danh mục + tên (cắt tối đa 2 dòng) + giá +
// ghi chú (nếu có, cắt tối đa 2 dòng) + nút "Xem chi tiết", bấm vào mở
// /products/<id>. Cấu trúc cố định, nội dung không làm thẻ cao/thấp khác
// nhau: không danh sách, không số % khổng lồ, không artwork hero.
// Key và data-banner-id gồm cả index để slot trùng productId không trùng key.
export default function SideBannerCard({ banner, index }) {
  const { product } = banner
  const title = banner.title || product.name
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
      className="side-banner-card"
      href={'/products/' + product.id}
      data-banner-id={banner.productId + '-' + index}
      aria-label={'Xem chi tiết ' + title}
      style={style}
    >
      <div className="side-banner-card__media">
        {product.image && <img src={product.image} alt={product.name} width="240" height="132" loading="lazy" />}
      </div>
      <div className="side-banner-card__body">
        {product.category && <p className="side-banner-card__label">{product.category}</p>}
        <strong className="side-banner-card__name">{title}</strong>
        <b className="side-banner-card__price">{money.format(product.price)}</b>
        {banner.note && <p className="side-banner-card__note">{banner.note}</p>}
      </div>
      <span className="side-banner-card__action">
        Xem chi tiết
        <span aria-hidden="true">↗</span>
      </span>
    </a>
  )
}
