import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import { resolve } from 'node:path'
import { buildSync } from 'esbuild'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storePromotionOverview } from '../src/storefront/promotions.js'

function loadComponent(path) {
  const filename = resolve('test/layout-component.bundle.cjs')
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

const StorePromotions = loadComponent('src/components/ui/StorePromotions.jsx')
const Rewards = loadComponent('src/pages/Rewards.jsx')
const Contact = loadComponent('src/pages/Contact.jsx')

function resolveColor(window, value, element) {
  const variable = value.match(/^var\((--[\w-]+)(?:,\s*(.*))?\)$/)
  if (!variable) return value
  for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
    const color = window.getComputedStyle(ancestor).getPropertyValue(variable[1]).trim()
    if (color) return resolveColor(window, color, ancestor)
  }
  return variable[2] || ''
}

function luminance(color) {
  const rgb = color.startsWith('#')
    ? color.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16))
    : color.match(/[\d.]+/g).slice(0, 3).map(Number)
  const channels = rgb.map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

test('form liên hệ có nền hợp lệ và chữ tương phản trên giao diện sáng và tối', () => {
  const compiled = buildSync({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    write: false,
    outfile: 'test/contact-style-fixture.js',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  })
  const css = compiled.outputFiles.find(file => file.path.endsWith('.css')).text
  const html = renderToStaticMarkup(React.createElement(Contact))
  for (const theme of ['light', 'dark']) {
    const dom = new JSDOM('<!doctype html><html data-theme="' + theme + '"><body>' + html + '</body></html>')
    const { window } = dom
    try {
      const style = window.document.createElement('style')
      style.textContent = css
      window.document.head.append(style)
      const card = window.document.querySelector('.contact-form-card')
      for (const element of card.querySelectorAll('h2,label,input,select,textarea')) {
        const computed = window.getComputedStyle(element)
        const isField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
        const backgroundNode = isField ? element : card
        const background = resolveColor(window,
          window.getComputedStyle(backgroundNode).getPropertyValue('background'), backgroundNode)
        const foreground = resolveColor(window, computed.color, element)
        assert.ok(background, theme + ': thiếu nền cho ' + element.tagName)
        assert.ok(foreground, theme + ': thiếu màu chữ cho ' + element.tagName)
        const values = [luminance(background), luminance(foreground)].sort((first, second) => first - second)
        assert.ok((values[1] + 0.05) / (values[0] + 0.05) >= 4.5, theme + ': ' + element.tagName)
      }
    } finally { window.close() }
  }
})

test('bốn trang riêng giữ nội dung mà không có notice, intro hay bảng quảng cáo', () => {
  for (const route of ['favorites', 'rewards', 'membership', 'contact']) {
    const content = React.createElement('main', { id: 'page-content' }, route)
    const html = renderToStaticMarkup(React.createElement(StorePromotions, {
      route,
      overview: storePromotionOverview(),
      children: content,
    }))
    const dom = new JSDOM(html)
    try {
      assert.equal(dom.window.document.querySelector('#page-content').textContent, route)
      assert.equal(dom.window.document.querySelector('[class*="store-promo-"]'), null)
    } finally {
      dom.window.close()
    }
  }
})

test('trang chủ và danh mục vẫn giữ đúng vị trí quảng cáo đang dùng', () => {
  for (const route of ['home', 'products']) {
    const html = renderToStaticMarkup(React.createElement(StorePromotions, {
      route,
      overview: storePromotionOverview(),
      children: React.createElement('main', {}, route),
    }))
    const dom = new JSDOM(html)
    try {
      const document = dom.window.document
      assert.ok(document.querySelector('.store-promo-notice'))
      assert.equal(Boolean(document.querySelector('.store-promo-intro')), route === 'products')
      assert.equal(Boolean(document.querySelector('.store-promo-bottom')), route === 'products')
    } finally {
      dom.window.close()
    }
  }
})

