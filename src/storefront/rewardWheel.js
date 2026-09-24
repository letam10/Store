const labels = ['Lần sau', 'Lần sau', '100K', 'Lần sau', '20%', 'Lần sau', '100K', 'Lần sau', '100K', 'Lần sau']

export function rewardSectors() {
  return labels.map((short, id) => ({ id, short, kind: short === '100K' ? 'amount' : short === '20%' ? 'percent' : 'none',
    color: id % 2 ? '#f5e8cb' : '#dcebd7' }))
}

export function pickSector(random = Math.random, count = 10) {
  const sample = random()
  if (!Number.isInteger(count) || count < 2 || !Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('Invalid wheel sample')
  return Math.floor(sample * count)
}

export function landingRotation(current, index, count = 10) {
  const width = 360 / count
  const target = (360 - (index + 0.5) * width) % 360
  const normalized = ((current % 360) + 360) % 360
  return current + 6 * 360 + ((target - normalized + 360) % 360)
}

export function sectorAtPointer(rotation, count = 10) {
  const angle = ((-rotation % 360) + 360) % 360
  return Math.floor(angle / (360 / count))
}

export function sectorResult(sector, voucher = null) {
  return voucher
    ? { kind: 'voucher', title: 'Bạn nhận được ' + voucher.label, voucher, sectorId: sector.id }
    : { kind: 'message', title: 'Chúc bạn may mắn lần sau!', message: 'Lượt quay này chưa có voucher.', sectorId: sector.id }
}

export function sectorPath(index, count = 10) {
  const point = (degrees) => {
    const angle = degrees * Math.PI / 180
    return [180 + 170 * Math.sin(angle), 180 - 170 * Math.cos(angle)]
  }
  const start = point(index * 360 / count)
  const end = point((index + 1) * 360 / count)
  return 'M 180 180 L ' + start.join(' ') + ' A 170 170 0 0 1 ' + end.join(' ') + ' Z'
}
