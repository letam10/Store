import { useState } from 'react'
import './Storefront.css'

const latitude = 10.3460
const longitude = 107.0843
const zoom = 13
const tileSize = 256
const mapScale = 2 ** zoom
const centerX = (longitude + 180) / 360 * mapScale * tileSize
const radians = latitude * Math.PI / 180
const centerY = (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * mapScale * tileSize
const centerTileX = Math.floor(centerX / tileSize)
const centerTileY = Math.floor(centerY / tileSize)
const tiles = Array.from({ length: 15 }, (_, index) => {
  const x = centerTileX + index % 5 - 2
  const y = centerTileY + Math.floor(index / 5) - 1
  return { x, y, left: x * tileSize - centerX, top: y * tileSize - centerY }
})

function MapPreview() {
  return <div className="contact-map-preview" role="img" aria-label="Bản đồ ghim trung tâm Vũng Tàu, Việt Nam">
    {tiles.map((tile) => <img key={tile.x + '-' + tile.y} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" width="256" height="256" loading="lazy" style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }} />)}
    <span className="contact-map-pin" aria-hidden="true">⌖</span>
    <a className="contact-map-open" href="https://www.openstreetmap.org/?mlat=10.3460&mlon=107.0843#map=14/10.3460/107.0843" target="_blank" rel="noopener noreferrer">Mở bản đồ tương tác ↗</a>
    <a className="contact-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
  </div>
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  function submit(event) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Địa chỉ & liên hệ</p><h1>Luôn gần bạn, dù ở đâu.</h1></div><p className="muted">Thông tin liên hệ và vị trí hiện là dữ liệu mẫu cho giao diện.</p></header>
    <div className="contact-location-layout">
      <section className="surface contact-map-card"><div className="contact-map-card__head"><div><p className="eyebrow">Vị trí mặc định</p><h2>Vũng Tàu, Việt Nam</h2><p>Bản đồ đang ghim trung tâm thành phố, không phải địa chỉ cửa hàng đã xác minh.</p></div><a href="https://www.openstreetmap.org/?mlat=10.3460&mlon=107.0843#map=14/10.3460/107.0843" target="_blank" rel="noopener noreferrer">Mở bản đồ ↗</a></div><MapPreview /></section>
      <section className="surface info-card contact-info"><p className="eyebrow">Kênh hỗ trợ</p><h2>Trò chuyện theo cách bạn thích.</h2><p className="muted">Hộp chat góc màn hình hỗ trợ câu hỏi nhanh. Đơn hàng và địa chỉ cửa hàng thật cần được nhân viên xác nhận.</p><div className="contact-list"><a href="mailto:support@example.com">✉ support@example.com</a><a href="tel:+84000000000">☎ 0000 000 000</a><span>◷ 08:00–21:00 · Giờ demo</span></div><p className="contact-demo-warning">Email và số điện thoại là ví dụ, chưa phải kênh hỗ trợ thật.</p></section>
    </div>
    <form className="surface info-card contact-form" onSubmit={submit}><p className="eyebrow">Gửi lời nhắn</p><h2>Bạn cần hỗ trợ điều gì?</h2><div className="form-grid"><label className="field"><span>Họ tên</span><input name="name" autoComplete="name" required /></label><label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label><label className="field field--wide"><span>Nội dung</span><textarea name="message" rows="5" required placeholder="Mô tả điều bạn cần hỗ trợ…" /></label></div><button className="button" type="submit">Gửi yêu cầu demo</button>{submitted && <p className="form-success" role="status">Đã ghi nhận trên giao diện demo. Chưa gửi dữ liệu tới backend.</p>}</form>
  </div>
}
