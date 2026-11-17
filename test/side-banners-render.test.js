/**
 * @codex-vn-doc
 * Tệp: test/side-banners-render.test.js
 * Mục đích: Kiểm thử render jsdom cho banner hai bên trang chủ vòng 3
 * (làm lại từ đầu): hai đoạn rail độc lập neo vào vùng intro/catalog,
 * chỉ thẻ banner sản phẩm mới, không thẻ hero/offer cũ, không đo khe sale.
 * Thành phần chính: HomePromotionRegion render qua renderToStaticMarkup +
 * JSDOM (area="page" bọc area="intro" + area="catalog" như Home.jsx).
 * Liên kết trực tiếp: node:test, node:assert/strict, esbuild, jsdom, react,
 * react-dom/server, ../src/components/ui/HomePromotionRegion.jsx,
 * ../src/services/promotions.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó;
 * luôn đóng jsdom window trong finally để node --test không treo.
 * Lưu ý: jsdom getBoundingClientRect luôn trả 0 nên các test dưới đây chỉ
 * khẳng định đồng bộ ở mức cấu trúc + CSS (số thẻ mỗi đoạn, flex: 1, không
 * span, không style height riêng); kiểm tra hình học bằng pixel vẫn cần
 * xem bằng mắt trên trình duyệt thật ≥1360px sau khi pull.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import { readFileSync } from 'node:fs'
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

// Render đúng cấu trúc như Home.jsx: page bọc intro + catalog; catalog nhận
// hai con [mục sale, phần sau sale].
function renderPage(appearance) {
  const regionProps = { overview, account: null, products, appearance }
  return renderToStaticMarkup(React.createElement(HomePromotionRegion, { ...regionProps, area: 'page' },
    React.createElement(HomePromotionRegion, { ...regionProps, area: 'intro' },
      React.createElement('section', { className: 'shop-hero' }, 'Hero giữa trang')),
    React.createElement(HomePromotionRegion, { ...regionProps, area: 'catalog' },
      React.createElement('div', { className: 'container home-catalog' },
        React.createElement('section', { id: 'home-sale-products' }, 'Đang giảm giá')),
      React.createElement('div', { className: 'container home-catalog' },
        React.createElement('section', { className: 'home-product-row' }, 'Nhóm hàng'))),
  ))
}

function domOf(appearance) {
  return new JSDOM(renderPage(appearance))
}

function slots(ids, extra = {}) {
  return ids.map(id => ({ productId: String(id), title: '', note: '', bg: '', text: '', accent: '', ...extra }))
}

// Thẻ trong một đoạn rail: intro + before / catalog-after + after.
function segmentCards(document, regionClass, side, segment) {
  const selector = '.' + regionClass + ' .home-promotion-rail--' + side
    + ' .side-banner-rail__segment--' + segment + ' .side-banner-card'
  return [...document.querySelectorAll(selector)]
}

function segmentHrefs(document, regionClass, side, segment) {
  return segmentCards(document, regionClass, side, segment).map(card => card.getAttribute('href'))
}

test('không còn code đo khe sale / lưới hàng chung / span trong code mới', () => {
  const files = [
    'src/services/sideBanners.js',
    'src/components/ui/HomePromotionRegion.jsx',
    'src/components/ui/HomePromotionRegion.css',
    'src/components/ui/SideBannerRail.jsx',
    'src/components/ui/SideBannerRail.css',
    'src/components/ui/SideBannerCard.jsx',
    'src/components/ui/SideBannerCard.css',
  ]
  for (const file of files) {
    const source = readFileSync(resolve(file), 'utf8')
    for (const forbidden of ['syncSaleGap', 'computeSideBannerSync', 'leadSpanFor', 'FALLBACK_SIDE_BANNER_COUNTS', 'ResizeObserver', 'requestAnimationFrame', 'getBoundingClientRect', '--home-sale-gap-height']) {
      assert.ok(!source.includes(forbidden), file + ': còn chứa ' + forbidden)
    }
  }
  // Rail mới không import thẻ hero/offer cũ.
  for (const file of ['src/components/ui/HomePromotionRegion.jsx', 'src/components/ui/SideBannerRail.jsx', 'src/components/ui/SideBannerCard.jsx']) {
    const source = readFileSync(resolve(file), 'utf8')
    assert.ok(!source.includes('HomeBannerOffers'), file + ': còn dùng HomeBannerOffers')
    assert.ok(!source.includes('HomeBannerArtwork'), file + ': còn dùng HomeBannerArtwork')
    assert.ok(!source.includes('HomeSideBanner'), file + ': còn dùng HomeSideBanner cũ')
  }
})

test('thẻ trong cùng đoạn cao bằng nhau: flex: 1, không span, không style height riêng', () => {
  const railCss = readFileSync(resolve('src/components/ui/SideBannerRail.css'), 'utf8')
  assert.match(railCss, /display:\s*flex/)
  assert.match(railCss, /flex-direction:\s*column/)
  assert.match(railCss, /height:\s*100%/)
  const cardCss = readFileSync(resolve('src/components/ui/SideBannerCard.css'), 'utf8')
  assert.match(cardCss, /flex:\s*1 1 0/)
  assert.ok(!cardCss.includes('span'), 'CSS thẻ không được có span')
  assert.match(cardCss, /-webkit-line-clamp:\s*2/)
  assert.match(cardCss, /object-fit:\s*contain/)
  // Vùng ảnh cao cố định.
  assert.match(cardCss, /\.side-banner-card__media\s*\{[^}]*height:\s*132px/)
  const dom = domOf({})
  try {
    const document = dom.window.document
    for (const card of document.querySelectorAll('.side-banner-card')) {
      const style = card.getAttribute('style') || ''
      assert.ok(!/height\s*:/.test(style), 'thẻ không được có style height riêng: ' + style)
      assert.ok(!/grid-row/.test(style), 'thẻ không được span hàng: ' + style)
    }
    // Đoạn rail lấp đầy vùng neo, thẻ không có class lưới đồng bộ cũ.
    assert.equal(document.querySelectorAll('.home-side-banner-stack').length, 0)
    assert.equal(document.querySelectorAll('.home-side-banner-stack--synced').length, 0)
  } finally {
    dom.window.close()
  }
})

test('mặc định khi chưa có cấu hình: banner sản phẩm mới, mỗi bên 5, chia 2 trước/3 sau', () => {
  const dom = domOf({})
  try {
    const document = dom.window.document
    // Không còn thẻ hero/offer cũ trong rail.
    assert.equal(document.querySelectorAll('.home-side-banner').length, 0)
    assert.equal(document.querySelectorAll('.home-side-banner--store').length, 0)
    assert.equal(document.querySelectorAll('.home-side-banner--member').length, 0)
    assert.equal(document.querySelectorAll('.home-banner-offer').length, 0)
    assert.equal(document.querySelectorAll('.home-promotion-rail__sale-gap').length, 0)
    // Hai bên cùng số lượng và cùng chia trước/sau.
    for (const side of ['left', 'right']) {
      assert.deepEqual(
        [segmentCards(document, 'home-promotion-region--intro', side, 'before').length,
          segmentCards(document, 'home-promotion-region--catalog', side, 'after').length],
        [2, 3],
        side + ': mặc định phải chia 2 trước/3 sau',
      )
    }
    // Trái vị trí chẵn, phải vị trí lẻ trong danh sách mặc định đã sắp xếp.
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--intro', 'left', 'before'), ['/products/1', '/products/9'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--catalog', 'left', 'after'), ['/products/7', '/products/5', '/products/3'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--intro', 'right', 'before'), ['/products/10', '/products/8'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--catalog', 'right', 'after'), ['/products/6', '/products/4', '/products/2'])
    // Thẻ có đủ cấu trúc mới: ảnh, nhãn danh mục, tên, giá, nút xem chi tiết.
    const first = document.querySelector('.side-banner-card')
    assert.ok(first.querySelector('.side-banner-card__media img'), 'thẻ thiếu ảnh')
    assert.equal(first.querySelector('.side-banner-card__label').textContent, 'Điện tử')
    assert.equal(first.querySelector('.side-banner-card__name').textContent, 'Sản phẩm 1')
    assert.ok(first.querySelector('.side-banner-card__price').textContent.includes('100.000'))
    assert.match(first.querySelector('.side-banner-card__action').textContent, /Xem chi tiết/)
    // Hero ở giữa trang vẫn còn nguyên, không bị biến thành banner cột bên.
    assert.ok(document.querySelector('.shop-hero'), 'thiếu hero giữa trang')
  } finally {
    dom.window.close()
  }
})

test('custom 5 mỗi bên: đúng 5 card/bên, chia 2 trước/3 sau, href /products/<id>', () => {
  const appearance = {
    sideBanners: JSON.stringify({
      version: 1,
      left: slots([1, 2, 3, 4, 5], { accent: '#ffcc00' }),
      right: slots([6, 7, 8, 9, 10]),
    }),
  }
  const dom = domOf(appearance)
  try {
    const document = dom.window.document
    assert.equal(document.querySelectorAll('.side-banner-card').length, 10)
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--intro', 'left', 'before'), ['/products/1', '/products/2'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--catalog', 'left', 'after'), ['/products/3', '/products/4', '/products/5'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--intro', 'right', 'before'), ['/products/6', '/products/7'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--catalog', 'right', 'after'), ['/products/8', '/products/9', '/products/10'])
    // Màu accent sau normalize là CHỮ HOA.
    const first = document.querySelector('.home-promotion-rail--left .side-banner-card')
    assert.match(first.getAttribute('style') || '', /#FFCC00/)
    assert.equal(document.querySelectorAll('.home-side-banner').length, 0)
  } finally {
    dom.window.close()
  }
})

test('chỉ một bên custom thì bên còn lại dùng banner mặc định mới', () => {
  const appearance = { sideBanners: { version: 1, left: slots([1, 2, 3]), right: [] } }
  const dom = domOf(appearance)
  try {
    const document = dom.window.document
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--intro', 'left', 'before'), ['/products/1'])
    assert.deepEqual(segmentHrefs(document, 'home-promotion-region--catalog', 'left', 'after'), ['/products/2', '/products/3'])
    // Phải mặc định 5, chia 2 trước/3 sau.
    assert.equal(segmentCards(document, 'home-promotion-region--intro', 'right', 'before').length, 2)
    assert.equal(segmentCards(document, 'home-promotion-region--catalog', 'right', 'after').length, 3)
    assert.equal(document.querySelectorAll('.side-banner-card').length, 8)
  } finally {
    dom.window.close()
  }
})

test('cấu hình cũ 13 slot/bên kẹp về 10, chia 4 trước/6 sau', () => {
  const ids13 = Array.from({ length: 13 }, (_, index) => (index % 10) + 1)
  const appearance = { sideBanners: JSON.stringify({ version: 1, left: slots(ids13), right: slots(ids13) }) }
  const dom = domOf(appearance)
  try {
    const document = dom.window.document
    for (const side of ['left', 'right']) {
      assert.equal(segmentCards(document, 'home-promotion-region--intro', side, 'before').length, 4)
      assert.equal(segmentCards(document, 'home-promotion-region--catalog', side, 'after').length, 6)
    }
    assert.equal(document.querySelectorAll('.side-banner-card').length, 20)
  } finally {
    dom.window.close()
  }
})

test('slot trùng productId render đủ card với data-banner-id riêng theo index', () => {
  const appearance = { sideBanners: { version: 1, left: slots([1, 1, 1]), right: [] } }
  const dom = domOf(appearance)
  try {
    const cards = [...dom.window.document.querySelectorAll('.home-promotion-rail--left .side-banner-card')]
    assert.equal(cards.length, 3)
    assert.deepEqual(
      cards.map(card => card.getAttribute('data-banner-id')),
      ['1-0', '1-1', '1-2'],
    )
  } finally {
    dom.window.close()
  }
})

test('thứ tự DOM: đoạn trước sale, rồi mục sale, rồi đoạn sau sale', () => {
  const dom = domOf({})
  try {
    const document = dom.window.document
    const all = [...document.querySelectorAll('body *')]
    const indexOf = (element) => all.indexOf(element)
    const beforeRail = document.querySelector('.home-promotion-region--intro .home-promotion-rail--left')
    const sale = document.querySelector('#home-sale-products')
    const afterRail = document.querySelector('.home-promotion-region__after .home-promotion-rail--left')
    assert.ok(beforeRail && sale && afterRail, 'thiếu rail trước / mục sale / rail sau')
    assert.ok(indexOf(beforeRail) < indexOf(sale), 'đoạn trước sale phải đứng trước mục sale')
    assert.ok(indexOf(sale) < indexOf(afterRail), 'đoạn sau sale phải đứng sau mục sale')
    // Đoạn sau neo trong vùng catalog sau sale, không phải region trang.
    assert.ok(afterRail.closest('.home-promotion-region__after'), 'rail sau phải nằm trong vùng after')
    assert.ok(beforeRail.closest('.home-promotion-region--intro'), 'rail trước phải nằm trong vùng intro')
    // Region trang không render rail, không có biến khe sale.
    assert.equal(document.querySelectorAll('.home-promotion-region--page > .home-promotion-rail').length, 0)
    const pageRegion = document.querySelector('.home-promotion-region--page')
    assert.equal(pageRegion.style.getPropertyValue('--home-sale-gap-height'), '')
  } finally {
    dom.window.close()
  }
})
