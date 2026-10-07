import MarketBanner from './MarketBanner'
import { membershipPlans } from '../../storefront/promotions'
import './StorePromotions.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
const pageMessages = {
  home: ['Chọn món hay. Nhận thêm ưu đãi.', 'Một giỏ hàng, nhiều cách tiết kiệm.'],
  products: ['Mua đúng món. Chọn đúng ưu đãi.', 'Giá tốt trong danh mục, quà tặng trong tài khoản.'],
  favorites: ['Món bạn thích, giá bạn chờ.', 'Xem ưu đãi của sản phẩm đã lưu và khám phá thêm lựa chọn.'],
  rewards: ['Quà nhỏ cho mỗi lần ghé Store.', 'Voucher hàng hóa và voucher ship cùng dùng lượt đã tích.'],
  membership: ['Càng gắn bó, càng thêm quyền lợi.', 'Tích điểm từ đơn đã thanh toán để mở khóa hạng tiếp theo.'],
  contact: ['Ghé Store. Mang ưu đãi về.', 'Khám phá cửa hàng, chọn món và nhận quà trong tài khoản.'],
  account: ['Ưu đãi dành riêng cho bạn.', 'Giữ mã quà tặng, theo dõi điểm và chọn ưu đãi cho giỏ tiếp theo.'],
}

function VoucherBenefit({ voucher }) {
  if (voucher.scope === 'shipping' && voucher.type === 'percent' && voucher.value === 100) return <>Miễn phí ship</>
  return <>Giảm {voucher.type === 'amount' ? money.format(voucher.value) : voucher.value + '%'}{voucher.scope === 'shipping' ? ' phí ship' : ' hàng hóa'}</>
}

function MemberOffer({ overview, account }) {
  const { plan, nextPlan, points, remainingPoints } = overview
  const bestPlan = membershipPlans.at(-1)
  return <article className="store-member-offer">
    <span className="store-promo-kicker">THÀNH VIÊN STORE <span aria-hidden="true">✦</span></span>
    <h3>{account ? 'Hạng ' + plan.name + ' của bạn' : 'Gắn bó hơn. Tiết kiệm hơn.'}</h3>
    <p className="store-member-offer__number">{account && plan.discount ? plan.discount : bestPlan.discount}<span>%</span></p>
    <p>{account && plan.discount ? 'Giảm thêm khi thanh toán theo hạng hiện tại.' : 'Mức giảm thêm khi đạt hạng ' + bestPlan.name + '.'}</p>
    <div className="store-member-offer__tiers">{membershipPlans.slice(1).map(tier => <span key={tier.id}>{tier.name} <b>{tier.discount}%</b></span>)}</div>
    {account && nextPlan && <div className="store-member-offer__progress"><div><span>{points.toLocaleString('vi-VN')} điểm</span><b>Đến hạng {nextPlan.name}</b></div><progress value={Math.min(points, nextPlan.points)} max={nextPlan.points} aria-label={'Tiến độ đến hạng ' + nextPlan.name} /><small>Còn {remainingPoints.toLocaleString('vi-VN')} điểm để giảm thêm {nextPlan.discount}%.</small></div>}
    {account && !nextPlan && <small>Bạn đang ở hạng cao nhất · Tích điểm x{plan.multiplier.toLocaleString('vi-VN')}.</small>}
    <a className="store-promo-link" href="/membership">Xem quyền lợi & điều kiện →</a>
  </article>
}

