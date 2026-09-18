import './Storefront.css'
const stores=[
  {name:'Store Central',address:'12 Nguyễn Huệ, Quận 1, TP.HCM',hours:'08:00 – 22:00',note:'Nhận hàng trực tiếp · Trưng bày đầy đủ'},
  {name:'Store East',address:'88 Võ Văn Ngân, TP. Thủ Đức, TP.HCM',hours:'09:00 – 21:30',note:'Nhận hàng trực tiếp · Hỗ trợ đổi tại quầy'},
  {name:'Store Coast',address:'25 Ba Cu, Vũng Tàu',hours:'08:30 – 21:00',note:'Cửa hàng quy mô nhỏ · Nên kiểm tra hàng trước khi đến'},
]
export default function Locations(){return <div className="container page-shell"><header className="page-head"><div><p className="eyebrow">Địa chỉ</p><h1>Ghé Store khi bạn muốn xem tận tay.</h1></div><p className="muted">Địa chỉ mẫu cho prototype, cần thay bằng dữ liệu doanh nghiệp thật.</p></header><div className="location-grid">{stores.map((store)=><article key={store.name} className="surface location-card"><span className="location-icon">⌖</span><p className="eyebrow">{store.hours}</p><h2>{store.name}</h2><p>{store.address}</p><small>{store.note}</small><div className="page-actions"><a className="button button--soft" href="/contact">Liên hệ cửa hàng</a></div></article>)}</div></div>}
