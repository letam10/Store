// Nguồn dữ liệu sản phẩm dùng chung cho frontend và backend.
// Đây là dữ liệu demo; không chứa tồn kho hoặc dữ liệu nghiệp vụ thời gian thực.
export const products = Object.freeze([
  { id: 1, name: 'Tai nghe Everyday', category: 'Công nghệ', price: 890000, symbol: '🎧', tone: 'green', label: 'Được yêu thích' },
  { id: 2, name: 'Túi Everyday Tote', category: 'Phụ kiện', price: 249000, symbol: '👜', tone: 'sand', label: 'Mới' },
  { id: 3, name: 'Đồng hồ Minimal', category: 'Phụ kiện', price: 1290000, symbol: '⌚', tone: 'blue', label: 'Tối giản' },
  { id: 4, name: 'Ly cà phê Morning', category: 'Đời sống', price: 159000, symbol: '☕', tone: 'rose', label: 'Mỗi ngày' },
])

export const productDataMeta = Object.freeze({
  mode: 'demo',
  currency: 'VND',
  hasInventory: false,
})
