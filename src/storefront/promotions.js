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

export function getMembershipPlan(id = 'bronze') {
  return membershipPlans.find((plan) => plan.id === id) || membershipPlans[0]
}

export function tierForPoints(points) {
  return [...membershipPlans].reverse().find((plan) => points >= plan.points)?.id || 'bronze'
}
