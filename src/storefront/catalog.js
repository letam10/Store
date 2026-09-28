/**
 * @codex-vn-doc
 * Tệp: src/storefront/catalog.js
 * Mục đích: Chuẩn hóa catalog, nhóm danh mục, xếp hạng xem nhiều và sản phẩm tương tự.
 * Thành phần chính: displayCategory, enrichProducts, mostViewed, similarProducts.
 * Liên kết trực tiếp: ../data/products.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { products as sourceProducts } from '../data/products.js'

const jewelry = /\b(necklace|earrings?|bracelet|pendant|jewelry|gemstone|sapphire|aquamarine)\b/i
const clothing = /\b(dress pump|kitten heel|shoes?|sneakers?|tote|handbag|apparel|jacket)\b/i
const components = /\b(cable|charger|adapter|phone case|mobile cover|connector|battery)\b/i
const laptop = /\b(laptop|notebook|chromebook|macbook|ultrabook|netbook)\b/i
const household = /\b(lamp|light|table|chair|shelf|cabinet|sofa|blanket|pillow|mirror|curtain|rug|storage|organizer|clock|bed|mattress|bath|towel|vacuum|fan|air purifier|humidifier|iron|kettle|coffee maker|blender|toaster|cookware|dish|mug|bottle|cleaner|basket|furniture|home decor|kitchen)\b/i
const legacyCategoryMap = Object.freeze({
  'Công nghệ': 'Điện tử',
  'Điện tử': 'Điện tử',
  Laptop: 'Laptop',
  'Linh kiện': 'Linh kiện',
  'Làm đẹp': 'Làm đẹp',
  'Trang phục': 'Trang phục',
  'Trang sức': 'Trang sức',
  'Nhà cửa': 'Đồ gia dụng',
  'Nhà bếp': 'Đồ gia dụng',
  'Đời sống': 'Đồ gia dụng',
  'Ngoài trời': 'Đồ gia dụng',
  'Đồ gia dụng': 'Đồ gia dụng',
})
// Các nhãn này là danh mục chuẩn đã được quản trị lưu trong dữ liệu.
// Giữ nguyên nhãn chuẩn; chỉ dùng từ khóa tên cho dữ liệu cũ/chưa phân loại.
const canonicalCategories = new Set(['Điện tử', 'Trang phục', 'Trang sức', 'Laptop', 'Linh kiện', 'Làm đẹp', 'Đồ gia dụng', 'Tự Thiết Kế'])

// Chức năng displayCategory: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function displayCategory(product) {
  const category = String(product?.category || '')
  // Danh mục cũ cần chuẩn hóa trước khi kiểm tra từ khóa trong tên sản phẩm.
  if (category === 'Thực phẩm') return 'Tự Thiết Kế'
  if (legacyCategoryMap[category]) return legacyCategoryMap[category]
  // Danh mục chuẩn là nguồn chính; không để tên sản phẩm ghi đè phân loại đã lưu.
  if (canonicalCategories.has(category)) return category
  if (laptop.test(product.name)) return 'Laptop'
  if (jewelry.test(product.name)) return 'Trang sức'
  if (clothing.test(product.name) || String(product.id) === '2') return 'Trang phục'
  if (components.test(product.name)) return 'Linh kiện'
  if (household.test(product.name)) return 'Đồ gia dụng'
  return category
}

// Chức năng enrichProducts: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function enrichProducts(offers = []) {
  const byId = new Map(offers.map((offer) => [String(offer.id), offer]))
  const sourceIds = new Set(sourceProducts.map((product) => String(product.id)))
  const apiProducts = offers.filter((product) => product && product.name && !sourceIds.has(String(product.id)))
  return [...sourceProducts, ...apiProducts].map((product, index) => {
    const offer = byId.get(String(product.id))
    const discountPercent = offer?.discountPercent ?? (index >= 4 && index < 12 ? 15 : 0)
    const originalPrice = product.originalPrice ?? product.price
    return {
      ...product,
      category: displayCategory(product),
      originalPrice,
      discountPercent,
      price: Math.round(originalPrice * (100 - discountPercent) / 1000) * 10,
      // The API normally supplies the managed stock value. Keep the same
      // default for the local demo fallback so guests cannot add unlimited
      // quantities when the backend is temporarily unavailable.
      stockCount: offer?.stockCount ?? 20,
      viewCount: offer?.viewCount ?? 0,
    }
  })
}

// Chức năng mostViewed: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function mostViewed(products, count = 4) {
  return products.filter((product) => product.stockCount !== 0)
    .map((product, index) => ({ product, index }))
    .sort((a, b) => b.product.viewCount - a.product.viewCount || a.index - b.index)
    .slice(0, count).map(({ product }) => product)
}

// Chức năng similarProducts: lấy ngẫu nhiên sản phẩm còn hàng cùng danh mục,
// giúp thanh gợi ý không lặp mãi một thứ tự cố định.
export function similarProducts(products, product, count = 20) {
  if (!Array.isArray(products) || !product || count <= 0) return []
  const category = displayCategory(product)
  const candidates = products.filter((item) => (
    item && String(item.id) !== String(product.id) && displayCategory(item) === category && item.stockCount !== 0
  ))
  // Fisher–Yates tạo thứ tự ngẫu nhiên với mọi số lượng đầu vào, không làm thay đổi mảng gốc.
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]]
  }
  return candidates.slice(0, count)
}
