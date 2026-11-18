/*
  FILE NOTE
  - Mục đích: Chuẩn hóa, chia và resolve cấu hình banner hai bên trang chủ lưu trong appearance.sideBanners (hỗ trợ tùy chỉnh từ 10 đến 30 banner mỗi bên).
  - Liên kết trực tiếp: Store/src/components/ui/HomePromotionRegion.jsx, Store/test/side-banners.test.js, Store/test/side-banners-render.test.js.
  - Vùng ảnh hưởng khi sửa: Dữ liệu và số lượng banner hai bên trang chủ storefront khách hàng.
*/

/**
 * @codex-vn-doc
 * Tệp: src/services/sideBanners.js
 * Mục đích: Chuẩn hóa, chia và resolve cấu hình banner hai bên trang chủ
 * lưu trong appearance.sideBanners (chuỗi JSON hoặc object), và chọn banner
 * mặc định mới khi chưa có cấu hình.
 * Thành phần chính: normalizeSideBanners, resolveSideBanners,
 * splitSideBanners, defaultSideBanners, resolveSideBannersWithDefaults.
 * Liên kết trực tiếp: không có import trực tiếp; HomePromotionRegion dùng
 * các hàm này.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó;
 * không đệm thêm sản phẩm vào cấu hình đã lưu, không khử trùng lặp productId.
 */

// Mỗi bên 5–30 banner, tùy chỉnh trong Quản trị từ 10–30 banner mỗi bên.
// Cấu hình lưu tối đa 30 banner mỗi bên (giữ 30 slot đầu, theo đúng thứ tự đã lưu).
export const SIDE_BANNER_MIN_PER_SIDE = 5
export const SIDE_BANNER_MAX_PER_SIDE = 30
// Số banner mặc định mỗi bên khi chưa có cấu hình: 5 (tổng 10).
export const DEFAULT_SIDE_BANNER_COUNT = 5

// Tên tương thích bổ sung dùng chung với Store-Admin
export const SIDE_BANNER_MIN_COUNT = SIDE_BANNER_MIN_PER_SIDE
export const SIDE_BANNER_MAX_COUNT = SIDE_BANNER_MAX_PER_SIDE
export const SIDE_BANNER_DEFAULT_COUNT = DEFAULT_SIDE_BANNER_COUNT
export const SIDE_BANNERS_MAX = SIDE_BANNER_MAX_PER_SIDE

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function normalizeColor(value) {
  if (typeof value !== 'string') return ''
  const color = value.trim()
  return HEX_COLOR.test(color) ? color.toUpperCase() : ''
}

function normalizeText(value, maxLength) {
  if (value === null || value === undefined) return ''
  return String(value).trim().slice(0, maxLength)
}

function normalizeSlot(slot) {
  if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return null
  const productId = slot.productId === null || slot.productId === undefined
    ? ''
    : String(slot.productId).trim()
  if (!productId) return null
  return {
    productId,
    title: normalizeText(slot.title, 120),
    note: normalizeText(slot.note, 240),
    bg: normalizeColor(slot.bg),
    text: normalizeColor(slot.text),
    accent: normalizeColor(slot.accent),
  }
}

function normalizeSide(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeSlot)
    .filter(Boolean)
    .slice(0, SIDE_BANNER_MAX_PER_SIDE)
}

// Chức năng normalizeSideBanners: parse appearance.sideBanners dạng chuỗi JSON
// hoặc object thành { version: 1, left: [...], right: [...] }.
// Bỏ slot không có productId hợp lệ, kẹp tối đa 30 mỗi bên (giữ 30 slot đầu
// theo thứ tự đã lưu), cắt title 120 ký tự, note 240 ký tự, chỉ giữ màu #RRGGBB
// hợp lệ và chuẩn hóa thành chữ hoa.
// KHÔNG khử trùng lặp productId: giữ đúng như cấu hình đã lưu.
export function normalizeSideBanners(value) {
  let parsed = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return { version: 1, left: [], right: [] }
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return { version: 1, left: [], right: [] }
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { version: 1, left: [], right: [] }
  }
  return {
    version: 1,
    left: normalizeSide(parsed.left),
    right: normalizeSide(parsed.right),
  }
}

// Chức năng clampSideBannerCount: kẹp số lượng mỗi bên về 5–30; số không
// hợp lệ (NaN, chuỗi, null, undefined) thì dùng mặc định 5.
export function clampSideBannerCount(count) {
  const number = Number(count)
  if (!Number.isFinite(number)) return DEFAULT_SIDE_BANNER_COUNT
  return Math.max(
    SIDE_BANNER_MIN_PER_SIDE,
    Math.min(SIDE_BANNER_MAX_PER_SIDE, Math.floor(number)),
  )
}

