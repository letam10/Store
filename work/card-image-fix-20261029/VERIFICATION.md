# Kiểm tra sửa khung ảnh 2026-10-29
- Nguyên nhân card trang cuối: catalog-grid flex-grow:1 kéo giãn hàng theo sidebar.
- Sửa grid không grow; khung card vuông, ảnh fill 100%, bỏ padding và zoom.
- Áp dụng ảnh card, chi tiết, thumbnail, gallery, giỏ/gợi ý, tìm kiếm, hero và ưu đãi.
- Trình duyệt thực tế: trang 34/34 có 5 card gọn; ảnh phủ kín; trang chi tiết có ảnh phủ kín frame.
- Build thành công. Test toàn bộ có lỗi cấp phát ArrayBuffer ở checkout; chạy riêng lại để phân biệt lỗi tài nguyên.
- Chưa kiểm tra trực quan giỏ hàng/yêu thích có đăng nhập.
