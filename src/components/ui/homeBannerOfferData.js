const categoryHref = category => '/products?category=' + encodeURIComponent(category)

const categoryOffers = [
  {
    id: 'laptop',
    kind: 'tech',
    label: 'GÓC CÔNG NGHỆ',
    title: 'Laptop mỗi ngày',
    note: 'Chọn laptop đồng hành cùng việc học, công việc và những ý tưởng mới.',
    details: [
      'Khám phá nhiều mẫu trong danh mục',
      'Xem thông tin và mức giá từng mẫu',
    ],
    action: 'Chọn laptop',
    href: categoryHref('Laptop'),
  },
  {
    id: 'home',
    kind: 'home',
    label: 'CHĂM CHÚT TỔ ẤM',
    title: 'Gọn nhà, tiện bếp',
    note: 'Thêm những vật dụng thiết thực để chăm chút góc bếp và không gian sống.',
    details: [
      'Tìm món phù hợp cho gia đình',
      'Khám phá đồ dùng mỗi ngày',
    ],
    action: 'Khám phá ngay',
    href: categoryHref('Đồ gia dụng'),
  },
  {
    id: 'electronics',
    kind: 'electronics',
    label: 'NHỊP SỐ MỖI NGÀY',
    title: 'Kết nối cuộc sống',
    note: 'Khám phá thiết bị điện tử và tìm lựa chọn phù hợp với nhịp sống của bạn.',
    details: [
      'Xem ảnh và thông tin sản phẩm',
      'Lọc theo nhu cầu và mức giá',
    ],
    action: 'Xem điện tử',
    href: categoryHref('Điện tử'),
  },
  {
    id: 'fashion',
    kind: 'fashion',
    label: 'PHONG CÁCH RIÊNG',
    title: 'Mặc điều bạn thích',
    note: 'Làm mới tủ đồ với những lựa chọn để thể hiện phong cách của riêng bạn.',
    details: [
      'Khám phá danh mục trang phục',
      'Xem từng mẫu trước khi chọn',
    ],
    action: 'Xem trang phục',
    href: categoryHref('Trang phục'),
  },
  {
    id: 'jewelry',
    kind: 'jewelry',
    label: 'ĐIỂM NHẤN TINH TẾ',
    title: 'Lấp lánh nét riêng',
    note: 'Một điểm nhấn nhỏ cho mỗi ngày, một lựa chọn để thể hiện cá tính riêng.',
    details: [
      'Khám phá những mẫu trang sức',
      'Tìm điểm nhấn hợp phong cách',
    ],
    action: 'Xem trang sức',
    href: categoryHref('Trang sức'),
  },
  {
    id: 'components',
    kind: 'components',
    label: 'GÓC PHỤ KIỆN',
    title: 'Thêm tiện ích nhỏ',
    note: 'Khám phá linh kiện và phụ kiện để tìm món phù hợp cho thiết bị của bạn.',
    details: [
      'Xem kỹ thông tin từng món',
      'Chọn theo danh mục và mức giá',
    ],
    action: 'Xem linh kiện',
    href: categoryHref('Linh kiện'),
  },
  {
    id: 'beauty',
    kind: 'beauty',
    label: 'CHĂM SÓC BẢN THÂN',
    title: 'Góc làm đẹp',
    note: 'Dành chút thời gian cho bản thân và khám phá những lựa chọn làm đẹp.',
    details: [
      'Xem sản phẩm trong danh mục',
      'Đọc thông tin trước khi mua',
    ],
    action: 'Xem làm đẹp',
    href: categoryHref('Làm đẹp'),
  },
  {
    id: 'design',
    kind: 'design',
    label: 'CẢM HỨNG SÁNG TẠO',
    title: 'Dấu ấn của bạn',
    note: 'Tìm cảm hứng mới từ danh mục Tự Thiết Kế và chọn món mang dấu ấn riêng.',
    details: [
      'Khám phá những lựa chọn sáng tạo',
      'Xem từng món trong cửa hàng',
    ],
    action: 'Xem thiết kế',
    href: categoryHref('Tự Thiết Kế'),
  },
  {
    id: 'popular',
    kind: 'popular',
    label: 'ĐƯỢC QUAN TÂM',
    title: 'Cùng khám phá',
    note: 'Khám phá những món được quan tâm trong cửa hàng, xếp theo lượt xem thực tế.',
    details: [
      'Danh sách sắp theo lượt xem',
      'Khám phá thông tin từng sản phẩm',
    ],
    action: 'Xem nhiều nhất',
    href: '/products?sort=popular',
  },
]

