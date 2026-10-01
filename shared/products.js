/**
 * @codex-vn-doc
 * Tệp: shared/products.js
 * Mục đích: Nguồn dữ liệu sản phẩm demo dùng chung giữa storefront và backend.
 * Thành phần chính: products, productDataMeta.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
// Nguồn dữ liệu sản phẩm dùng chung cho frontend và backend.
// Đây là dữ liệu demo; không chứa tồn kho hoặc dữ liệu nghiệp vụ thời gian thực.
export const products = Object.freeze([
  {
    id: 1, name: 'Tai nghe Everyday', category: 'Tự Thiết Kế', price: 890000, symbol: '🎧', tone: 'green', label: 'Được yêu thích',
    description: 'Tai nghe Everyday là mẫu thiết kế gọn nhẹ dành cho nhu cầu nghe hằng ngày. Kiểu dáng tối giản giúp tập trung vào trải nghiệm sử dụng và các thao tác điều khiển trực quan.\nMẫu sản phẩm hướng tới việc mang theo và sử dụng thường xuyên trong sinh hoạt. Trước khi chọn mua, cần xác nhận kiểu kết nối và khả năng tương thích với thiết bị của bạn; dữ liệu mẫu hiện chưa công bố các thông số này.',
    features: ['Thiết kế gọn nhẹ, thuận tiện mang theo', 'Điều khiển trực quan, tập trung vào thao tác thường dùng', 'Kiểu dáng tối giản cho sinh hoạt hằng ngày'],
    specifications: { 'Dòng sản phẩm': 'Tai nghe Everyday', 'Thiết kế': 'Gọn nhẹ, tối giản', 'Nhu cầu sử dụng': 'Nghe hằng ngày', 'Kết nối / thời lượng pin': 'Chưa được công bố trong dữ liệu mẫu' },
  },
  {
    id: 2, name: 'Túi Everyday Tote', category: 'Tự Thiết Kế', price: 249000, symbol: '👜', tone: 'sand', label: 'Mới',
    description: 'Everyday Tote là mẫu túi tối giản để mang theo đồ dùng cá nhân khi đi học, đi làm hoặc mua sắm ngắn ngày. Khoang chính rộng và phong cách trung tính giúp sắp xếp đồ dùng theo nhu cầu thường nhật.\nKiểu dáng dễ phối với nhiều trang phục. Hãy đối chiếu kích thước vật dụng định mang theo trước khi chọn mua; chất liệu, kích thước và tải trọng cụ thể chưa được công bố trong dữ liệu mẫu.',
    features: ['Khoang chính rộng để sắp xếp đồ dùng cá nhân', 'Phong cách trung tính, dễ phối trang phục', 'Phù hợp đi học, đi làm hoặc mua sắm ngắn ngày'],
    specifications: { 'Dòng sản phẩm': 'Túi tote', 'Phong cách': 'Tối giản, trung tính', 'Không gian chứa': 'Khoang chính rộng', 'Chất liệu / kích thước / tải trọng': 'Chưa được công bố trong dữ liệu mẫu' },
  },
  {
    id: 3, name: 'Đồng hồ Minimal', category: 'Tự Thiết Kế', price: 1290000, symbol: '⌚', tone: 'blue', label: 'Tối giản',
    description: 'Đồng hồ Minimal tập trung vào mặt hiển thị rõ ràng và phong cách tối giản. Thiết kế dễ đọc giờ, dễ kết hợp với trang phục thường ngày và phù hợp nhiều hoàn cảnh sử dụng.\nMẫu đồng hồ ưu tiên sự đơn giản về hình thức. Loại bộ máy, kích thước mặt, chất liệu dây và khả năng chống nước chưa được công bố; cần xác nhận các thông số này trước khi sử dụng trong môi trường đặc biệt.',
    features: ['Mặt số rõ ràng, thuận tiện xem giờ', 'Thiết kế tối giản, ít chi tiết rườm rà', 'Phong cách linh hoạt cho trang phục hằng ngày'],
    specifications: { 'Dòng sản phẩm': 'Đồng hồ Minimal', 'Thiết kế mặt': 'Tối giản, dễ đọc', 'Phong cách': 'Sử dụng hằng ngày', 'Bộ máy / chống nước / kích thước': 'Chưa được công bố trong dữ liệu mẫu' },
  },
  {
    id: 4, name: 'Ly cà phê Morning', category: 'Tự Thiết Kế', price: 159000, symbol: '☕', tone: 'rose', label: 'Mỗi ngày',
    description: 'Ly Morning được thiết kế cho cà phê, trà và đồ uống nóng trong sinh hoạt hằng ngày. Kiểu dáng đơn giản ưu tiên cảm giác cầm thoải mái và sự thuận tiện khi vệ sinh sau mỗi lần dùng.\nSản phẩm phù hợp với góc làm việc hoặc bàn ăn theo phong cách tối giản. Dữ liệu mẫu chưa nêu dung tích, chất liệu hay khả năng dùng trong lò vi sóng và máy rửa bát; hãy kiểm tra hướng dẫn của sản phẩm trước khi sử dụng các thiết bị này.',
    features: ['Dành cho cà phê, trà và đồ uống hằng ngày', 'Kiểu dáng đơn giản, thuận tiện cầm nắm', 'Dễ vệ sinh sau khi sử dụng'],
    specifications: { 'Dòng sản phẩm': 'Ly cà phê Morning', 'Nhu cầu sử dụng': 'Cà phê, trà, đồ uống nóng', 'Thiết kế': 'Đơn giản, dễ vệ sinh', 'Dung tích / chất liệu': 'Chưa được công bố trong dữ liệu mẫu' },
  },
])

export const productDataMeta = Object.freeze({
  mode: 'demo',
  currency: 'VND',
  hasInventory: false,
})
