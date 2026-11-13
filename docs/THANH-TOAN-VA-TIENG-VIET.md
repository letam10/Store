# Thanh toán và nội dung tiếng Việt

- QR nhận trạng thái từ API mỗi 3 giây; API đối soát ngân hàng qua SePay. Chỉ trạng thái đã trả tiền từ máy chủ mới mở màn hình **Thanh toán thành công** tại `/checkout?order=...` và dọn đúng các món đã mua. Báo đã chuyển tiền không tạo thành công giả.
- Checkout không liệt kê các phiên cũ. Mở **Tài khoản → Theo dõi các phiên chưa hoàn tất** để xem tiếp phiên hoặc gửi thông tin hỗ trợ. Đóng QR không xóa khoản đã chuyển.
- Trạng thái thanh toán và giao hàng độc lập. Đã thanh toán + Đang chuẩn bị nghĩa là cửa hàng đã nhận tiền và đang chuẩn bị hàng.
- Google đăng nhập có bốn trạng thái: đang kiểm tra, sẵn sàng, chưa bật, không kết nối được máy chủ. Mất backend không bị gắn nhãn nhầm là chưa cấu hình. Website thường chạy cổng 5173; cổng 5197 chỉ là môi trường QA nếu người phát triển mở riêng.
- Catalog có tên tiếng Việt ngắn; thương hiệu và mã mẫu nằm trong mô tả, vẫn tìm được qua ô tìm kiếm. ID, giá, tồn, ảnh và dữ liệu chứng từ đã mua không đổi theo tên mới.
- Mã giảm giá, thông báo nhập liệu, trạng thái và ngày đơn cũ dùng tiếng Việt. Nội dung khách tự nhập, mã giao dịch và tên riêng trong thông số được giữ nguyên.

Backend cùng thư mục gốc ở repo Store-Admin. Hướng dẫn AI/menu, SePay và email nằm trong `Store-Admin/docs`. Phải cập nhật cả hai repo để đồng bộ giao diện và dữ liệu.

Kiểm chứng ngày 13/11/2026: `npm test` đạt 96 bài, `npm run lint` và `npm run build` thành công. Đã kiểm bằng trình duyệt luồng QR chờ → máy chủ xác nhận → màn hình thành công, không về trang chủ và không còn danh sách phiên cũ trong checkout. Bộ kiểm thử SePay ở backend gồm 48 tình huống nhận tiền, trùng giao dịch, sai tiền, sai mã, quá hạn, thiếu hàng và khoản bù đổi hàng.
