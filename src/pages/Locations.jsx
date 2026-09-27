/**
 * @codex-vn-doc
 * Tệp: src/pages/Locations.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Locations.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import './Storefront.css'
const stores=[
  {name:'Store Central',address:'12 Nguyễn Huệ, Quận 1, TP.HCM',hours:'08:00 – 22:00',note:'Nhận hàng trực tiếp · Trưng bày đầy đủ'},
  {name:'Store East',address:'88 Võ Văn Ngân, TP. Thủ Đức, TP.HCM',hours:'09:00 – 21:30',note:'Nhận hàng trực tiếp · Hỗ trợ đổi tại quầy'},
  {name:'Store Coast',address:'25 Ba Cu, Vũng Tàu',hours:'08:30 – 21:00',note:'Cửa hàng quy mô nhỏ · Nên kiểm tra hàng trước khi đến'},
]
// Chức năng Locations: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Locations(){return <div className="container page-shell"><header className="page-head"><div><p className="eyebrow">Địa chỉ</p><h1>Ghé Store khi bạn muốn xem tận tay.</h1></div><p className="muted">Địa chỉ mẫu cho prototype, cần thay bằng dữ liệu doanh nghiệp thật.</p></header><div className="location-grid">{stores.map((store)=><article key={store.name} className="surface location-card"><span className="location-icon">⌖</span><p className="eyebrow">{store.hours}</p><h2>{store.name}</h2><p>{store.address}</p><small>{store.note}</small><div className="page-actions"><a className="button button--soft" href="/contact">Liên hệ cửa hàng</a></div></article>)}</div></div>}
