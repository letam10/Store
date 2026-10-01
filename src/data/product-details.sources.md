# Dữ liệu chi tiết sản phẩm

Bổ sung ngày 01/10/2026 theo `sourceId` và `sourceUrl` của từng bản ghi trong `imported-products.json`.

- 1.811 sản phẩm Amazon Berkeley Objects qua [Mock Store API](https://store.halukaksoy.dev/docs). Giữ thông tin ghi công **Amazon Berkeley Objects (CC BY 4.0)** của danh mục nguồn.
- 185 sản phẩm từ [DummyJSON](https://dummyjson.com/docs/products).

`product-details.json` chỉ chứa thương hiệu, mô tả, đặc điểm và thông số. Mã, tên, giá, danh mục, ảnh, tồn kho và giảm giá vẫn lấy từ bản ghi gốc. Mô tả/đặc điểm tiếng nước ngoài được giữ theo nguồn, không tự suy đoán cấu hình hay dịch sai thông số. Giá và tồn kho trong danh mục là dữ liệu mẫu.

Khối lượng và kích thước chỉ có đơn vị khi nguồn công bố. Các trường số của DummyJSON không ghi đơn vị được đánh dấu rõ. Thông tin bảo hành, giao hàng, đánh giá khách hàng và chính sách bán hàng từ nguồn ngoài không được nhập làm chính sách của Store.
