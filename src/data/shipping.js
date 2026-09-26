export const SHIPPING_DESTINATIONS = Object.freeze([
  ['hanoi', 'Hà Nội'], ['haiphong', 'Hải Phòng'], ['quang-ninh', 'Quảng Ninh'], ['bac-giang', 'Bắc Giang'],
  ['phu-tho', 'Phú Thọ'], ['vinh-phuc', 'Vĩnh Phúc'], ['bac-ninh', 'Bắc Ninh'], ['hai-duong', 'Hải Dương'],
  ['hung-yen', 'Hưng Yên'], ['thai-binh', 'Thái Bình'], ['nam-dinh', 'Nam Định'], ['ninh-binh', 'Ninh Bình'],
  ['ha-nam', 'Hà Nam'], ['lao-cai', 'Lào Cai'], ['yen-bai', 'Yên Bái'], ['tuyen-quang', 'Tuyên Quang'],
  ['ha-giang', 'Hà Giang'], ['cao-bang', 'Cao Bằng'], ['bac-kan', 'Bắc Kạn'], ['lang-son', 'Lạng Sơn'],
  ['thai-nguyen', 'Thái Nguyên'], ['dien-bien', 'Điện Biên'], ['lai-chau', 'Lai Châu'], ['son-la', 'Sơn La'],
  ['hoa-binh', 'Hòa Bình'], ['thanh-hoa', 'Thanh Hóa'], ['nghe-an', 'Nghệ An'], ['ha-tinh', 'Hà Tĩnh'],
  ['quang-binh', 'Quảng Bình'], ['quang-tri', 'Quảng Trị'], ['thua-thien-hue', 'Thừa Thiên Huế'],
  ['da-nang', 'Đà Nẵng'], ['quang-nam', 'Quảng Nam'], ['quang-ngai', 'Quảng Ngãi'], ['binh-dinh', 'Bình Định'],
  ['phu-yen', 'Phú Yên'], ['khanh-hoa', 'Khánh Hòa'], ['ninh-thuan', 'Ninh Thuận'], ['binh-thuan', 'Bình Thuận'],
  ['kon-tum', 'Kon Tum'], ['gia-lai', 'Gia Lai'], ['dak-lak', 'Đắk Lắk'], ['dak-nong', 'Đắk Nông'],
  ['lam-dong', 'Lâm Đồng'], ['binh-phuoc', 'Bình Phước'], ['tay-ninh', 'Tây Ninh'], ['dong-nai', 'Đồng Nai'],
  ['long-an', 'Long An'], ['tien-giang', 'Tiền Giang'], ['ben-tre', 'Bến Tre'], ['tra-vinh', 'Trà Vinh'],
  ['vinh-long', 'Vĩnh Long'], ['dong-thap', 'Đồng Tháp'], ['an-giang', 'An Giang'], ['kien-giang', 'Kiên Giang'],
  ['can-tho', 'Cần Thơ'], ['hau-giang', 'Hậu Giang'], ['soc-trang', 'Sóc Trăng'], ['bac-lieu', 'Bạc Liêu'],
  ['ca-mau', 'Cà Mau'],
])

export const DOMESTIC_REGIONS = Object.freeze([
  ['hcm', 'TP. Hồ Chí Minh · nội thành', '30.000 ₫'],
  ['binh-duong', 'Bình Dương · nội thành', '30.000 ₫'],
  ['ba-ria-vung-tau', 'Bà Rịa - Vũng Tàu · nội thành', '30.000 ₫'],
  ...SHIPPING_DESTINATIONS.map(([id, label]) => ['province:' + id, label, '60.000 ₫']),
])