export function homeBannerOffers(side, overview, account, products = []) {
  if (side === 'left') return categoryOffers.map(offer => {
    const category = new URLSearchParams(offer.href.split('?')[1]).get('category')
    // Ảnh quảng cáo lấy từ sản phẩm còn bán, thuộc đúng danh mục của liên kết.
    const product = products.find(item => item.stockCount !== 0 && item.image
      && (!category || item.category === category))
    return { ...offer, product }
  })

  // Overview đã lọc mã hết hạn; chỉ đếm voucher phí ship trong danh sách này.
  const shippingCount = overview.vouchers.filter(voucher => voucher.scope === 'shipping').length

  return [
    {
      id: 'wheel',
      kind: 'wheel',
      label: 'THỬ VẬN MAY',
      title: 'Quà hàng hóa',
      note: account ? Number(account.spinCredits || 0) + ' lượt · Chung hai vòng quay'
        : 'Tích lượt từ đơn đã thanh toán.',
      details: [
        'Dùng lượt đã tích để thử vận may',
        'Xem phần thưởng trong trang May mắn',
      ],
      action: 'Mở vòng quay',
      href: '/rewards',
    },
    {
      id: 'shipping',
      kind: 'shipping',
      label: 'ƯU ĐÃI GIAO HÀNG',
      title: 'Voucher phí ship',
      note: shippingCount ? shippingCount + ' mã phí ship còn hạn trong ví.' : 'Nhận mã qua vòng quay phí ship.',
      details: [
        'Xem giá trị và hạn dùng từng mã',
        'Chọn mã phù hợp khi thanh toán',
      ],
      action: shippingCount ? 'Xem ví ưu đãi' : 'Khám phá quà ship',
      href: '/rewards',
    },
    {
      id: 'favorites',
      kind: 'favorites',
      label: 'LƯU CHO LẦN SAU',
      title: 'Góc yêu thích',
      note: 'Lưu những món bạn quan tâm để dễ tìm lại và tiếp tục lựa chọn vào lần sau.',
      details: [
        'Gặp lại sản phẩm đã lưu',
        'Đăng nhập để xem danh sách của bạn',
      ],
      action: 'Xem yêu thích',
      href: '/favorites',
    },
    {
      id: 'orders',
      kind: 'orders',
      label: 'ĐỒNG HÀNH CÙNG BẠN',
      title: 'Đơn hàng của bạn',
      note: 'Theo dõi lịch sử mua sắm và trạng thái đơn hàng ngay trong tài khoản.',
      details: [
        'Xem thông tin từng đơn hàng',
        'Theo dõi quá trình xử lý đơn',
      ],
      action: 'Xem tài khoản',
      href: '/account',
    },
    {
      id: 'points',
      kind: 'points',
      artwork: 'member',
      label: 'TÍCH LŨY MỖI NGÀY',
      title: 'Điểm thành viên',
      note: account ? Number(overview.points || 0).toLocaleString('vi-VN') + ' điểm đang tích lũy.'
        : 'Đăng nhập để xem điểm của bạn.',
      details: [
        'Xem điểm và hạng thành viên',
        'Khám phá quyền lợi theo từng hạng',
      ],
      action: 'Xem quyền lợi',
      href: '/membership',
    },
    {
      id: 'wallet',
      kind: 'wallet',
      label: 'ƯU ĐÃI CỦA BẠN',
      title: 'Mở ví voucher',
      note: account ? overview.vouchers.length + ' mã còn hạn trong ví.' : 'Đăng nhập để xem ví voucher.',
      details: [
        'Xem ưu đãi hàng hóa và phí ship',
        'Đọc điều kiện của từng voucher',
      ],
      action: 'Xem ví của tôi',
      href: '/account',
    },
    {
      id: 'sale',
      kind: 'sale',
      label: 'KHÁM PHÁ ƯU ĐÃI',
      title: 'Góc giá tốt',
      note: overview.sales.length ? overview.sales.length + ' sản phẩm đang giảm giá.'
        : 'Xem danh mục ưu đãi hiện tại.',
      details: [
        'Xem mức giảm đang được áp dụng',
        'Khám phá giá hiện tại của từng món',
      ],
      action: 'Xem ưu đãi',
      href: '/products?discount=1',
    },
    {
      id: 'contact',
      kind: 'contact',
      label: 'KẾT NỐI VỚI STORE',
      title: 'Luôn sẵn thông tin',
      note: 'Tìm địa chỉ, bản đồ và các kênh liên hệ của cửa hàng khi bạn cần thêm thông tin.',
      details: [
        'Xem địa chỉ và hướng dẫn đến cửa hàng',
        'Tìm kênh liên hệ phù hợp',
      ],
      action: 'Xem liên hệ',
      href: '/contact',
    },
    {
      id: 'cart',
      kind: 'cart',
      label: 'SẴN SÀNG MUA SẮM',
      title: 'Giỏ hàng của bạn',
      note: 'Xem lại những món đã chọn, điều chỉnh số lượng và chuẩn bị cho bước thanh toán.',
      details: [
        'Kiểm tra sản phẩm và số lượng',
        'Chọn những món muốn thanh toán',
      ],
      action: 'Mở giỏ hàng',
      href: '/cart',
    },
  ]
}
