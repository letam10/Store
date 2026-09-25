import { products as sourceProducts } from '../data/products.js'

const jewelry = /\b(necklace|earrings?|bracelet|pendant|jewelry|gemstone|sapphire|aquamarine)\b/i
const clothing = /\b(dress pump|kitten heel|shoes?|sneakers?|tote|handbag|apparel|jacket)\b/i
const components = /\b(cable|charger|adapter|phone case|mobile cover|connector|battery)\b/i
const laptop = /\b(laptop|notebook|chromebook|macbook|ultrabook|netbook)\b/i
const food = /\b(coffee|tea|cocoa|chocolate|candy|cookie|biscuit|snack|cereal|food|grocery|groceries|honey|jam|sauce|spice|rice|pasta|water|juice|drink|beverage)\b/i
const household = /\b(lamp|light|table|chair|shelf|cabinet|sofa|blanket|pillow|mirror|curtain|rug|storage|organizer|clock|bed|mattress|bath|towel|vacuum|fan|air purifier|humidifier|iron|kettle|coffee maker|blender|toaster|cookware|dish|mug|bottle|cleaner|basket|furniture|home decor|kitchen)\b/i

export function displayCategory(product) {
  if (laptop.test(product.name)) return 'Laptop'
  if (jewelry.test(product.name)) return 'Trang sức'
  if (food.test(product.name)) return 'Thực phẩm'
  if (clothing.test(product.name) || String(product.id) === '2') return 'Trang phục'
  if (components.test(product.name)) return 'Linh kiện'
  if (product.category === 'Công nghệ') return 'Điện tử'
  if (household.test(product.name) || ['Nhà cửa', 'Nhà bếp', 'Đời sống', 'Ngoài trời', 'Đồ gia dụng'].includes(product.category)) return 'Đồ gia dụng'
  return product.category
}

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
      stockCount: offer?.stockCount ?? null,
      viewCount: offer?.viewCount ?? 0,
    }
  })
}

export function mostViewed(products, count = 4) {
  return products.filter((product) => product.stockCount !== 0)
    .map((product, index) => ({ product, index }))
    .sort((a, b) => b.product.viewCount - a.product.viewCount || a.index - b.index)
    .slice(0, count).map(({ product }) => product)
}

export function similarProducts(products, product, count = 4) {
  return products.filter((item) => String(item.id) !== String(product.id) && item.category === product.category && item.stockCount !== 0).slice(0, count)
}
