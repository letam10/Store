import './RewardWheelLabels.css'

export default function RewardWheelLabels({ sector, index, count }) {
  const angle = (index + 0.5) * 360 / count
  const freeShipping = sector.short === 'Miễn ship'
  const caption = sector.kind === 'none' ? 'May mắn' : freeShipping ? 'Giao hàng' : 'Giảm giá'
  const prize = sector.kind === 'none' ? 'lần sau'
    : freeShipping ? 'miễn phí' : sector.short === '100K' ? '100.000đ' : sector.short

  return (
    <g
      className="lucky-wheel__labels"
      transform={'rotate(' + angle + ' 180 180)'}
      aria-label={caption + ' ' + prize}
    >
      <text x="180" y="59" textAnchor="middle" className="lucky-wheel__caption">
        {caption}
      </text>
      <text x="180" y="75" textAnchor="middle" className="lucky-wheel__prize" style={prize === '100.000đ' ? { fontSize: 12 } : undefined}>
        {prize}
      </text>
    </g>
  )
}
