/**
 * @codex-vn-doc
 * Tệp: test/side-banners-render.test.js
 * Mục đích: Kiểm thử render jsdom cho banner hai bên trang chủ ở chế độ
 * custom (appearance.sideBanners) và chế độ fallback mặc định.
 * Thành phần chính: HomeSideBanner và HomePromotionRegion render qua
 * renderToStaticMarkup + JSDOM.
 * Liên kết trực tiếp: node:test, node:assert/strict, esbuild, jsdom, react,
 * react-dom/server, ../src/components/ui/HomeSideBanner.jsx,
 * ../src/components/ui/HomePromotionRegion.jsx, ../src/services/promotions.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó;
 * luôn đóng jsdom window trong finally để node --test không treo.
 * Lưu ý: jsdom getBoundingClientRect luôn trả 0 nên các test dưới đây chỉ
 * khẳng định đồng bộ ở mức cấu trúc (số hàng chung, grid-row span qua biến
 * CSS, khe sale dùng chung một biến); kiểm tra hình học bằng pixel vẫn cần
 * xem bằng mắt trên trình duyệt thật ≥1360px sau khi pull.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import { resolve } from 'node:path'
import { buildSync } from 'esbuild'
import { JSDOM } from 'jsdom'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storePromotionOverview } from '../src/services/promotions.js'

function loadComponent(path) {
  const filename = resolve('test/side-banners-component.bundle.cjs')
  const compiled = buildSync({
    entryPoints: [path],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    jsx: 'automatic',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  })
  const component = new Module(filename)
  component.filename = filename
  component.paths = Module._nodeModulePaths(resolve('test'))
  component._compile(compiled.outputFiles[0].text, filename)
  return component.exports.default
}

const HomeSideBanner = loadComponent('src/components/ui/HomeSideBanner.jsx')
const HomePromotionRegion = loadComponent('src/components/ui/HomePromotionRegion.jsx')

const products = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  name: 'Sản phẩm ' + (index + 1),
  price: (index + 1) * 100000,
  image: '/products/p' + (index + 1) + '.webp',
  category: 'Điện tử',
  stockCount: 20,
  viewCount: index,
  discountPercent: index === 0 ? 10 : 0,
}))

const overview = storePromotionOverview(products, [], null)

function renderSide(side, appearance) {
  return renderToStaticMarkup(React.createElement(HomeSideBanner, {
    side,
    overview,
    account: null,
    products,
    area: 'page',
    appearance,
  }))
}

function renderRegion(appearance) {
  return renderToStaticMarkup(React.createElement(HomePromotionRegion, {
    overview,
    account: null,
    products,
    area: 'page',
    appearance,
  }, React.createElement('div', { id: 'home-sale-products' }, 'Đang giảm giá')))
}

// Đọc biến CSS hàng chung trên stack của một rail.
function stackVars(document, railClass) {
  const stack = document.querySelector('.' + railClass + ' .home-side-banner-stack')
  assert.ok(stack, railClass + ': thiếu stack banner')
  assert.ok(stack.classList.contains('home-side-banner-stack--synced'), railClass + ': stack phải dùng lưới hàng chung')
  const read = (name) => stack.style.getPropertyValue(name).trim()
  return {
    rowsBefore: Number(read('--rows-before')),
    rowsAfter: Number(read('--rows-after')),
    beforeLeadSpan: Number(read('--before-lead-span')),
    afterLeadSpan: Number(read('--after-lead-span')),
  }
}

// Đếm card custom trước/sau khe sale trong một stack.
function splitCounts(stack) {
  const children = [...stack.children]
  const gapIndex = children.findIndex(child => child.classList.contains('home-promotion-rail__sale-gap'))
  assert.ok(gapIndex >= 0, 'thiếu khe sale')
  return {
    before: children.slice(0, gapIndex).filter(child => child.classList.contains('home-side-banner')).length,
    after: children.slice(gapIndex + 1).filter(child => child.classList.contains('home-side-banner')).length,
  }
}

function slots(ids, extra = {}) {
  return ids.map(id => ({ productId: String(id), title: '', note: '', bg: '', text: '', accent: '', ...extra }))
}

test('custom 5 mỗi bên render đúng 5 card/bên, chia 2 trước/3 sau khe sale, href /products/<id>', () => {
  const appearance = {
    sideBanners: JSON.stringify({
      version: 1,
      left: slots([1, 2, 3, 4, 5], { accent: '#ffcc00' }),
      right: slots([6, 7, 8, 9, 10]),
    }),
  }
  for (const [side, ids] of [['left', [1, 2, 3, 4, 5]], ['right', [6, 7, 8, 9, 10]]]) {
    const dom = new JSDOM(renderSide(side, appearance))
    try {
      const document = dom.window.document
      const cards = [...document.querySelectorAll('.home-banner-custom')]
      assert.equal(cards.length, 5, side + ': phải render đúng 5 card custom')
      assert.deepEqual(
        cards.map(card => card.getAttribute('href')),
        ids.map(id => '/products/' + id),
      )
      // Thẻ đầu mặc định và offer mặc định không render ở chế độ custom.
      assert.equal(document.querySelector('.home-side-banner--store'), null)
      assert.equal(document.querySelector('.home-side-banner--member'), null)
      // Chia trước/sau khe sale: 2 trước, 3 sau.
      const children = [...document.querySelector('.home-side-banner-stack').children]
      const gapIndex = children.findIndex(child => child.classList.contains('home-promotion-rail__sale-gap'))
      assert.ok(gapIndex >= 0, side + ': thiếu khe sale')
      assert.equal(children.slice(0, gapIndex).filter(child => child.classList.contains('home-banner-custom')).length, 2)
      assert.equal(children.slice(gapIndex + 1).filter(child => child.classList.contains('home-banner-custom')).length, 3)
    } finally {
      dom.window.close()
    }
  }
  // Màu accent sau normalize là CHỮ HOA.
  const dom = new JSDOM(renderSide('left', appearance))
  try {
    const first = dom.window.document.querySelector('.home-banner-custom')
    assert.match(first.getAttribute('style') || '', /#FFCC00/)
  } finally {
    dom.window.close()
  }
})

test('không config thì trái 11 / phải 13 y như cũ', () => {
  for (const [side, expected] of [['left', 11], ['right', 13]]) {
    const dom = new JSDOM(renderSide(side, {}))
    try {
      const document = dom.window.document
      assert.equal(document.querySelectorAll('.home-side-banner').length, expected, side + ': fallback phải có ' + expected + ' card')
      assert.equal(document.querySelectorAll('.home-banner-custom').length, 0)
      assert.ok(document.querySelector('.home-promotion-rail__sale-gap'), side + ': fallback phải có khe sale')
    } finally {
      dom.window.close()
    }
  }
})

test('chỉ một bên custom thì bên còn lại fallback y như cũ', () => {
  const appearance = { sideBanners: { version: 1, left: slots([1, 2, 3]), right: [] } }
  const leftDom = new JSDOM(renderSide('left', appearance))
  try {
    assert.equal(leftDom.window.document.querySelectorAll('.home-banner-custom').length, 3)
  } finally {
    leftDom.window.close()
  }
  const rightDom = new JSDOM(renderSide('right', appearance))
  try {
    assert.equal(rightDom.window.document.querySelectorAll('.home-side-banner').length, 13)
    assert.equal(rightDom.window.document.querySelectorAll('.home-banner-custom').length, 0)
  } finally {
    rightDom.window.close()
  }
})

test('slot trùng productId render đủ card với key riêng theo index', () => {
  const appearance = { sideBanners: { version: 1, left: slots([1, 1, 1]), right: [] } }
  const dom = new JSDOM(renderSide('left', appearance))
  try {
    const cards = [...dom.window.document.querySelectorAll('.home-banner-custom')]
    assert.equal(cards.length, 3)
    assert.deepEqual(
      cards.map(card => card.getAttribute('data-banner-id')),
      ['1-0', '1-1', '1-2'],
    )
  } finally {
    dom.window.close()
  }
})

test('region custom 20/20: hai rail cùng hàng chung 7 trước/13 sau, span 1', () => {
  const ids20 = Array.from({ length: 20 }, (_, index) => (index % 10) + 1)
  const appearance = {
    sideBanners: JSON.stringify({
      version: 1,
      left: slots(ids20),
      right: slots(ids20),
    }),
  }
  const dom = new JSDOM(renderRegion(appearance))
  try {
    const document = dom.window.document
    const left = stackVars(document, 'home-promotion-rail--left')
    const right = stackVars(document, 'home-promotion-rail--right')
    assert.deepEqual([left.rowsBefore, left.rowsAfter], [7, 13])
    assert.deepEqual([right.rowsBefore, right.rowsAfter], [7, 13])
    assert.deepEqual([left.beforeLeadSpan, left.afterLeadSpan], [1, 1])
    assert.deepEqual([right.beforeLeadSpan, right.afterLeadSpan], [1, 1])
    assert.deepEqual(splitCounts(document.querySelector('.home-promotion-rail--left .home-side-banner-stack')), { before: 7, after: 13 })
    assert.deepEqual(splitCounts(document.querySelector('.home-promotion-rail--right .home-side-banner-stack')), { before: 7, after: 13 })
  } finally {
    dom.window.close()
  }
})

test('region custom trái 20/phải 5: hàng chung 7/13, phải span bù 6 trước/11 sau', () => {
  const ids20 = Array.from({ length: 20 }, (_, index) => (index % 10) + 1)
  const appearance = {
    sideBanners: JSON.stringify({
      version: 1,
      left: slots(ids20),
      right: slots([1, 2, 3, 4, 5]),
    }),
  }
  const dom = new JSDOM(renderRegion(appearance))
  try {
    const document = dom.window.document
    const left = stackVars(document, 'home-promotion-rail--left')
    const right = stackVars(document, 'home-promotion-rail--right')
    // Số hàng chung giống hệt nhau ở hai rail dù số banner lệch nhau.
    assert.deepEqual([left.rowsBefore, left.rowsAfter], [7, 13])
    assert.deepEqual([right.rowsBefore, right.rowsAfter], [7, 13])
    assert.deepEqual([left.beforeLeadSpan, left.afterLeadSpan], [1, 1])
    assert.deepEqual([right.beforeLeadSpan, right.afterLeadSpan], [6, 11])
    assert.deepEqual(splitCounts(document.querySelector('.home-promotion-rail--left .home-side-banner-stack')), { before: 7, after: 13 })
    assert.deepEqual(splitCounts(document.querySelector('.home-promotion-rail--right .home-side-banner-stack')), { before: 2, after: 3 })
  } finally {
    dom.window.close()
  }
})

test('region fallback: hàng chung 5 trước/8 sau, trái span 2/2, phải span 1/1, card 11/13', () => {
  const dom = new JSDOM(renderRegion({}))
  try {
    const document = dom.window.document
    const left = stackVars(document, 'home-promotion-rail--left')
    const right = stackVars(document, 'home-promotion-rail--right')
    assert.deepEqual([left.rowsBefore, left.rowsAfter], [5, 8])
    assert.deepEqual([right.rowsBefore, right.rowsAfter], [5, 8])
    // Trái thiếu 1 hàng mỗi đoạn: thẻ đầu (con đầu stack) span 2 trước sale,
    // offer đầu sau sale span 2; phải đủ hàng nên span 1.
    assert.deepEqual([left.beforeLeadSpan, left.afterLeadSpan], [2, 2])
    assert.deepEqual([right.beforeLeadSpan, right.afterLeadSpan], [1, 1])
    assert.equal(document.querySelectorAll('.home-promotion-rail--left .home-side-banner').length, 11)
    assert.equal(document.querySelectorAll('.home-promotion-rail--right .home-side-banner').length, 13)
    // Thẻ đầu fallback vẫn là thẻ hero mặc định, không đổi nội dung/thiết kế.
    assert.ok(document.querySelector('.home-promotion-rail--left .home-side-banner--store'))
    assert.ok(document.querySelector('.home-promotion-rail--right .home-side-banner--member'))
  } finally {
    dom.window.close()
  }
})

test('region một bên custom một bên fallback: hàng chung lấy max 5/8', () => {
  const appearance = { sideBanners: { version: 1, left: slots([1, 2, 3]), right: [] } }
  const dom = new JSDOM(renderRegion(appearance))
  try {
    const document = dom.window.document
    const left = stackVars(document, 'home-promotion-rail--left')
    const right = stackVars(document, 'home-promotion-rail--right')
    assert.deepEqual([left.rowsBefore, left.rowsAfter], [5, 8])
    assert.deepEqual([right.rowsBefore, right.rowsAfter], [5, 8])
    assert.deepEqual([left.beforeLeadSpan, left.afterLeadSpan], [5, 7])
    assert.deepEqual([right.beforeLeadSpan, right.afterLeadSpan], [1, 1])
    assert.equal(document.querySelectorAll('.home-promotion-rail--left .home-banner-custom').length, 3)
    assert.equal(document.querySelectorAll('.home-promotion-rail--right .home-side-banner').length, 13)
  } finally {
    dom.window.close()
  }
})

test('khe sale dùng chung: hai khe không có style height riêng, chiều cao lấy từ biến chung', () => {
  const dom = new JSDOM(renderRegion({}))
  try {
    const document = dom.window.document
    const gaps = [...document.querySelectorAll('.home-promotion-rail__sale-gap')]
    assert.equal(gaps.length, 2)
    // Không rail nào tự đặt chiều cao khe riêng (vòng 1 mỗi rail tự đo và
    // gán style.height); chiều cao khe chỉ còn qua biến chung
    // --home-sale-gap-height trên region, do region đo một lần.
    for (const gap of gaps) {
      assert.equal(gap.getAttribute('style'), null)
    }
    const region = document.querySelector('.home-promotion-region--page')
    assert.ok(region, 'thiếu region trang')
  } finally {
    dom.window.close()
  }
})
