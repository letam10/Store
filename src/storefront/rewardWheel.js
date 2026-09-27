/**
 * @codex-vn-doc
 * Tệp: src/storefront/rewardWheel.js
 * Mục đích: Tính sector, góc quay và kết quả vòng quay may mắn với tỷ lệ ẩn.
 * Thành phần chính: rewardSectors, pickSector, landingRotation, sectorAtPointer, sectorResult, sectorPath.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
const labels = ['Lần sau', 'Lần sau', '100K', 'Lần sau', '20%', 'Lần sau', '100K', 'Lần sau', '100K', 'Lần sau']

// Chức năng rewardSectors: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function rewardSectors() {
  return labels.map((short, id) => ({ id, short, kind: short === '100K' ? 'amount' : short === '20%' ? 'percent' : 'none',
    color: id % 2 ? '#f5e8cb' : '#dcebd7' }))
}

// Chức năng pickSector: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function pickSector(random = Math.random, count = 10) {
  const sample = random()
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!Number.isInteger(count) || count < 2 || !Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('Invalid wheel sample')
  return Math.floor(sample * count)
}

// Chức năng landingRotation: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function landingRotation(current, index, count = 10) {
  const width = 360 / count
  const target = (360 - (index + 0.5) * width) % 360
  const normalized = ((current % 360) + 360) % 360
  return current + 6 * 360 + ((target - normalized + 360) % 360)
}

// Chức năng sectorAtPointer: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function sectorAtPointer(rotation, count = 10) {
  const angle = ((-rotation % 360) + 360) % 360
  return Math.floor(angle / (360 / count))
}

// Chức năng sectorResult: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function sectorResult(sector, voucher = null) {
  return voucher
    ? { kind: 'voucher', title: 'Bạn nhận được ' + voucher.label, voucher, sectorId: sector.id }
    : { kind: 'message', title: 'Chúc bạn may mắn lần sau!', message: 'Lượt quay này chưa có voucher.', sectorId: sector.id }
}

// Chức năng sectorPath: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function sectorPath(index, count = 10) {
  // Chức năng point: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const point = (degrees) => {
    const angle = degrees * Math.PI / 180
    return [180 + 170 * Math.sin(angle), 180 - 170 * Math.cos(angle)]
  }
  const start = point(index * 360 / count)
  const end = point((index + 1) * 360 / count)
  return 'M 180 180 L ' + start.join(' ') + ' A 170 170 0 0 1 ' + end.join(' ') + ' Z'
}
