/*
  FILE NOTE
  - Mục đích: Bộ kiểm thử tự động cho bộ lọc và sắp xếp sản phẩm yêu thích (Chỉ xem hàng yêu thích / Yêu thích nhiều nhất) trên trang Catalog.
  - Liên kết trực tiếp: src/pages/Catalog.jsx, src/main.jsx, src/App.jsx
  - Vùng ảnh hưởng khi sửa: Toàn bộ kiểm thử luồng lọc và hiển thị sản phẩm yêu thích trên storefront.
*/
import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const bundle = await build({
  entryPoints: ['src/main.jsx'], bundle: true, platform: 'browser', format: 'iife', write: false,
  jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

function response(status, data) { return { ok: status >= 200 && status < 300, status, json: async () => data } }

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail('UI did not reach the expected state')
}

test('Catalog: lọc đúng sản phẩm yêu thích khi tích Chỉ xem hàng yêu thích và chọn sắp xếp Yêu thích nhiều nhất không bị lỗi', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/products', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.ResizeObserver = class { observe() {} disconnect() {} }
  window.scrollTo = () => {}

  window.fetch = async (url) => {
    const u = String(url)
    if (u.includes('/customer/session')) return response(200, { account: { id: 'u1', username: 'testuser', csrfToken: 'csrf' } })
    if (u.includes('/customer/favorites')) return response(200, { ids: ['1', '2'], favorites: ['1', '2'] })
    if (u.includes('/customer/orders')) return response(200, { orders: [] })
    if (u.includes('/customer/vouchers')) return response(200, { vouchers: [] })
    if (u.includes('/catalog')) return response(200, { products: [] })
    return response(200, {})
  }

  window.eval(bundle.outputFiles[0].text)

  try {
    await waitFor(() => window.document.querySelectorAll('.product-card').length > 0)
    const initialCount = window.document.querySelectorAll('.product-card').length
    assert.ok(initialCount > 2, 'Ban đầu hiển thị đầy đủ danh sách sản phẩm')

    // 1. Tìm checkbox "Chỉ xem hàng yêu thích"
    const checkboxes = Array.from(window.document.querySelectorAll('.catalog-checkbox input'))
    const favCheckbox = checkboxes.find(c => c.parentElement.textContent.includes('yêu thích'))
    assert.ok(favCheckbox, 'Phải có checkbox Chỉ xem hàng yêu thích')

    // Tích vào checkbox
    favCheckbox.click()
    await waitFor(() => window.document.querySelectorAll('.product-card').length === 2)
    const filteredCards = window.document.querySelectorAll('.product-card')
    assert.equal(filteredCards.length, 2, 'Khi tích Chỉ xem hàng yêu thích, chỉ hiển thị đúng 2 sản phẩm yêu thích')

    // 2. Bỏ tích checkbox
    favCheckbox.click()
    await waitFor(() => window.document.querySelectorAll('.product-card').length === initialCount)

    // 3. Kiểm tra chọn "Yêu thích nhiều nhất" trong Dropdown Sắp xếp không bị văng lỗi ReferenceError setFavoriteSort
    const sortDropdownBtn = window.document.querySelector('.catalog-filters [aria-label="Sắp xếp sản phẩm"]')
    assert.ok(sortDropdownBtn, 'Phải có dropdown Sắp xếp')
    sortDropdownBtn.click()

    await waitFor(() => window.document.querySelectorAll('.dropdown-menu__option').length > 0)
    const favSortOption = Array.from(window.document.querySelectorAll('.dropdown-menu__option')).find(o => o.textContent.includes('Yêu thích'))
    assert.ok(favSortOption, 'Phải có tùy chọn Yêu thích nhiều nhất')

    // Bấm chọn tùy chọn Yêu thích nhiều nhất
    assert.doesNotThrow(() => favSortOption.click())
    await waitFor(() => window.document.querySelectorAll('.product-card').length === 2)
    assert.equal(window.document.querySelectorAll('.product-card').length, 2, 'Khi chọn Yêu thích nhiều nhất, kích hoạt lọc đúng 2 sản phẩm yêu thích')
  } finally {
    window.close()
  }
})
