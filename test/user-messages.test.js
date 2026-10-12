import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { apiErrorMessage, userMessage } from '../src/api/userMessages.js'
import { customerApi } from '../src/api/customer.js'
import { apiJson, streamChat } from '../src/api/chat.js'
import { mapServerMessages } from '../src/components/ui/customerSupportState.js'

const generic = 'Không thể hoàn tất thao tác.'
const adminRoot = process.env.STORE_ADMIN_ROOT || join(homedir(), 'source', 'repos', 'Store-Admin')
const serverFile = name => pathToFileURL(join(adminRoot, 'backend', 'server', 'src', name))

test('customer, payment, support, security and queue API codes all have Vietnamese messages', () => {
  const codes = new Set()
  for (const file of ['customer.js', 'orderWorkflow.js', 'app.js', 'queue.js', 'security.js']) {
    const source = readFileSync(serverFile(file), 'utf8')
    const patterns = [
      /(?:error:|code:)\s*'([A-Z_]+)'/g,
      /(?:throw new Error|fail|queueError)\('([A-Z_]+)'/g,
      /code === '([A-Z_]+)'/g,
    ]
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) codes.add(match[1])
    }
  }
  const adminOnly = new Set([
    'INVALID_CONTEXT_SIZE', 'MODULE_NOT_FOUND', 'INVALID_RECORD', 'RECORD_NOT_FOUND',
    'INVALID_APPEARANCE', 'INVALID_PRODUCT', 'FEATURED_PRODUCT_PROTECTED', 'INVALID_PRODUCT_OFFER',
  ])
  for (const code of codes) {
    if (adminOnly.has(code)) continue
    const translated = apiErrorMessage({ error: code, message: 'Internal server failure' })
    assert.notEqual(translated, generic, code)
    assert.doesNotMatch(translated, /[A-Z]{2,}_[A-Z_]+|Internal server failure/, code)
    assert.match(translated, /[à-ỹđ]/i, code)
  }
})

test('unknown API codes never leak English, internal messages or raw codes', () => {
  for (const payload of [null, {}, { error: 'NEW_ERROR', message: 'SQL connection failed' },
    { message: 'Lỗi SQL_SECRET: internal failure' }, { error: 'constructor' }]) {
    assert.equal(apiErrorMessage(payload), generic)
    assert.equal(apiErrorMessage(payload, 503), 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.')
  }
  assert.equal(apiErrorMessage({}, 429), apiErrorMessage({ error: 'RATE_LIMITED' }))
  assert.equal(apiErrorMessage({}, 401), apiErrorMessage({ error: 'UNAUTHENTICATED' }))
})

test('native network, timeout and JSON errors become Vietnamese; safe Vietnamese text is preserved', () => {
  for (const message of ['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed']) {
    assert.equal(userMessage(new TypeError(message)), apiErrorMessage({ error: 'NETWORK_ERROR' }))
  }
  assert.equal(userMessage(new DOMException('signal timed out', 'TimeoutError')),
    apiErrorMessage({ error: 'TIMEOUT' }))
  assert.equal(userMessage(new SyntaxError('Unexpected token < in JSON')), apiErrorMessage({ error: 'INVALID_RESPONSE' }))
  assert.equal(userMessage(new Error('Vui lòng nhập số điện thoại.')), 'Vui lòng nhập số điện thoại.')
  assert.equal(userMessage(new Error('QuotaExceededError')), generic)
  assert.equal(userMessage('RAW_ERROR', 'English fallback'), generic)
  assert.equal(userMessage('RAW_ERROR', 'Vui lòng thử lại.'), 'Vui lòng thử lại.')
  assert.equal(userMessage('INVALID_CREDENTIALS'), apiErrorMessage({ error: 'INVALID_CREDENTIALS' }))
})

async function withFetch(mock, run) {
  const original = globalThis.fetch
  globalThis.fetch = mock
  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

const clients = [
  () => customerApi('/api/customer/me'),
  () => apiJson('/api/support/conversations/test'),
  () => streamChat({ endpoint: '/api/support/chat', message: 'Xin chào', requestId: 'request_12345' }),
]

test('every API client localizes HTTP and network failures and retains error codes', async () => {
  for (const client of clients) {
    await withFetch(async () => new Response(JSON.stringify({
      error: 'RATE_LIMITED', message: 'Too many requests',
    }), { status: 429 }), async () => {
      await assert.rejects(client, (error) => error.code === 'RATE_LIMITED'
        && error.message === apiErrorMessage({ error: 'RATE_LIMITED' }))
    })
    await withFetch(async () => { throw new TypeError('Failed to fetch') }, async () => {
      await assert.rejects(client, { message: apiErrorMessage({ error: 'NETWORK_ERROR' }) })
    })
    await withFetch(async () => new Response('gateway failed', { status: 502 }), async () => {
      await assert.rejects(client, { message: apiErrorMessage({}, 502) })
    })
  }
})

test('API clients preserve AbortError identity during fetch and response parsing', async () => {
  const abort = new DOMException('This operation was aborted', 'AbortError')
  for (const client of clients) {
    await withFetch(async () => { throw abort }, async () => {
      await assert.rejects(client, (error) => error === abort)
    })
    await withFetch(async () => ({ ok: false, status: 400, json: async () => { throw abort } }), async () => {
      await assert.rejects(client, (error) => error === abort)
    })
  }
})

test('malformed success JSON fails visibly; timeout remains localized', async () => {
  for (const client of clients.slice(0, 2)) {
    await withFetch(async () => new Response('not json'), async () => {
      await assert.rejects(client, { message: apiErrorMessage({ error: 'INVALID_RESPONSE' }) })
    })
  }
  for (const client of clients) {
    await withFetch(async () => { throw new DOMException('expired', 'TimeoutError') }, async () => {
      await assert.rejects(client, { message: apiErrorMessage({ error: 'TIMEOUT' }) })
    })
  }
})

test('stream error callback and thrown error use translated text and preserve incomplete state', async () => {
  const events = []
  const body = JSON.stringify({ type: 'error', code: 'QUEUE_TIMEOUT', message: 'Queue timed out', partial: true })
  await withFetch(async () => new Response(body + '\n'), async () => {
    await assert.rejects(() => streamChat({
      endpoint: '/api/support/chat', message: 'Xin chào', requestId: 'request_12345',
      onEvent: (event) => events.push(event),
    }), (error) => error.code === 'QUEUE_TIMEOUT' && error.incomplete
      && error.message === apiErrorMessage({ code: 'QUEUE_TIMEOUT' }))
  })
  assert.equal(events[0].message, apiErrorMessage({ code: 'QUEUE_TIMEOUT' }))
})

test('stream reader network errors are translated and release the reader', async () => {
  let cancelled = false
  let released = false
  const response = {
    ok: true,
    body: { getReader: () => ({
      read: async () => { throw new TypeError('network interrupted') },
      cancel: async () => { cancelled = true },
      releaseLock: () => { released = true },
    }) },
  }
  await withFetch(async () => response, async () => {
    await assert.rejects(clients[2], (error) => error.incomplete
      && error.message === apiErrorMessage({ error: 'NETWORK_ERROR' }))
  })
  assert.equal(cancelled, true)
  assert.equal(released, true)
})

test('restored chat errors cannot leak native English failures', () => {
  const messages = mapServerMessages([
    { id: 1, role: 'assistant', content: '', error: 'Failed to fetch' },
    { id: 2, role: 'assistant', content: 'Đã trả lời', error: '' },
  ])
  assert.equal(messages[0].error, apiErrorMessage({ error: 'NETWORK_ERROR' }))
  assert.equal(messages[1].error, '')
})
