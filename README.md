# Store — giao diện khách hàng

Dự án nằm tại `D:\Học Tập\Website_React\Store`. Giao diện quản trị và backend C# nằm ở repo anh em `../Store-Admin`. Hai repo giữ nguyên vị trí và lịch sử Git.

## Chạy local

Runtime theo dự án: Node 24.19.0, npm 11.17.0. Cài dependency bằng `npm ci` khi máy chưa có.

1. Tại `../Store-Admin`, chạy `npm run dev:api` để mở ASP.NET Core + SQL Server trên `http://127.0.0.1:5000`.
2. Tại Store, chạy `npm run dev`, mở `http://127.0.0.1:5173`.
3. Nếu cần quản trị, chạy `npm run dev` tại Store-Admin và mở cổng 5174.

Cả hai frontend gọi `/api`; Vite proxy đến 5000. `VITE_API_TARGET` có thể đổi đích backend. Bản Node/PGlite ở `C:\Users\TAM\source\repos\Store-Admin` là bản lịch sử, không phải backend mặc định hiện tại. SQL Server và cấu hình kết nối phải sẵn sàng để dùng các chức năng có dữ liệu thật.

Có thể mở `../Store-Development.code-workspace` trong VS Code để thấy hai repo và handoff cùng lúc.

## Vị trí chức năng

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/api/` | Gọi HTTP, cookie/CSRF, chat NDJSON, thông báo lỗi và kiểm tra form |
| `src/assets/` | Asset được import trong mã |
| `src/components/layout/` | Header và Footer |
| `src/components/ui/` | Thẻ sản phẩm, dropdown, banner, chat, form và 2FA |
| `src/components/commerce/` | Checkout, đơn hàng, QR và thông báo thanh toán |
| `src/context/i18n.js` | LanguageContext, từ điển và hook useLanguage hiện có |
| `src/data/` | Snapshot sản phẩm, chi tiết, phí giao hàng và dữ liệu banner/thông báo |
| `src/pages/` | Các trang khách hàng |
| `src/services/` | Catalog, giỏ hàng/router, khuyến mại và phục hồi chat |
| `src/utils/` | Hàm chọn voucher, hình học vòng quay, timer và sự kiện dropdown |
| `src/styles/` | Các lớp CSS toàn ứng dụng; CSS riêng component vẫn ở cạnh component |
| `shared/` | Manifest catalog, theme và chính sách nền |
| `public/` | Asset phục vụ nguyên đường dẫn URL, ảnh catalog và SPA fallback |
| `test/` | Kiểm thử Node và component qua môi trường DOM mô phỏng |
| `work/` | Công cụ/hồ sơ lịch sử; không phải mã chạy frontend |

Không cài Redux chỉ để giống sơ đồ thư mục. Khi có custom hook mới, đặt trong `src/hooks/`; không cần tạo module rỗng. `App.jsx` đang quản lý route và phần lớn state bằng React hooks.

## Catalog và dữ liệu

Manifest runtime hiện có **500 sản phẩm: 4 nền + 496 nhập**; nguồn dự phòng `src/data/imported-products.json` giữ 1.996 bản ghi. `shared/catalog-manifest.json` phải đồng bộ với repo Admin. Asset hiện gồm SVG và ảnh raster local; không nên gọi toàn bộ là SVG hoặc ảnh sản phẩm thương mại thật.

Nguồn demo có Amazon Berkeley Objects và DummyJSON; ghi nhận nguồn ở `src/data/product-details.sources.md` và `../Store-Admin/PRODUCT_IMPORT.md`. Giá, tồn kho và ưu đãi mẫu không phải cam kết kinh doanh.

Giỏ hàng lưu theo phiên khách/tài khoản trong trình duyệt. Tài khoản, voucher, yêu thích và đơn hàng gọi backend C#. Checkout chỉ dùng sản phẩm được chọn; phiên QR xem trước chưa đồng nghĩa đã lưu/thu tiền. Thanh toán demo và báo chuyển khoản cần phân biệt với đối soát thực.

## Kiểm tra

```powershell
npm run lint
npm run build
node --max-old-space-size=4096 --test --test-concurrency=1 test/*.test.js
```

Chạy test nối tiếp giúp hạn chế cấp phát bộ nhớ đồng thời của các fixture giao diện. Build/test frontend không chứng minh SQL Server, email, OAuth, thanh toán hoặc Ollama đang hoạt động.

## Git và bàn giao

Giữ `package-lock.json`; không commit dependency, `dist`, credential, database hoặc model. Trạng thái Git trước khi dọn được ghi riêng trong `D:\Học Tập\RaSoat_React_20261107\handoff\HANDOFF.md`. Ảnh gốc `work/**/generated-originals/` và thư mục preview được bỏ qua; ảnh runtime trong `public/products/` vẫn được theo dõi.

Ngày 07/11/2026 đã sắp xếp module, cập nhật đường dẫn và dọn staging theo yêu cầu. Các script catalog cần thiết vẫn được lưu trong Git; ảnh gốc xử lý được giữ local. Chỉ commit/push theo yêu cầu của chủ dự án.

## Triển khai

Xem `DEPLOYMENT.md` cho ghi chú cloud lịch sử. Backend local hiện hành dùng cổng **5000**. Chưa xác minh cấu hình public gateway, tunnel hay production; không tự deploy hoặc public backend.
