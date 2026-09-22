import { getVoucher, getMembershipPlan } from './promotions.js'

// Six equally sized sectors = six equally likely outcomes.
// Repeated "no voucher" sectors explicitly account for the remaining probability.
export function rewardSectors(tier = 'standard') {
  const level = getMembershipPlan(tier).id
  const codes = ['STORE50', null, 'EVERYDAY10', null,
    level === 'standard' ? null : 'VIP100', level === 'elite' ? 'ELITE15' : null]
  const colors = ['#dcebd7', '#f5e8cb', '#d9e9ed', '#eeddd5', '#e3dded', '#dee9e3']
  return codes.map((code, index) => ({
    id: index, code, label: code ? getVoucher(code).label : 'Chúc may mắn',
    short: code === 'STORE50' ? '50K' : code === 'EVERYDAY10' ? '10%' : code === 'VIP100' ? '100K' : code === 'ELITE15' ? '15%' : 'Lần sau',
    color: colors[index], probability: 1 / codes.length,
  }))
}

export function pickSector(random = Math.random, count = 6) {
  const sample = random()
  if (!Number.isInteger(count) || count < 2 || !Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('Invalid wheel sample')
  return Math.floor(sample * count)
}

export function landingRotation(current, index, count = 6) {
  const width = 360 / count
  const target = (360 - (index + 0.5) * width) % 360
  const normalized = ((current % 360) + 360) % 360
  return current + 6 * 360 + ((target - normalized + 360) % 360)
}

export function sectorAtPointer(rotation, count = 6) {
  const angle = ((-rotation % 360) + 360) % 360
  return Math.floor(angle / (360 / count))
}

export function sectorResult(sector) {
  return sector.code
    ? { kind: 'voucher', title: 'Bạn nhận được ' + sector.code, voucher: getVoucher(sector.code), sectorId: sector.id }
    : { kind: 'message', title: 'Chúc bạn may mắn lần sau!', message: 'Kim dừng tại ô không có voucher. Bạn có thể thử lượt tiếp theo.', sectorId: sector.id }
}

export function sectorPath(index, count = 6) {
  const point = (degrees) => {
    const angle = degrees * Math.PI / 180
    return [180 + 170 * Math.sin(angle), 180 - 170 * Math.cos(angle)]
  }
  const start = point(index * 360 / count)
  const end = point((index + 1) * 360 / count)
  return 'M 180 180 L ' + start.join(' ') + ' A 170 170 0 0 1 ' + end.join(' ') + ' Z'
}