test('hai vòng đọc đúng May mắn lần sau và Voucher trước giá trị phần thưởng', () => {
  const html = renderToStaticMarkup(React.createElement(Rewards))
  const dom = new JSDOM(html)
  try {
    const wheels = [...dom.window.document.querySelectorAll('.lucky-wheel__disc')]
    const expectedPrizes = [
      ['Lần sau', 'Lần sau', '100K', 'Lần sau', '20%', 'Lần sau', '100K', 'Lần sau', '100K', 'Lần sau'],
      ['Lần sau', 'Lần sau', '50%', 'Lần sau', 'Miễn ship', 'Lần sau', '50%', 'Lần sau', '50%', 'Lần sau'],
    ]
    assert.equal(wheels.length, 2)
    for (const [wheelIndex, wheel] of wheels.entries()) {
      const labels = [...wheel.querySelectorAll('.lucky-wheel__labels')]
      assert.equal(labels.length, 10)
      assert.equal(wheel.querySelectorAll('path').length, 10)
      for (const [index, label] of labels.entries()) {
        assert.equal(label.getAttribute('transform'), 'rotate(' + (index + 0.5) * 36 + ' 180 180)')
        assert.equal(label.querySelectorAll('text').length, 2)
        const prize = label.querySelector('.lucky-wheel__prize')
        const caption = label.querySelector('.lucky-wheel__caption')
        const expectedPrize = expectedPrizes[wheelIndex][index]
        const expectedValue = expectedPrize === 'Lần sau' ? 'lần sau'
          : expectedPrize === 'Miễn ship' ? 'miễn ship' : expectedPrize
        const expectedCaption = expectedPrize === 'Lần sau' ? 'May mắn' : 'Voucher'
        assert.equal(caption.textContent, expectedCaption)
        assert.equal(prize.textContent, expectedValue)
        assert.deepEqual([...label.querySelectorAll('text')], [caption, prize])
        assert.equal(label.getAttribute('aria-label'), expectedCaption + ' ' + expectedValue)
        for (const [text, y] of [[caption, '59'], [prize, '75']]) {
          assert.equal(text.children.length, 0)
          assert.equal(text.getAttribute('x'), '180')
          assert.equal(text.getAttribute('y'), y)
          assert.equal(text.getAttribute('text-anchor'), 'middle')
        }
      }
    }
  } finally {
    dom.window.close()
  }
})

test('form liên hệ gửi đúng chủ đề và hiển thị lỗi mạng, lỗi máy chủ bằng tiếng Việt', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/contact' })
  let failure = 'network'
  const requests = []
  const replacements = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async (_url, options) => {
      requests.push(JSON.parse(options.body))
      if (failure === 'network') throw new TypeError('Failed to fetch')
      return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 })
    },
  }
  const originals = new Map(Object.keys(replacements).map(key => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]))
  for (const [key, value] of Object.entries(replacements)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  try {
    await act(async () => root.render(React.createElement(Contact, { account: { id: 'contact-qa', csrfToken: 'contact-csrf' } })))
    const select = document.querySelector('.contact-form-card select')
    assert.equal(select.options.length, 5)
    await act(async () => {
      select.value = 'Thanh toán & biên nhận'
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
    const form = document.querySelector('.contact-form-card form')
    for (failure of ['network', 'server']) {
      await act(async () => form.dispatchEvent(new window.Event('submit', {
        bubbles: true,
        cancelable: true,
      })))
      assert.equal(requests.at(-1).topic, 'Thanh toán & biên nhận')
      const error = document.querySelector('[role="alert"]').textContent
      assert.doesNotMatch(error, /Failed to fetch|Internal Server Error/)
      assert.match(error, /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i)
      assert.equal(document.querySelector('[type="submit"]').disabled, false)
    }
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test('khách gửi contact không gọi API, lưu bản nháp và yêu cầu đăng nhập', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/contact' })
  let requests = 0
  let redirect = ''
  const replacements = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    sessionStorage: dom.window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async () => { requests += 1; return new Response('{}', { status: 200 }) },
  }
  const originals = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  try {
    window.sessionStorage.setItem('storeContactDraftV1', JSON.stringify({ name: 'Khách thử', email: 'qa@example.com', topic: 'Thanh toán & biên nhận', message: 'Cần hỗ trợ khi chưa đăng nhập' }))
    await act(async () => root.render(React.createElement(Contact, { onRequireLogin: () => { redirect = '/contact' } })))
    const message = document.querySelector('#contact-message')
    assert.equal(message.value, 'Cần hỗ trợ khi chưa đăng nhập')
    await act(async () => document.querySelector('.contact-form-card form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })))
    assert.equal(requests, 0)
    assert.equal(redirect, '/contact')
    assert.equal(JSON.parse(window.sessionStorage.getItem('storeContactDraftV1')).message, 'Cần hỗ trợ khi chưa đăng nhập')
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})
