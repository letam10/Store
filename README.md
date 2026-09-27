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
- shared/: bốn sản phẩm/chính sách demo có sẵn. Catalog hiện có đúng 2.000 sản phẩm phía khách: 4 sản phẩm nền và 1.996 sản phẩm nhập tại `src/data/imported-products.json`; dữ liệu mới được phân nhóm Điện tử, Trang phục, Trang sức (gộp phụ kiện), Laptop và Làm đẹp cùng các nhóm dữ liệu cũ.
- Nguồn demo: Amazon Berkeley Objects cho ảnh/metadata household (CC BY 4.0 theo trang nguồn) và DummyJSON cho placeholder products; giá VND, tồn kho và ưu đãi chỉ dùng để thử giao diện.
- src/api/: client chat hỗ trợ, không có client quản trị.
- /admin trên Store trả trang không tìm thấy; dùng Store-Admin để quản trị.

Giỏ hàng, tài khoản, đơn demo, hạng thành viên và voucher chỉ lưu ở trình duyệt. Chỉ sản phẩm được tích chọn mới đi vào checkout; món chưa chọn vẫn ở giỏ. Checkout không thu tiền, không gửi đơn thật. Không dùng tài khoản demo làm cơ chế xác thực production. Admin có API demo cho giảm giá, tồn kho và lượt xem; đây không phải hệ thống bán hàng production.

## Deploy
Xem DEPLOYMENT.md. Đã chuẩn bị fallback SPA trong public/_redirects. Chưa deploy, mở tunnel, thay đổi firewall hay public backend. Giữ API cùng origin qua reverse proxy là phương án mặc định; không điền localhost làm URL backend cho khách trên Internet.

## Git
Store và Store-Admin là hai repository tách riêng; giữ `package-lock.json`, không commit `node_modules`, `dist`, `.env` hoặc model/dataset local. Catalog storefront được lưu trong `src/data/imported-products.json`; dữ liệu SQLite local của Admin được tái tạo từ `Store-Admin/server/data/catalog-products.json` khi backend khởi động.
