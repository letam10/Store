# Cloud storefront / local admin

## Hai ứng dụng độc lập
Store: npm run build -> dist, frontend khách trên static host.
Store-Admin: npm run dev (5174); npm run dev:api (3001, loopback). Không upload dự án admin, database, server, ai hoặc .env lên static host.

## Kết nối production đề xuất
Trình duyệt khách -> https://shop.example/api/support/... -> reverse proxy cùng origin trên cloud -> tunnel HTTPS có xác thực -> backend local.
Admin -> Vite proxy riêng -> cùng backend local.
Ollama chỉ được backend gọi trên loopback, không public cổng 11434.

- Static host phải có SPA fallback cho /products, /cart, /account...; public/_redirects dành cho host hỗ trợ cú pháp đó.
- Route /api phải được xử lý TRƯỚC SPA fallback, không trả index.html cho API.
- Chỉ cho phép các route khách hiện có: POST /api/support/chat, GET /api/support/conversations/:id. Xác nhận route mới trước khi mở thêm.
- Chặn toàn bộ /api/admin ở public gateway. Admin vẫn có session/CSRF backend nhưng không nên công khai cổng quản trị.
- Proxy phải giữ cookie, Set-Cookie, phương thức, body và stream NDJSON; không cache/buffer stream. Áp dụng giới hạn request, rate limit và timeout phù hợp ở gateway.
- Tunnel cần kiểm soát truy cập giữa cloud và local. Không mở thẳng cổng router, không tắt xác thực để thử.
- Khi terminate HTTPS bên ngoài, đặt COOKIE_SECURE=true ở backend; giữ cookie HttpOnly và SameSite=Lax cho phương án cùng origin.
- Giữ VITE_API_BASE_URL trống với proxy cùng origin. Đây là cấu hình đã tương thích backend hiện tại.
- VITE_API_BASE_URL khác origin chỉ là điểm cấu hình client: chưa hỗ trợ end-to-end với backend này. Cần bổ sung allowlist CORS, credential và chính sách cookie trước; không dùng wildcard hoặc bật bừa SameSite=None.
- Không đưa token tunnel, khóa API hay mật khẩu vào biến VITE_* vì chúng được đóng gói công khai.
- Máy local tắt/mất mạng thì chat/API không hoạt động; catalog demo static vẫn tải.

## Chưa thực hiện
Chưa chọn tài khoản cloud, domain, tunnel hay deploy. Các bước này cần chủ dự án quyết định và cấp quyền riêng. Chưa có sản phẩm/đơn hàng/database production đồng bộ; việc tách giao diện không biến các luồng demo thành nghiệp vụ thật.
