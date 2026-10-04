/**
 * @codex-vn-doc
 * Tệp: src/storefront/promotions.js
 * Mục đích: Hạng thành viên, điểm, giảm giá, voucher và quy tắc giao hàng storefront.
 * Thành phần chính: membershipPlans, getMembershipPlan, tierForPoints.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
export const membershipPlans = Object.freeze([
  { id: 'bronze', title: 'Bronze', name: 'Đồng', badge: 'ĐỒNG', points: 0, discount: 0, multiplier: 1,
    description: 'Hạng mặc định, miễn phí.', benefits: ['Tích 1 điểm cho mỗi 1.000 ₫ hàng hóa đã thanh toán', 'Mỗi 100.000 ₫ đã thanh toán nhận 1 lượt quay'] },
  { id: 'silver', title: 'Silver', name: 'Bạc', badge: 'BẠC', points: 100, discount: 1, multiplier: 1,
    description: 'Mở khóa khi tích đủ 100 điểm.', benefits: ['Tự động giảm thêm 1% khi thanh toán', 'Giữ quyền lợi hạng Đồng'] },
  { id: 'gold', title: 'Gold', name: 'Vàng', badge: 'VÀNG', points: 1000, discount: 2, multiplier: 1.2,
    description: 'Mở khóa khi tích đủ 1.000 điểm.', benefits: ['Giữ nguyên lợi ích hạng Bạc và hạng Đồng', 'Tự động giảm thêm 2% khi thanh toán', 'Tích điểm x1,2', 'Phí giao hàng nội thành theo mức chung 30.000 ₫'] },
  { id: 'diamond', title: 'Diamond', name: 'Kim Cương', badge: 'KIM CƯƠNG', points: 10000, discount: 5, multiplier: 1.5,
    description: 'Mở khóa khi tích đủ 10.000 điểm.', benefits: ['Giữ nguyên lợi ích hạng Vàng, Bạc và hạng Đồng', 'Tự động giảm thêm 5% khi thanh toán', 'Tích điểm x1,5', 'Phí giao hàng theo khu vực áp dụng chung'] },
])

// Chức năng getMembershipPlan: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function getMembershipPlan(id = 'bronze') {
  return membershipPlans.find((plan) => plan.id === id) || membershipPlans[0]
}

// Chức năng tierForPoints: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function tierForPoints(points) {
  return [...membershipPlans].reverse().find((plan) => points >= plan.points)?.id || 'bronze'
}

// Chỉ quảng bá ưu đãi còn dùng được; mức giảm và mã quà tặng lấy từ dữ liệu Store.
export function storePromotionOverview(products = [], wallet = [], account = null, favoriteIds = [], now = Date.now()) {
  const sales = products.filter(product => product.stockCount !== 0 && product.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent || a.price - b.price)
  const favoriteSales = sales.filter(product => favoriteIds.includes(String(product.id)))
  const vouchers = account ? wallet.filter(voucher => new Date(voucher.expiresAt).getTime() > now) : []
  const plan = getMembershipPlan(account?.tier)
  const nextPlan = membershipPlans[membershipPlans.indexOf(plan) + 1] || null
  const points = Number(account?.points || 0)
  return { sales, favoriteSales, vouchers, plan, nextPlan, points,
    maxDiscount: sales[0]?.discountPercent || 0,
    remainingPoints: nextPlan ? Math.max(0, nextPlan.points - points) : 0,
  }
}