export function PromotionBoard({ route = 'home', overview, account, selectedVoucherCodes = [], onToggleVoucher }) {
  const { sales, favoriteSales, vouchers } = overview
  const favoritesOnSale = route === 'favorites' && favoriteSales.length > 0
  const deals = (favoritesOnSale ? favoriteSales : sales).slice(0, 3)
  const message = pageMessages[route] || pageMessages.home
  return <section className="store-promo-board" aria-label="Ưu đãi và quà tặng Store">
    <header className="store-promo-board__head"><div><p className="store-promo-kicker">GÓC ƯU ĐÃI · STORE EVERYDAY</p><h2>{message[0]}</h2><p>{message[1]}</p></div><a className="store-promo-link" href="/products?discount=1&sort=discount">Khám phá giá tốt ↗</a></header>
    <div className="store-promo-board__offers">
      <section className="store-gift-offer" aria-label="Mã quà tặng và voucher"><div className="store-promo-section-head"><div><span className="store-promo-kicker">QUÀ TẶNG & VOUCHER</span><h3>{vouchers.length ? vouchers.length + ' mã đang chờ bạn dùng' : 'Thêm một món quà cho giỏ hàng'}</h3></div><span className="store-gift-mark" aria-hidden="true">◇</span></div>
        {vouchers.length ? <><div className="store-gift-list">{vouchers.slice(0, 3).map(voucher => <article className={'store-gift-ticket' + (selectedVoucherCodes.includes(voucher.code) ? ' is-selected' : '')} key={voucher.code}>
          <div><strong><VoucherBenefit voucher={voucher} /></strong><p><code>{voucher.code}</code><span>HSD {date.format(new Date(voucher.expiresAt))}</span></p></div><button type="button" onClick={() => onToggleVoucher(voucher.code)} aria-pressed={selectedVoucherCodes.includes(voucher.code)} aria-label={(selectedVoucherCodes.includes(voucher.code) ? 'Bỏ chọn mã ' : 'Chọn mã ') + voucher.code}>{selectedVoucherCodes.includes(voucher.code) ? 'Đã chọn ✓' : 'Chọn mã'}</button>
        </article>)}</div><p className="store-promo-note">Chọn tối đa 1 mã hàng hóa + 1 mã ship; kiểm tra giảm giá tại bước thanh toán.</p><a className="store-promo-link" href="/account">Xem toàn bộ mã trong tài khoản →</a></> : <>
          <div className="store-gift-preview"><a href="/rewards"><span aria-hidden="true">✦</span><div><b>Voucher hàng hóa</b><strong>100.000 ₫ hoặc 20%</strong><small>Phần quà có thể nhận từ vòng quay</small></div><span aria-hidden="true">↗</span></a><a href="/rewards"><span aria-hidden="true">▱</span><div><b>Voucher giao hàng</b><strong>Giảm 50% hoặc miễn phí ship</strong><small>Hai vòng quay dùng chung lượt</small></div><span aria-hidden="true">↗</span></a></div>
          <p className="store-promo-note">Kết quả tùy lượt quay, có lượt chưa trúng quà. Mã và hạn dùng hiển thị sau khi nhận.</p><a className="store-promo-link" href="/rewards">{account ? 'Bạn còn ' + Number(account.spinCredits || 0) + ' lượt · Mở vòng quay →' : 'Đăng nhập để nhận & quản lý mã →'}</a>
        </>}
      </section>
      <MemberOffer overview={overview} account={account} />
    </div>
    <section className="store-promo-deals" aria-label="Sản phẩm đang ưu đãi"><div className="store-promo-section-head"><div><span className="store-promo-kicker">{favoritesOnSale ? 'TRONG DANH SÁCH YÊU THÍCH' : 'GIÁ TỐT ĐANG CÓ'}</span><h3>{favoritesOnSale ? 'Món đã lưu đang giảm giá' : sales.length ? sales.length + ' sản phẩm đang giảm giá' : 'Khám phá lựa chọn mỗi ngày'}</h3></div>{sales.length > 0 && <span className="store-sale-stamp">Đến −{overview.maxDiscount}%</span>}</div>
      {deals.length ? <div className="store-promo-deals__grid">{deals.map(product => <a className="store-promo-product" key={product.id} href={'/products/' + encodeURIComponent(product.id)}><span className="store-promo-product__image"><img src={product.image} alt={product.name} loading="lazy" width="116" height="116" /><b>−{product.discountPercent}%</b></span><span className="store-promo-product__info"><small>{product.category}</small><strong title={product.name}>{product.name}</strong><span className="store-promo-product__price">{money.format(product.price)}</span>{product.originalPrice > product.price && <del>{money.format(product.originalPrice)}</del>}</span></a>)}</div> : <p className="store-promo-note">Khám phá danh mục Store; ưu đãi mới sẽ xuất hiện khi cửa hàng cập nhật giá.</p>}
    </section>
    <div className="store-promo-service"><span><b>1.000 ₫ = 1 điểm cơ bản</b> Tiền hàng đã xác nhận thanh toán</span><span><b>100.000 ₫ = 1 lượt quay</b> Sau giảm giá · Dùng chung hai vòng</span><a href="/contact">Nhận tại cửa hàng hoặc giao theo lịch ↗</a></div>
  </section>
}

export default function StorePromotions({ route, overview, account, selectedVoucherCodes, onToggleVoucher, children }) {
  const { sales, maxDiscount, vouchers } = overview
  const message = pageMessages[route]
  return <div className="store-promo-layout">
    <div className="store-promo-layout__body">
      <div className="container store-promo-notice" aria-label="Thông tin ưu đãi cửa hàng"><span><b aria-hidden="true">✦</b> {sales.length ? 'Ưu đãi hàng hóa đến ' + maxDiscount + '%' : 'Store · Tiện ích cho mỗi ngày'}</span><a href="/rewards">{vouchers.length ? vouchers.length + ' mã quà tặng trong ví' : 'Quà hàng hóa & voucher ship'} →</a><a href="/membership">Thành viên cao hơn, thêm quyền lợi →</a></div>
      {!['home', 'contact'].includes(route) && <div className="container store-promo-intro"><MarketBanner compact variant={['rewards', 'membership', 'account'].includes(route) ? 'rewards' : 'grocery'} title={message[0]} description={message[1]} href={route === 'favorites' || route === 'products' ? '/products?discount=1&sort=discount' : '/rewards'} action={route === 'favorites' || route === 'products' ? 'Xem sản phẩm giảm giá ↗' : 'Khám phá quà tặng ↗'} /><div className="store-promo-intro__tiles"><a href="/membership"><span aria-hidden="true">✦</span><b>Thành viên Kim Cương</b><strong>Giảm thêm {membershipPlans.at(-1).discount}%</strong><small>Mở khóa khi đủ {membershipPlans.at(-1).points.toLocaleString('vi-VN')} điểm →</small></a><a href="/rewards"><span aria-hidden="true">◇</span><b>{account ? 'Quà tặng của bạn' : 'Hai vòng quay, một ví lượt'}</b><strong>{vouchers.length ? vouchers.length + ' mã còn hạn' : 'Hàng hóa & phí ship'}</strong><small>{account ? Number(account.spinCredits || 0) + ' lượt quay còn lại →' : 'Tích lượt từ đơn đã thanh toán →'}</small></a></div></div>}
      {children}
      {route !== 'home' && <div className="container store-promo-bottom"><PromotionBoard route={route} overview={overview} account={account} selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={onToggleVoucher} /></div>}
    </div>
  </div>
}