// Chức năng resolveSideBanners: ghép từng slot đã normalize với danh sách
// products đã enrich mà Home.jsx truyền xuống (id, name, price đã áp giảm giá,
// image, category, stockCount, viewCount, discountPercent). Slot trỏ tới
// sản phẩm không tồn tại thì bỏ. KHÔNG đệm thêm sản phẩm nào: render đúng
// các slot hợp lệ đã lưu. Bên nào không còn slot hợp lệ thì trả null để bên
// đó dùng banner mặc định mới. Hai bên độc lập. Tên/giá/ảnh lấy từ sản phẩm,
// slot.title/note ghi đè.
export function resolveSideBanners(value, products = []) {
  const normalized = normalizeSideBanners(value)
  const byId = new Map()
  for (const product of Array.isArray(products) ? products : []) {
    if (product && product.id !== null && product.id !== undefined) {
      byId.set(String(product.id), product)
    }
  }
  const resolveSide = (slots) => {
    const resolved = []
    for (const slot of slots) {
      const product = byId.get(slot.productId)
      if (!product) continue
      resolved.push({
        ...slot,
        product,
        title: slot.title || product.name,
        note: slot.note,
      })
    }
    return resolved.length ? resolved : null
  }
  return { left: resolveSide(normalized.left), right: resolveSide(normalized.right) }
}

// Chức năng splitSideBanners: chia danh sách banner đã resolve của một bên
// thành { before, after } quanh mục Đang giảm giá full-width. Một quy tắc
// CHUNG cho cả hai bên, không tỉ lệ riêng, không span bù:
// before = max(1, round(N * 0.35)), kẹp ≤ N - 1 khi N ≥ 2, vì vùng intro
// (hero + Sản phẩm nổi bật) ngắn hơn nhiều so với vùng catalog sau sale.
// Bảng chia: N=5 → 2/3, N=6 → 2/4, N=7 → 2/5, N=8 → 3/5, N=9 → 3/6,
// N=10 → 4/6. N=1 → 1/0, N=0 → 0/0.
export function splitSideBanners(banners) {
  const list = Array.isArray(banners) ? banners : []
  if (list.length === 0) return { before: [], after: [] }
  if (list.length === 1) return { before: list.slice(), after: [] }
  let beforeCount = Math.round(list.length * 0.35)
  beforeCount = Math.max(1, Math.min(list.length - 1, beforeCount))
  return { before: list.slice(0, beforeCount), after: list.slice(beforeCount) }
}

// Quy tắc chọn banner mặc định mới (khi chưa lưu cấu hình), cố định và lặp
// lại được:
// 0. Chỉ xét sản phẩm còn hàng (stockCount !== 0); sản phẩm chưa có
//    stockCount thì giữ lại.
// 1. Sắp xếp sản phẩm: đang giảm giá trước (discountPercent > 0, % cao
//    trước), rồi tới lượt xem cao (viewCount giảm dần); thiếu
//    discountPercent/viewCount thì tính là 0; hòa thì giữ thứ tự gốc.
// 2. Lấy 2 × N sản phẩm đầu danh sách đã sắp xếp.
// 3. Trái lấy sản phẩm ở vị trí chẵn (0, 2, 4, ...), phải lấy vị trí lẻ
//    (1, 3, 5, ...) — hai bên cùng một danh sách, lệch nhau một vị trí nên
//    không trùng nhau hoàn toàn mà vẫn đều có sản phẩm giảm giá/xem nhiều.
// Mỗi banner mặc định có cùng dạng với banner đã resolve để dùng chung một
// component thẻ: { productId, title: '', note: '', bg: '', text: '',
// accent: '', product } (title/note rỗng → thẻ lấy tên sản phẩm).
export function defaultSideBanners(products = [], count = DEFAULT_SIDE_BANNER_COUNT) {
  const wanted = clampSideBannerCount(count)
  const list = (Array.isArray(products) ? products : [])
    .filter((product) => product && product.id !== null && product.id !== undefined)
    // Banner mặc định không trỏ tới sản phẩm hết hàng (stockCount === 0);
    // sản phẩm chưa có stockCount thì giữ lại như cũ.
    .filter((product) => product.stockCount !== 0)
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const discountA = Number(a.product.discountPercent) || 0
      const discountB = Number(b.product.discountPercent) || 0
      const onSale = (discountB > 0) - (discountA > 0)
      if (onSale !== 0) return onSale
      if (discountB !== discountA) return discountB - discountA
      const views = (Number(b.product.viewCount) || 0) - (Number(a.product.viewCount) || 0)
      if (views !== 0) return views
      return a.index - b.index
    })
    .slice(0, wanted * 2)
    .map(({ product }) => ({
      productId: String(product.id),
      title: '',
      note: '',
      bg: '',
      text: '',
      accent: '',
      product,
    }))
  return {
    left: list.filter((_, index) => index % 2 === 0),
    right: list.filter((_, index) => index % 2 === 1),
  }
}

// Chức năng resolveSideBannersWithDefaults: danh sách banner cuối cùng để
// render cho mỗi bên — cấu hình đã lưu (đã resolve) nếu bên đó còn slot hợp
// lệ, còn không thì banner mặc định mới. Trả về { left: [...], right: [...] }
// luôn là mảng (không null) để rail render thẳng không cần nhánh fallback.
export function resolveSideBannersWithDefaults(value, products = [], count = DEFAULT_SIDE_BANNER_COUNT) {
  const resolved = resolveSideBanners(value, products)
  const defaults = defaultSideBanners(products, count)
  return {
    left: resolved.left ?? defaults.left,
    right: resolved.right ?? defaults.right,
  }
}
