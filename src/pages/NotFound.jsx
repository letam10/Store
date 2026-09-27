/**
 * @codex-vn-doc
 * Tệp: src/pages/NotFound.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: NotFound.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import './Storefront.css'
// Chức năng NotFound: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function NotFound(){return <div className="container not-found"><p className="eyebrow">404</p><h1>Trang không tồn tại</h1><p className="muted">Đường dẫn bạn mở chưa có trong Store.</p><div className="page-actions" style={{justifyContent:'center'}}><a className="button" href="/">Về trang chủ</a></div></div>}
