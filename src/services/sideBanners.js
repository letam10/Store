/**
 * @codex-vn-doc
 * Tệp: src/services/sideBanners.js
 * Mục đích: Chuẩn hóa, chia và resolve cấu hình banner hai bên trang chủ
 * lưu trong appearance.sideBanners (chuỗi JSON hoặc object).
 * Thành phần chính: normalizeSideBanners, resolveSideBanners, splitSideBanners.
 * Liên kết trực tiếp: không có import trực tiếp; HomeSideBanner dùng các hàm này.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó;
 * không đệm thêm sản phẩm, không khử trùng lặp productId, không đổi hợp đồng hàm hiện có.
 */

export const SIDE_BANNER_MAX_PER_SIDE = 20
export const SIDE_BANNER_MIN_PER_SIDE = 5

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
// Bỏ slot không có productId hợp lệ, cắt thừa quá 20 mỗi bên, cắt title 120
// ký tự, note 240 ký tự, chỉ giữ màu #RRGGBB hợp lệ và chuẩn hóa thành chữ hoa.
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

// Chức năng resolveSideBanners: ghép từng slot đã normalize với danh sách
// products đã enrich mà Home.jsx truyền xuống (id, name, price đã áp giảm giá,
// image, category, stockCount, viewCount). Slot trỏ tới sản phẩm không tồn tại
// thì bỏ. KHÔNG đệm thêm sản phẩm nào: render đúng các slot hợp lệ đã lưu.
// Bên nào không còn slot hợp lệ thì trả null để bên đó fallback y như cũ.
// Hai bên độc lập. Tên/giá/ảnh lấy từ sản phẩm, slot.title/note ghi đè.
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
// thành { before, after } quanh khe sale (mục Đang giảm giá full-width).
// Dùng CHUNG một tỉ lệ 4/11 cho cả hai bên (không còn tỉ lệ riêng trái 4/11,
// phải 5/13 như vòng 1): hai bên cùng số lượng thì chia giống hệt nhau, nên
// hàng ngang thẳng nhau; khác số lượng thì computeSideBannerSync bù bằng span.
// Luôn ≥ 1 banner mỗi phía khi cột có ≥ 2 banner.
export function splitSideBanners(banners) {
  const list = Array.isArray(banners) ? banners : []
  if (list.length === 0) return { before: [], after: [] }
  if (list.length === 1) return { before: list.slice(), after: [] }
  const ratio = 4 / 11
  let beforeCount = Math.round(list.length * ratio)
  beforeCount = Math.max(1, Math.min(list.length - 1, beforeCount))
  return { before: list.slice(0, beforeCount), after: list.slice(beforeCount) }
}

// Số mục fallback mặc định của mỗi bên ở area="page", đếm theo đúng JSX
// fallback của HomeSideBanner: trái = thẻ đầu + 2 offer + 1 compact trước
// sale, 7 offer sau sale (tổng 11); phải = thẻ đầu + 2 offer + 2 compact
// trước sale, 8 offer sau sale (tổng 13).
export const FALLBACK_SIDE_BANNER_COUNTS = {
  left: { before: 4, after: 7 },
  right: { before: 5, after: 8 },
}

// Chức năng leadSpanFor: số hàng grid mà mục đầu một đoạn phải span để đoạn
// đó lấp đủ số hàng chung. Bên đủ hàng thì span 1; bên thiếu d hàng thì mục
// đầu span 1 + d, các mục còn lại span 1 — mọi mép thẻ đều rơi đúng đường
// lưới chung, không để trống hàng, đáy đoạn thẳng nhau.
export function leadSpanFor(itemCount, rowCount) {
  if (itemCount <= 0) return 1
  return Math.max(1, rowCount - itemCount + 1)
}

function syncForSide(banners, side) {
  if (Array.isArray(banners)) {
    const split = splitSideBanners(banners)
    return {
      banners,
      before: split.before,
      after: split.after,
      beforeCount: split.before.length,
      afterCount: split.after.length,
      isCustom: true,
    }
  }
  const fallback = FALLBACK_SIDE_BANNER_COUNTS[side]
  return {
    banners: null,
    before: [],
    after: [],
    beforeCount: fallback.before,
    afterCount: fallback.after,
    isCustom: false,
  }
}

// Chức năng computeSideBannerSync: tính CHUNG cấu trúc hàng cho cả hai rail
// từ banner đã resolve của hai bên (null = bên đó fallback mặc định).
// Trả { left, right, rowsBefore, rowsAfter } với rowsBefore =
// max(số banner trước sale trái, phải), rowsAfter tương tự đoạn sau; mỗi bên
// kèm leadBeforeSpan/leadAfterSpan để mục đầu đoạn span bù hàng thiếu.
// HomePromotionRegion tính một lần rồi truyền xuống cả hai HomeSideBanner;
// HomeSideBanner tự tính lại bằng hàm này khi render lẻ không qua region.
export function computeSideBannerSync(leftBanners, rightBanners) {
  const left = syncForSide(leftBanners, 'left')
  const right = syncForSide(rightBanners, 'right')
  const rowsBefore = Math.max(left.beforeCount, right.beforeCount)
  const rowsAfter = Math.max(left.afterCount, right.afterCount)
  const withSpans = (entry) => ({
    ...entry,
    leadBeforeSpan: leadSpanFor(entry.beforeCount, rowsBefore),
    leadAfterSpan: leadSpanFor(entry.afterCount, rowsAfter),
  })
  return { left: withSpans(left), right: withSpans(right), rowsBefore, rowsAfter }
}
