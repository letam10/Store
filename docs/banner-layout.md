# Banner Store: phạm vi và hợp đồng giao diện

## Yêu cầu

- Hai banner bên cạnh chỉ thuộc trang chủ.
- Banner bám theo cuộn trong phần phía trên mục Đang giảm giá.
- Mép dưới vùng banner kết thúc trước `#home-sale-products`.
- Không phủ lên sản phẩm, nút bấm, thông báo, footer hoặc thanh hỗ trợ.
- Dưới 1680 px không hiện cột hai bên; giữ banner trong luồng nội dung trên mobile.
- Banner sáng/tối đọc rõ, ưu đãi lấy từ dữ liệu hiện tại.

## Thành phần và dữ liệu dùng chung

`HomePromotionRegion({ overview, account, children })`:

- Root: `.home-promotion-region`.
- Hai aside: `.home-promotion-rail`, thêm hậu tố `--left` và `--right`.
- Phần giữa: `.home-promotion-region__body`.
- Hai aside chứa `HomeSideBanner` với `side="left"` hoặc `side="right"`.
- Home đặt hero, lối tắt, PromotionBoard và Sản phẩm nổi bật vào `children`.
- Phần giảm giá và các danh mục là sibling phía sau vùng này.
- Root StorePromotions không còn chứa aside hay chia cột toàn trang.

`HomeSideBanner({ side, overview, account })`:

- Hai bên dùng cùng hợp đồng props; mỗi bên là một thẻ gọn để không cần thanh cuộn riêng.
- Không dùng `position: fixed`, listener cuộn hoặc tự dựng mức giảm/mã voucher.
- Root `.home-side-banner`; có link hoạt động tới danh mục, membership hoặc rewards.
- Link bên trái có thể trỏ `#home-sale-products` để tới đúng ranh giới sản phẩm giảm giá.
- Bên phải nêu điều kiện quyền lợi thành viên và liên kết tới thể lệ.

`overview` giữ hợp đồng `storePromotionOverview` hiện tại:

- `sales`, `maxDiscount`, `vouchers`, `plan`, `nextPlan`, `points`, `remainingPoints`.
- `plan`: `id`, `name`, `discount`, `points`, `multiplier` từ membershipPlans.
- `account`: null hoặc `{ tier, points, spinCredits, ... }`.
- Không thay đổi API, kho voucher, tính điểm, giảm giá hoặc thao tác thanh toán.

`MarketBanner` giữ props và exports hiện tại:

- `compact`, `variant` grocery/delivery/rewards, `title`, `description`, `href`, `action`.
- SVG là trang trí `aria-hidden`; link vẫn là link điều hướng thật.

## Phân công tệp

- Agent thiết kế: MarketBanner.jsx/css, HomeSideBanner.jsx/css, StorePromotions.css.
- Agent thiết kế có thể thêm CSS riêng tên StorePromotion*.css để mỗi tệp dưới khoảng 300 dòng.
- Agent kiểm thử: chỉ test/promotion-layout.test.js.
- Agent chính: HomePromotionRegion.jsx/css, Home.jsx, App.jsx, StorePromotions.jsx và ghi chú này.
- Không sửa chéo tệp, không tạo subagent, không commit/push từ agent phụ.

## Tiêu chí kiểm chứng

- JSDOM: trang chủ có đúng hai aside, đều nằm trong vùng phía trên giảm giá.
- JSDOM: các route products, favorites, rewards, membership, contact, account, cart không có hai aside.
- Dữ liệu rỗng không quảng cáo mức giảm giả; dữ liệu có giảm giá hiển thị đúng mức cao nhất.
- Link quảng cáo có đích hợp lệ và ưu đãi/mã voucher hiện tại vẫn sử dụng được.
- Browser: 1920/1680/1440/390/320 px, cả sáng/tối, cuộn đầu/giữa/qua ranh giới/footer.
- Browser: mép dưới mỗi aside không vượt mép dưới vùng; không giao với mục giảm giá hoặc các card sản phẩm.
- Browser: không tràn ngang và không có lỗi JS; cột hai bên chỉ visible từ 1680 px.
- Chạy `node --test test/promotion-layout.test.js`, `npm test`, `npm run lint`, `npm run build`.

## Kết quả

Đã kiểm chứng ngày 07/10/2026 với Store và API đang chạy cục bộ.

- `npm test`: 47/47 đạt, gồm 5 ca banner và 1 ca neo điều hướng mới.
- `npm run lint`: đạt, không có lỗi.
- `npm run build`: đạt; cảnh báo bundle lớn có sẵn vẫn còn.
- `git diff --check`: đạt.
- Browser desktop: CSS 1920 px sáng/tối, 1684 px sáng/tối, 1440 px sáng/tối.
- Browser mobile: CSS 390 px và 320 px; banner không làm tràn ngang.
- Trang liên hệ 390 px: cả ba biến thể banner có màu chữ rõ trên nền sáng/tối.
- Products, favorites, rewards, membership, contact, account và cart: không có aside quảng cáo hai bên.
- Khi cuộn giữa trang, hai aside bám dưới header và không giao với thẻ sản phẩm.
- Tại neo giảm giá, mép dưới hai aside ở y=53; mục giảm giá bắt đầu ở y=85.
- Khoảng cách 32 px được giữ giữa aside và vùng giảm giá khi sticky dừng.
- Tại footer, cả hai aside đã nằm hoàn toàn phía trên viewport.
- Nút tới khu giảm giá cuộn đúng; thay đổi fragment không bị App khôi phục vị trí cuộn cũ.
- Console trình duyệt: không có lỗi JavaScript trong các tuyến đã kiểm tra.
- Viewport tạm đã reset, theme đã trả về tối, chỉ tab QA được đóng.

Browser đang dùng zoom 114%; các kích thước trên lấy từ DOM thực tế.
Sát breakpoint, chiều rộng CSS có phần lẻ: `innerWidth` làm tròn 1680 nhưng media query chưa đạt,
còn tại `innerWidth` 1681 thì media query đạt và hai aside hiện. Quyết định hiển thị theo media query CSS.

Ảnh QA lưu cục bộ ngoài repository tại `D:\Học Tập\Website_React\.codex-qa\banner-20261007`.
Các ảnh chính: desktop-1920-dark.jpg, desktop-1920-light.jpg, desktop-scroll-dark.jpg,
desktop-boundary-dark.jpg, desktop-boundary-light.jpg, desktop-footer-dark.jpg,
mobile-390-dark.jpg, mobile-320-light.jpg và contact-mobile-light.jpg.

Remote main `0541dc2` là merge PR #2 và có cùng cây mã với `429ba23`.
Nhánh làm việc đã fast-forward tới main mới trước khi commit banner; bộ test trên vẫn áp dụng cùng mã nguồn.
Admin và API không có thay đổi nguồn thuộc mốc banner này.
