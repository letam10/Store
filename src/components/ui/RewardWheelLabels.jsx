import './RewardWheelLabels.css'

export default function RewardWheelLabels({ sector, index, count }) {
  const angle = (index + 0.5) * 360 / count
  const caption = sector.kind === 'none' ? 'May mắn' : 'Voucher'
  const prize = sector.kind === 'none' ? 'lần sau'
    : sector.short === 'Miễn ship' ? 'miễn ship' : sector.short

  return (
    <g
      className="lucky-wheel__labels"
      transform={'rotate(' + angle + ' 180 180)'}
      aria-label={caption + ' ' + prize}
    >
      <text x="180" y="59" textAnchor="middle" className="lucky-wheel__caption">
        {caption}
      </text>
      <text x="180" y="75" textAnchor="middle" className="lucky-wheel__prize">
        {prize}
      </text>
    </g>
  )
}
