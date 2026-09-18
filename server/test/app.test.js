import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { StoreDb } from '../src/db.js'
import { hashPassword } from '../src/security.js'

class MockOllama {
  constructor() {
    this.calls = []
  }

  async check() {
    return { connected: true, modelPresent: true, models: ['qwen3.5:4b'] }
  }

  async *chatStream(options) {
    this.calls.push(options)
    yield options.think ? 'Phân tích admin từ dữ liệu backend.' : 'Tư vấn khách từ dữ liệu Store.'
  }
}

function cookiePair(response) {
  return response.headers.get('set-cookie')?.split(';')[0] || ''
}

async function withServer(run) {
  const directory = mkdtempSync(join(tmpdir(), 'store-api-test-'))
  const storeDb = new StoreDb(join(directory, 'test.sqlite'))
  const ollama = new MockOllama()
  const { app } = createApp({ storeDb, ollama })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const baseUrl = 'http://127.0.0.1:' + address.port

  try {
    await run({ baseUrl, storeDb, ollama })
  } finally {
    await new Promise((resolve) => server.close(resolve))
    storeDb.close()
    rmSync(directory, { recursive: true, force: true })
  }
}

test('support chat always forces think=false and rejects client-controlled fields', async () => {
  await withServer(async ({ baseUrl, ollama }) => {
    const invalid = await fetch(baseUrl + '/api/support/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Tư vấn tai nghe', think: true }),
    })
    assert.equal(invalid.status, 400)

    const response = await fetch(baseUrl + '/api/support/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Tư vấn tai nghe' }),
    })
    assert.equal(response.status, 200)
    const stream = await response.text()
    assert.match(stream, /"type":"done"/)
    assert.equal(ollama.calls.length, 1)
    assert.equal(ollama.calls[0].think, false)
  })
})

test('admin chat requires a valid backend session and forces think=true', async () => {
  await withServer(async ({ baseUrl, storeDb, ollama }) => {
    const unauthenticated = await fetch(baseUrl + '/api/admin/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Doanh thu tháng này' }),
    })
    assert.equal(unauthenticated.status, 401)

    const credentials = hashPassword('correct-horse-battery-staple')
    storeDb.createAdmin({
      username: 'owner',
      passwordSalt: credentials.salt,
      passwordHash: credentials.hash,
    })

    const login = await fetch(baseUrl + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'owner',
        password: 'correct-horse-battery-staple',
      }),
    })
    assert.equal(login.status, 200)
    const loginBody = await login.json()
    const cookie = cookiePair(login)
    assert.ok(cookie)
    assert.ok(loginBody.csrfToken)

    const response = await fetch(baseUrl + '/api/admin/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
        'x-csrf-token': loginBody.csrfToken,
      },
      body: JSON.stringify({ message: 'Doanh thu 2026-09-01 đến 2026-09-30' }),
    })
    assert.equal(response.status, 200)
    const stream = await response.text()
    assert.match(stream, /"type":"report"/)
    assert.match(stream, /"type":"done"/)
    assert.equal(ollama.calls.at(-1).think, true)
  })
})

test('support conversations cannot be read with another owner cookie', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await fetch(baseUrl + '/api/support/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Giá túi Everyday Tote' }),
    })
    const ownerCookie = cookiePair(first)
    const stream = await first.text()
    const events = stream.trim().split('\n').map((line) => JSON.parse(line))
    const conversationId = events.find((event) => event.type === 'conversation').conversationId
    assert.ok(ownerCookie)
    assert.ok(conversationId)

    const otherResponse = await fetch(
      baseUrl + '/api/support/conversations/' + encodeURIComponent(conversationId),
      {
        headers: { cookie: 'store_support_id=another-browser-token' },
      },
    )
    assert.equal(otherResponse.status, 404)

    const ownerResponse = await fetch(
      baseUrl + '/api/support/conversations/' + encodeURIComponent(conversationId),
      { headers: { cookie: ownerCookie } },
    )
    assert.equal(ownerResponse.status, 200)
  })
})
