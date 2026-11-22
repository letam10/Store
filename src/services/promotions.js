/*
  FILE NOTE
  - Mục đích: Hạng thành viên, điểm, giảm giá, voucher và quy tắc giao hàng storefront, hỗ trợ cấu hình động từ Admin.
  - Liên kết trực tiếp: src/services/membershipPolicy.js, src/pages/Membership.jsx, src/pages/Account.jsx, src/pages/Checkout.jsx
  - Vùng ảnh hưởng khi sửa: Quyền lợi hạng, chiết khấu và tính điểm trên các trang Storefront.
*/
import { DEFAULT_MEMBERSHIP_POLICY, resolveTierFromPolicy } from './membershipPolicy.js'

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

function tierToPlan(tier) {
  if (!tier) return membershipPlans[0]
  return {
    id: tier.id,
    title: tier.englishLabel || tier.id.toUpperCase(),
    name: tier.name,
    badge: tier.englishLabel || tier.name.toUpperCase(),
    points: tier.minPoints,
    discount: tier.discountPercent,
    multiplier: tier.multiplier,
    description: tier.subtitle,
    benefits: tier.benefits
  }
}

// Chức năng getMembershipPlan: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function getMembershipPlan(id = 'bronze', policy = null) {
  const key = String(id || 'bronze').toLowerCase()
  if (policy && Array.isArray(policy.tiers)) {
    const found = policy.tiers.find((t) => t.id === key)
    if (found) return tierToPlan(found)
  }
  return membershipPlans.find((plan) => plan.id === key) || membershipPlans[0]
}

// Chức năng tierForPoints: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function tierForPoints(points, policy = null) {
  if (policy && Array.isArray(policy.tiers)) {
    return resolveTierFromPolicy(points, policy).id
  }
  return [...membershipPlans].reverse().find((plan) => points >= plan.points)?.id || 'bronze'
}

// Chỉ quảng bá ưu đãi còn dùng được; mức giảm và mã quà tặng lấy từ dữ liệu Store.
export function storePromotionOverview(products = [], wallet = [], account = null, favoriteIds = [], now = Date.now(), policy = null) {
  const sales = products.filter(product => product.stockCount !== 0 && product.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent || a.price - b.price)
  const favoriteSales = sales.filter(product => favoriteIds.includes(String(product.id)))
  const vouchers = account ? wallet.filter(voucher => new Date(voucher.expiresAt).getTime() > now) : []
  const plan = getMembershipPlan(account?.tier, policy)
  const activePlans = policy && Array.isArray(policy.tiers) ? policy.tiers.map(tierToPlan) : membershipPlans
  const currentIdx = activePlans.findIndex((p) => p.id === plan.id)
  const nextPlan = activePlans[currentIdx + 1] || null
  const points = Number(account?.points || 0)
  return { sales, favoriteSales, vouchers, plan, nextPlan, points,
    maxDiscount: sales[0]?.discountPercent || 0,
    remainingPoints: nextPlan ? Math.max(0, nextPlan.points - points) : 0,
  }
}
