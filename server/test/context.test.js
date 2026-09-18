import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCompactSummary, estimateTokens } from '../src/context.js'
import { buildSupportKnowledge } from '../src/knowledge.js'

test('token estimate is explicitly heuristic and positive', () => {
  assert.ok(estimateTokens('Xin chào Store') > 0)
})

test('compact summary distinguishes user statements and verified product references', () => {
  const summary = buildCompactSummary([
    {
      role: 'user',
      content: 'Tôi thích tai nghe.',
      sources_json: '[]',
    },
    {
      role: 'assistant',
      content: 'Tai nghe Everyday đang có giá trong dữ liệu Store.',
      sources_json: JSON.stringify([{ kind: 'product', id: 'product:1' }]),
    },
  ])

  assert.match(summary, /Người dùng nói:/)
  assert.match(summary, /product:1/)
  assert.match(summary, /Giá\/tồn kho phải tra cứu lại/)
})

test('missing policy never invents an exchange or refund rule', () => {
  const knowledge = buildSupportKnowledge('Chính sách đổi trả và hoàn tiền thế nào?')
  assert.match(knowledge.text, /Store chưa cung cấp thông tin này/)
  assert.ok(knowledge.sources.some((source) => source.id === 'policy:none'))
})
