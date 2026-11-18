/*
  FILE NOTE
  - Mục đích: Kiểm thử render tin nhắn AI trong CustomerSupport: loại bỏ dấu sao thừa (**100**, **số 3**, * *), hiển thị ảnh inline và lightbox phóng to ảnh.
  - Liên kết trực tiếp: src/components/ui/CustomerSupport.jsx, src/components/ui/CustomerSupport.css
  - Vùng ảnh hưởng khi sửa: Bộ kiểm thử chất lượng hiển thị tin nhắn AI và khung chat khách hàng.
*/
import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const storeDir = fs.existsSync(path.resolve(process.cwd(), 'src'))
  ? process.cwd()
  : path.resolve(process.cwd(), 'Store')

const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import CustomerSupport from './src/components/ui/CustomerSupport.jsx';
    const root = createRoot(document.getElementById('root'));
    window.renderAccount = account => root.render(React.createElement(CustomerSupport, { account }));`,
    resolveDir: storeDir,
    loader: 'jsx',
  },
  bundle: true, platform: 'browser', format: 'iife', write: false, jsx: 'automatic',
  loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

async function waitFor(predicate, timeoutMs = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 15))
  }
  assert.fail('Không đạt trạng thái mong đợi sau ' + timeoutMs + 'ms')
}

test('CSS khung chat AI: mặc định 320px, mở 600px, panel 800px co giãn tối đa 150px', () => {
  const css = fs.readFileSync(path.resolve(storeDir, 'src/components/ui/CustomerSupport.css'), 'utf8')
  // Chiều rộng mặc định 320px
  assert.match(css, /\.customer-support\s*\{[^}]*width:\s*320px;/)
  // Chiều rộng khi mở 600px
  assert.match(css, /\.customer-support--open\s*\{[^}]*width:\s*600px;/)
  // Chiều cao panel khi mở 800px, co giãn tối đa 150px
  assert.match(css, /\.customer-support__panel\s*\{[^}]*height:\s*min\(800px,\s*calc\(100dvh\s*-\s*150px\)\);/)
})

test('AI tin nhắn làm sạch dấu sao thừa (**100**, **số 3**, * *Thương hiệu:*)', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.localStorage.setItem('storeSupportConversationId:99', 'conv-asterisks')
  window.fetch = async url => {
    if (String(url).includes('/conversations/')) {
      return {
        ok: true,
        json: async () => ({
          messages: [
            {
              id: 'ast-1',
              role: 'assistant',
              content: '10 nhân 10 bằng **100**.\nTrái Đất là hành tinh **số 3** trong hệ Mặt Trời.\n* *Thương hiệu:* Sony\n* *Bảo hành:* 12 tháng\nSản phẩm **Tai nghe không dây Sony** chất lượng cao.\n***\nChào bạn! ***',
              status: 'completed',
            },
          ],
        }),
      }
    }
    return { ok: true, json: async () => ({ reachable: true, modelAvailable: true }) }
  }

  window.eval(bundle.outputFiles[0].text)
  try {
    window.renderAccount({ id: 99, csrfToken: 'token' })
    await waitFor(() => window.document.querySelector('.customer-support__toggle'))
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.document.querySelector('.customer-support__bubble'))

    const aside = window.document.querySelector('aside.customer-support')
    assert.ok(aside.classList.contains('customer-support--open'), 'Aside phải có class customer-support--open khi mở')
    assert.ok(aside.style.width.includes('600px'), 'Aside phải có inline style width 600px khi mở')

    const bubble = window.document.querySelector('.customer-support__incoming .customer-support__bubble')
    assert.ok(bubble, 'Phải có bong bóng tin nhắn của trợ lý AI')

    const bubbleText = bubble.textContent
    // Không còn dấu ** quanh 100
    assert.doesNotMatch(bubbleText, /\*\*100\*\*/)
    assert.match(bubbleText, /10 nhân 10 bằng 100\./)

    // Không còn dấu ** quanh số 3
    assert.doesNotMatch(bubbleText, /\*\*số 3\*\*/)
    assert.match(bubbleText, /hành tinh số 3 trong hệ Mặt Trời/)

    // Không còn dấu * *Thương hiệu:*
    assert.doesNotMatch(bubbleText, /\*\s+\*Thương hiệu:\*/)
    assert.match(bubbleText, /•\s*Thương hiệu:\s*Sony/)

    // Không còn dấu sao *** thừa ở cuối câu
    assert.doesNotMatch(bubbleText, /\*\*\*/)
    assert.match(bubbleText, /Chào bạn!/)

    // Thẻ strong vẫn được tạo cho tên sản phẩm quan trọng
    const strongs = Array.from(bubble.querySelectorAll('strong')).map(s => s.textContent)
    assert.ok(strongs.includes('Tai nghe không dây Sony'), 'Tên sản phẩm phải được in đậm bằng thẻ <strong>')
    assert.ok(strongs.includes('Thương hiệu:'), 'Nhãn Thương hiệu: phải được in đậm bằng thẻ <strong>')

    // Thẻ hr ngăn cách dòng được tạo từ ***
    const hr = bubble.querySelector('hr.customer-support__divider')
    assert.ok(hr, 'Phải có divider cho dòng ***')
  } finally {
    window.close()
  }
})

test('AI hiển thị ảnh sản phẩm thật và mở lightbox xem ảnh lớn khi bấm', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.localStorage.setItem('storeSupportConversationId:100', 'conv-images')
  window.fetch = async url => {
    if (String(url).includes('/conversations/')) {
      return {
        ok: true,
        json: async () => ({
          messages: [
            {
              id: 'img-1',
              role: 'assistant',
              content: 'Dưới đây là tai nghe:\n1. **Tai nghe Everyday**\n• Giá bán: 890.000₫\n![Tai nghe Everyday](/products/ai-generated-500/0001-1.webp)\n[Xem chi tiết](/products/1)\n\nSản phẩm thứ 2:\nẢnh: [/products/ai-generated-500/0002-2.webp]\n\nSản phẩm thứ 3 và 4 trên cùng 1 dòng:\n• Ảnh sản phẩm: /products/ai-generated-500/0003-3.webp ![Mẫu 4](/products/ai-generated-500/0001-1.webp)',
              status: 'completed',
            },
          ],
        }),
      }
    }
    return { ok: true, json: async () => ({ reachable: true, modelAvailable: true }) }
  }

  window.eval(bundle.outputFiles[0].text)
  try {
    window.renderAccount({ id: 100, csrfToken: 'token' })
    await waitFor(() => window.document.querySelector('.customer-support__toggle'))
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.document.querySelector('.customer-support__incoming img'))

    const images = window.document.querySelectorAll('.customer-support__incoming img')
    assert.equal(images.length, 4, 'Phải render đúng 4 thẻ img sản phẩm')
    assert.equal(images[0].getAttribute('src'), '/products/ai-generated-500/0001-1.webp')
    assert.equal(images[0].getAttribute('alt'), 'Tai nghe Everyday')
    assert.equal(images[1].getAttribute('src'), '/products/ai-generated-500/0002-2.webp')
    assert.equal(images[2].getAttribute('src'), '/products/ai-generated-500/0003-3.webp')
    assert.equal(images[3].getAttribute('src'), '/products/ai-generated-500/0001-1.webp')

    // Kiểm tra link [Xem chi tiết]
    const link = window.document.querySelector('.customer-support__incoming a.customer-support__link')
    assert.ok(link, 'Phải có link sản phẩm')
    assert.equal(link.getAttribute('href'), '/products/1')
    assert.equal(link.textContent, 'Xem chi tiết')

    // Bấm vào ảnh thứ nhất để mở Lightbox
    const imageWrap = images[0].closest('.customer-support__image-wrap')
    assert.ok(imageWrap, 'Ảnh phải nằm trong wrapper có thể bấm')
    imageWrap.click()

    await waitFor(() => window.document.querySelector('.customer-support__lightbox'))
    const lightbox = window.document.querySelector('.customer-support__lightbox')
    assert.ok(lightbox, 'Lightbox xem ảnh lớn phải xuất hiện')
    const lightboxImg = lightbox.querySelector('img')
    assert.equal(lightboxImg.getAttribute('src'), '/products/ai-generated-500/0001-1.webp')

    // Đóng bằng phím Escape trên window
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    await waitFor(() => !window.document.querySelector('.customer-support__lightbox'))
    assert.equal(window.document.querySelector('.customer-support__lightbox'), null, 'Lightbox đã đóng thành công bằng phím Escape')
  } finally {
    window.close()
  }
})
