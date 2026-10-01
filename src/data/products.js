/**
 * @codex-vn-doc
 * Tệp: src/data/products.js
 * Mục đích: Dữ liệu sản phẩm frontend được đóng gói khi chạy demo.
 * Thành phần chính: products.
 * Liên kết trực tiếp: ./imported-products.json, ../../shared/products.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import importedProducts from './imported-products.json' with { type: 'json' }
import productDetails from './product-details.json' with { type: 'json' }
import { products as featuredProducts, productDataMeta } from '../../shared/products.js'

// Ghép thông tin nguồn theo ID; không thay thế giá, danh mục, ảnh hay dữ liệu kho.
const detailedProducts = importedProducts.map((product) => {
  const details = productDetails[product.id]
  if (!details) return product
  const facts = Object.entries(details.specifications || {})
    .filter(([label]) => label !== 'Thương hiệu')
    .map(([label, value]) => `${label}: ${value}.`)
  const description = details.description || [
    `${product.name} thuộc danh mục ${product.category}.${details.brand ? ` Thương hiệu được nguồn công bố: ${details.brand}.` : ''}`,
    facts.join(' '),
  ].filter(Boolean).join('\n\n')
  return { ...product, brand: details.brand, specifications: details.specifications, features: details.features?.length ? details.features : product.features, description }
})
export const products = [...featuredProducts, ...detailedProducts]
export { productDataMeta }
