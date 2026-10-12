# Store — giao diện khách hàng

React + Vite dành cho khách. Admin và backend nằm tại C:\Users\TAM\source\repos\Store-Admin.

## Chạy
Node 24.19.0 và npm 11.17.0 (giữ nguyên runtime đã thống nhất).
```powershell
npm ci
npm run dev
```
Vite chạy cổng 5173 và proxy /api tới ASP.NET Core ở 127.0.0.1:3010.
Mở solution Store-Admin.slnx tại đường dẫn mới, chọn profile Store Admin và bấm F5.
Host quản lý Node nội bộ và kiểm tra/khởi động Ollama. React Admin mới nằm trong frontend, cổng 5174.

## Kiểm tra
npm test, npm run lint, npm run build. Thư mục dist là bản frontend để deploy; không chứa code admin, backend, database hoặc model.

## Phân chia
- src/pages/: trang chủ, danh mục, chi tiết, giỏ hàng, checkout, tài khoản, đăng nhập demo, thành viên, phần thưởng, địa chỉ & liên hệ.
- src/components/: layout và thành phần dùng chung.
- src/storefront/design.css và updates.css: giao diện khách responsive, sáng/tối; đăng nhập có bảng màu riêng.
- public/products/: hình minh họa SVG local; không phải ảnh sản phẩm thật.
- shared/: bốn sản phẩm/chính sách demo có sẵn. Catalog hiện có 2.000 sản phẩm phía khách: 4 sản phẩm nền và 1.996 sản phẩm nhập; 35 mục dữ liệu cũ cùng 4 sản phẩm nền được phân vào `Tự Thiết Kế`. Snapshot đã chuẩn hóa các nhãn cũ vào tám danh mục hiển thị để số liệu phía khách trùng với API.
- Nguồn demo: Amazon Berkeley Objects cho ảnh/metadata household (CC BY 4.0 theo trang nguồn) và DummyJSON cho placeholder products; giá VND, tồn kho và ưu đãi chỉ dùng để thử giao diện.
- src/api/: client chat hỗ trợ, không có client quản trị.
- /admin trên Store trả trang không tìm thấy; dùng Store-Admin để quản trị.

Giỏ hàng giữ ở trình duyệt; tài khoản, voucher và đơn đã xác nhận thanh toán được lưu qua backend mới.
Chỉ sản phẩm được tích chọn mới đi vào checkout; món chưa chọn vẫn ở giỏ.
Phiên QR xem trước chưa lưu đơn, hết 2 phút hoặc thoát sẽ trở về form checkout đang có.
Chế độ demo mô phỏng thanh toán; chuyển khoản thực cần đối soát theo cấu hình admin.

## Deploy
Xem DEPLOYMENT.md. Đã chuẩn bị fallback SPA trong public/_redirects. Chưa deploy, mở tunnel, thay đổi firewall hay public backend. Giữ API cùng origin qua reverse proxy là phương án mặc định; không điền localhost làm URL backend cho khách trên Internet.

## Git
Giữ `package-lock.json`; không commit `node_modules`, `dist`, `.env`, database hoặc model/dataset local.
Catalog dự phòng nằm trong `src/data/imported-products.json`; API dùng PGlite ở backend/server/data/pgdata
thuộc solution mới. STORE_ADMIN_ROOT có thể đổi đường dẫn nguồn backend khi chạy test trên máy khác.
