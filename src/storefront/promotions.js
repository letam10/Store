export const membershipPlans = Object.freeze([
  { id: 'bronze', name: 'Đồng', badge: 'ĐỒNG', points: 0, discount: 0, multiplier: 1,
    description: 'Hạng mặc định, miễn phí.', benefits: ['Tích 1 điểm cho mỗi 1.000 ₫ hàng hóa đã thanh toán', 'Mỗi 100.000 ₫ đã thanh toán nhận 1 lượt quay'] },
  { id: 'silver', name: 'Bạc', badge: 'BẠC', points: 100, discount: 1, multiplier: 1,
    description: 'Mở khóa khi tích đủ 100 điểm.', benefits: ['Tự động giảm thêm 1% khi thanh toán', 'Giữ quyền lợi hạng Đồng'] },
  { id: 'gold', name: 'Vàng', badge: 'VÀNG', points: 1000, discount: 2, multiplier: 1.2,
    description: 'Mở khóa khi tích đủ 1.000 điểm.', benefits: ['Tự động giảm thêm 2% khi thanh toán', 'Tích điểm x1,2', 'Miễn phí giao hàng trong thành phố của Store'] },
  { id: 'diamond', name: 'Kim Cương', badge: 'KIM CƯƠNG', points: 10000, discount: 5, multiplier: 1.5,
    description: 'Mở khóa khi tích đủ 10.000 điểm.', benefits: ['Tự động giảm thêm 5% khi thanh toán', 'Tích điểm x1,5', 'Miễn phí giao hàng toàn quốc'] },
])

export function getMembershipPlan(id = 'bronze') {
  return membershipPlans.find((plan) => plan.id === id) || membershipPlans[0]
}

export function tierForPoints(points) {
  return [...membershipPlans].reverse().find((plan) => points >= plan.points)?.id || 'bronze'
}
