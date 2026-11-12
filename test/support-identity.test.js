import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import CustomerSupport from './src/components/ui/CustomerSupport.jsx';
    const root=createRoot(document.getElementById('root'));
    window.renderAccount=account=>root.render(React.createElement(CustomerSupport,{account}));`, resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, platform: 'browser', format: 'iife', write: false, jsx: 'automatic',
  loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.fail('Chat không đạt trạng thái mong đợi')
}

test('đổi tài khoản không lộ chat; làm mới cùng tài khoản vẫn giữ lịch sử', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  const requested = []
  window.localStorage.setItem('storeSupportConversationId:1', 'a-conversation')
  window.localStorage.setItem('storeSupportConversationId:2', 'b-conversation')
  window.fetch = async url => {
    requested.push(String(url))
    const who = String(url).includes('a-conversation') ? 'A' : 'B'
    return { ok: true, json: async () => String(url).includes('/conversations/')
      ? { messages: [{ id: who, role: 'assistant', content: 'Riêng tư ' + who, status: 'completed' }] }
      : { reachable: true, modelAvailable: true } }
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    window.renderAccount({ id: 1, csrfToken: 'first' })
    await waitFor(() => window.document.querySelector('.customer-support__toggle'))
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.document.body.textContent.includes('Riêng tư A'))
    window.renderAccount({ id: 1, csrfToken: 'refreshed' })
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.match(window.document.body.textContent, /Riêng tư A/)
    window.renderAccount({ id: 2, csrfToken: 'second' })
    await waitFor(() => !window.document.querySelector('.customer-support--open'))
    assert.doesNotMatch(window.document.body.textContent, /Riêng tư A/)
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.document.body.textContent.includes('Riêng tư B'))
    assert.doesNotMatch(window.document.body.textContent, /Riêng tư A/)
    window.renderAccount(null)
    await waitFor(() => !window.document.querySelector('.customer-support--open'))
    assert.doesNotMatch(window.document.body.textContent, /Riêng tư [AB]/)
    assert.equal(requested.filter(url => url.includes('a-conversation')).length, 1)
  } finally { window.close() }
})

test('gửi ngay khi đang kiểm tra lịch sử cũ không dùng hội thoại chưa xác nhận chủ sở hữu', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  let finishRestore
  let sent
  window.localStorage.setItem('storeSupportConversationId', 'foreign-legacy')
  window.TextDecoder = TextDecoder
  window.fetch = async (url, options = {}) => {
    if (String(url).includes('/conversations/')) return new Promise(resolve => { finishRestore = () => resolve({ ok: false, status: 404, json: async () => ({ error: 'CONVERSATION_NOT_FOUND' }) }) })
    if (String(url).endsWith('/chat')) {
      sent = JSON.parse(options.body)
      const wire = [{ type: 'conversation', conversationId: 'own-new' }, { type: 'delta', content: 'Trả lời mới' }, { type: 'done', conversationId: 'own-new' }]
      return { ok: true, body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(wire.map(item => JSON.stringify(item)).join('\n') + '\n'))
        controller.close()
      } }) }
    }
    return { ok: true, json: async () => ({ reachable: true, modelAvailable: true }) }
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    window.renderAccount({ id: 2, csrfToken: 'second' })
    await waitFor(() => finishRestore && window.document.querySelector('.customer-support__toggle'))
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.document.querySelector('#store-support-message'))
    const input = window.document.querySelector('#store-support-message')
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'Xin chào')
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 10))
    window.document.querySelector('.customer-support__form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => sent)
    assert.equal(sent.conversationId, undefined)
    finishRestore()
    await waitFor(() => window.document.body.textContent.includes('Trả lời mới'))
    assert.equal(window.localStorage.getItem('storeSupportConversationId:2'), 'own-new')
  } finally { window.close() }
})
