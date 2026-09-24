import { products as sourceProducts } from '../data/products.js'

const jewelry = /\b(necklace|earrings?|bracelet|pendant|jewelry|gemstone|sapphire|aquamarine)\b/i
const clothing = /\b(dress pump|kitten heel|shoes?|sneakers?|tote|handbag|apparel|jacket)\b/i
const components = /\b(cable|charger|adapter|phone case|mobile cover|connector|battery)\b/i

export function displayCategory(product) {
  if (jewelry.test(product.name)) return 'Trang sức'
  if (clothing.test(product.name) || String(product.id) === '2') return 'Trang phục'
  if (components.test(product.name)) return 'Linh kiện'
  if (product.category === 'Công nghệ') return 'Điện tử'
  return product.category
}

export function enrichProducts(offers = []) {
  const byId = new Map(offers.map((offer) => [String(offer.id), offer]))
  return sourceProducts.map((product, index) => {
    const offer = byId.get(String(product.id))
    const discountPercent = offer?.discountPercent ?? (index >= 4 && index < 12 ? 15 : 0)
    const originalPrice = product.price
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
