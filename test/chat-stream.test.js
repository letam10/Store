import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiStreamError, streamChat } from '../src/api/chat.js'

function responseFrom(parts, { status = 200 } = {}) {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      controller.close()
    },
  }), { status, headers: { 'content-type': 'application/x-ndjson' } })
}

test('frontend requires done event even after deltas', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => responseFrom(['{"type":"delta","content":"partial"}
'])
  try {
    await assert.rejects(() => streamChat({ endpoint: '/x', message: 'x', requestId: 'request_12345' }), (error) => error instanceof ApiStreamError && error.code === 'INCOMPLETE_STREAM')
  } finally { globalThis.fetch = original }
})

test('frontend accepts split unicode stream ending with done', async () => {
  const original = globalThis.fetch
  const events = []
  globalThis.fetch = async () => responseFrom(['{"type":"delta","content":"Xin ', '🌱"}
{"type":"done","conversationId":"c1"}'])
  try {
    await streamChat({ endpoint: '/x', message: 'x', requestId: 'request_12345', onEvent: (event) => events.push(event) })
    assert.equal(events.at(-1).type, 'done')
  } finally { globalThis.fetch = original }
})
