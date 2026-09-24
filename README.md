# Store — giao diện khách hàng

React + Vite, chỉ chứa frontend dành cho khách. Admin, backend và AI local đã chuyển sang dự án ngang cấp Store-Admin.

## Chạy
Node 24.19.0 và npm 11.17.0 (giữ nguyên runtime đã thống nhất).
```powershell
npm ci
npm run dev
```
Vite chạy cổng 5173 và proxy /api tới 127.0.0.1:3001. Backend được khởi chạy từ Store-Admin bằng npm run dev:api; admin chạy riêng tại cổng 5174.

## Kiểm tra
npm test, npm run lint, npm run build. Thư mục dist là bản frontend để deploy; không chứa code admin, backend, database hoặc model.

## Phân chia
- src/pages/: trang chủ, danh mục, chi tiết, giỏ hàng, checkout, tài khoản, đăng nhập demo, thành viên, phần thưởng, địa chỉ & liên hệ.
- src/components/: layout và thành phần dùng chung.
- src/storefront/design.css và updates.css: giao diện khách responsive, sáng/tối; đăng nhập có bảng màu riêng.
- public/products/: hình minh họa SVG local; không phải ảnh sản phẩm thật.
- shared/: bốn sản phẩm/chính sách demo có sẵn. 200 sản phẩm nhập ở `src/data/imported-products.json`; giá/ưu đãi/tồn kho và lượt xem demo được bổ sung từ API Store-Admin khi API khả dụng.
- src/api/: client chat hỗ trợ, không có client quản trị.
- /admin trên Store trả trang không tìm thấy; dùng Store-Admin để quản trị.

Giỏ hàng, tài khoản, đơn demo, hạng thành viên và voucher chỉ lưu ở trình duyệt. Chỉ sản phẩm được tích chọn mới đi vào checkout; món chưa chọn vẫn ở giỏ. Checkout không thu tiền, không gửi đơn thật. Không dùng tài khoản demo làm cơ chế xác thực production. Admin có API demo cho giảm giá, tồn kho và lượt xem; đây không phải hệ thống bán hàng production.

## Deploy
Xem DEPLOYMENT.md. Đã chuẩn bị fallback SPA trong public/_redirects. Chưa deploy, mở tunnel, thay đổi firewall hay public backend. Giữ API cùng origin qua reverse proxy là phương án mặc định; không điền localhost làm URL backend cho khách trên Internet.

## Git
Giữ nguyên repo/nhánh hiện tại, không tự commit hoặc push. Git sẽ báo deleted cho các file chuyển sang Store-Admin. Store-Admin chưa có remote: hãy kiểm tra và đưa dự án đó vào repo riêng trước khi chia sẻ cho team. File backend cũ, bao gồm phần chỉnh sửa chưa commit, được giữ tại Store-Admin/BACKEND.md và Store-Admin/server/scripts/create-admin.js.
