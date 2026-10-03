// Mỗi đơn chỉ ghép một voucher hàng hóa và một voucher ship; lần chọn sau thay lần trước.
export function normalizeVoucherSelection(codes, wallet) {
  const chosen = new Map()
  for (const code of codes) {
    const voucher = wallet.find(item => item.code === code)
    if (voucher) chosen.set(voucher.scope || 'goods', code)
  }
  return [...chosen.values()]
}
