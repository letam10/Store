/**
 * @codex-vn-doc
 * Tệp: src/data/products.js
 * Mục đích: Dữ liệu sản phẩm frontend được đóng gói khi chạy demo.
 * Thành phần chính: products.
 * Liên kết trực tiếp: ./imported-products.json, ../../shared/products.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import importedProducts from './imported-products.json' with { type: 'json' }
import { products as featuredProducts, productDataMeta } from '../../shared/products.js'

export const products = [...featuredProducts, ...importedProducts]
export { productDataMeta }
