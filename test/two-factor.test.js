/**
 * @codex-vn-doc
 * Tệp: test/two-factor.test.js
 * Mục đích: Kiểm thử luồng xác thực hai lớp (2FA), sinh mã QR, bóc tách khóa bí mật và thông báo tiếng Việt.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import QRCode from 'qrcode'
import { apiErrorMessage } from '../src/api/userMessages.js'

test('sinh mã QR dạng data URL hợp lệ từ otpauthUrl chuẩn', async () => {
  const otpauthUrl = 'otpauth://totp/Store:khachhang@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Store&digits=6&period=30'
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 240,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' }
  })

  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'Mã QR phải là data URL PNG base64')
  assert.ok(qrDataUrl.length > 200, 'Dữ liệu ảnh QR phải đủ dài')
})

test('trích xuất và nhóm khóa bí mật thành các khối 4 ký tự dễ đọc', () => {
  const url = 'otpauth://totp/Store:khachhang@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Store'
  const parsed = new URL(url)
  const secret = parsed.searchParams.get('secret')

  assert.equal(secret, 'JBSWY3DPEHPK3PXP')

  const formatted = secret.match(/.{1,4}/g)?.join(' ')
  assert.equal(formatted, 'JBSW Y3DP EHPK 3PXP')
})

test('các mã lỗi 2FA trả về thông báo tiếng Việt chuẩn có dấu', () => {
  assert.equal(
    apiErrorMessage({ error: 'INVALID_2FA_CODE' }),
    'Mã xác thực 2 lớp (OTP) không chính xác hoặc đã hết hạn.'
  )
  assert.equal(
    apiErrorMessage({ error: 'TWO_FACTOR_ALREADY_ENABLED' }),
    'Tài khoản của bạn đã kích hoạt xác thực 2 lớp.'
  )
  assert.equal(
    apiErrorMessage({ error: 'TWO_FACTOR_SETUP_REQUIRED' }),
    'Vui lòng thiết lập lại mã xác thực 2 lớp.'
  )
  assert.equal(
    apiErrorMessage({ error: 'CHALLENGE_EXPIRED' }),
    'Phiên đăng nhập 2 lớp đã hết hạn. Vui lòng thử lại.'
  )
})
