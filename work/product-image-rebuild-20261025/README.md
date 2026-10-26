# Tái tạo ảnh sản phẩm Store — 2026-10-25

Phạm vi: tạo một ảnh AI riêng cho từng sản phẩm trong `shared/catalog-manifest.json` (1.000 sản phẩm), đặt ảnh mới làm ảnh chính và giữ ảnh hiện có từ vị trí phụ thứ hai trở đi.

Quy tắc:

- ID, tên, danh mục, giá, mô tả và dữ liệu nghiệp vụ không thay đổi.
- Ảnh mới dùng tên `public/products/ai-generated/<id>.webp`.
- `images` sau cùng có ảnh mới ở vị trí 0, sau đó là toàn bộ ảnh cũ theo thứ tự, loại trùng.
- Ảnh mới là banner quảng cáo theo ngôn ngữ các poster mẫu: chủ thể sản phẩm ở phải hoặc trung tâm, vùng chữ rõ ràng, ánh sáng điện ảnh, nền bối cảnh phù hợp danh mục. Tỉ lệ được chọn theo hình dáng chủ thể, không ép toàn bộ ảnh về 16:9.
- Chữ tên sản phẩm, danh mục, giá và CTA được chèn sau khi tạo ảnh bằng font hỗ trợ tiếng Việt để giữ đúng nội dung; AI không tự sinh chữ trong ảnh.
- Dùng phong cách theo danh mục: electronics, household, beauty, laptop, components, apparel, jewelry và designed.
- Mọi lần tạo được ghi trong `progress.json`; ảnh phải được kiểm tra tồn tại, mở được và có kích thước hợp lệ trước khi cập nhật manifest.

Quy trình an toàn:

1. Tạo prompt manifest từ `shared/catalog-manifest.json`.
2. Tạo ảnh AI theo từng ID và lưu bản gốc tạm cùng ảnh WebP tối ưu.
3. Kiểm tra 1.000 ID, đường dẫn và ảnh cũ.
4. Cập nhật manifest dùng chung nếu toàn bộ ảnh đạt.
5. Chạy kiểm tra catalog, test/lint/build phù hợp.
6. Commit bằng tiếng Việt và push `main` theo yêu cầu người dùng.

`progress.json` là nhật ký tác vụ; không chứa bí mật.
