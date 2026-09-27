/**
 * @codex-vn-doc
 * Tệp: test/chat-stream.test.js
 * Mục đích: Tệp kiểm thử tự động cho các luồng chính và tình huống biên của module này.
 * Thành phần chính: các hàm/lớp và xử lý nội bộ trong tệp.
 * Liên kết trực tiếp: node:assert/strict, node:test, ../src/api/chat.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiStreamError, streamChat } from '../src/api/chat.js'

// Chức năng responseFrom: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function responseFrom(parts, { status = 200 } = {}) {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      controller.close()
    },
  }), { status, headers: { 'content-type': 'application/x-ndjson' } })
}

// Kiểm thử edge case: frontend requires done event even after deltas.
test('frontend requires done event even after deltas', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => responseFrom(['{"type":"delta","content":"partial"}\n'])
  try {
    await assert.rejects(
      () => streamChat({ endpoint: '/x', message: 'x', requestId: 'request_12345' }),
      (error) => error instanceof ApiStreamError && error.code === 'INCOMPLETE_STREAM',
    )
  } finally {
    globalThis.fetch = original
  }
})

// Kiểm thử edge case: frontend accepts split unicode stream ending with done.
test('frontend accepts split unicode stream ending with done', async () => {
  const original = globalThis.fetch
  const events = []
  globalThis.fetch = async () => responseFrom([
    '{"type":"delta","content":"Xin ',
    '🌱"}\n{"type":"done","conversationId":"c1"}',
  ])
  try {
    await streamChat({
      endpoint: '/x',
      message: 'x',
      requestId: 'request_12345',
      onEvent: (event) => events.push(event),
    })
    assert.equal(events.at(-1).type, 'done')
  } finally {
    globalThis.fetch = original
  }
})

// Kiểm thử edge case: frontend rejects event after done.
test('frontend rejects event after done', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => responseFrom([
    '{"type":"done","conversationId":"c1"}\n',
    '{"type":"delta","content":"late"}\n',
  ])
  try {
    await assert.rejects(
      () => streamChat({ endpoint: '/x', message: 'x', requestId: 'request_12345' }),
      (error) => error instanceof ApiStreamError && error.code === 'BAD_STREAM',
    )
  } finally {
    globalThis.fetch = original
  }
})
