# Tiếp nối tái tạo ảnh sản phẩm Store — 2026-10-26

Thư mục này tiếp nối đợt tạo ảnh tại `work/product-image-rebuild-20261025`.

## Mục tiêu

- Hoàn thành 167 sản phẩm còn thiếu trong `missing-products.json`.
- Giữ ảnh gốc trong `images` ở vị trí sau ảnh AI mới.
- Ảnh mới không chứa chữ do mô hình tạo; chữ tiếng Việt, danh mục, giá và CTA được chèn bằng Pillow.
- Chỉ cập nhật `shared/catalog-manifest.json` sau khi đủ 1.000 ảnh hợp lệ.

## Quy trình

1. `prepare_missing.py` tạo `items.json` và prompt riêng cho từng sản phẩm.
2. Mỗi ảnh AI được lưu vào `generated-originals/` rồi chạy `register_generated.py`.
3. `validate_assets.py` kiểm tra đủ target, kích thước, WebP đọc được và ảnh cũ còn trong manifest nguồn.
4. `finalize_manifest.py` cập nhật manifest Store và Store-Admin, giữ ảnh cũ từ vị trí phụ thứ hai.

Không chạy bước cuối nếu còn ảnh thiếu hoặc ảnh lỗi.
