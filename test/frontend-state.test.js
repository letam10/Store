import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequestGate } from '../src/api/requestGate.js'
import { applyRestore, createRestoreGuard } from '../src/components/ui/customerSupportState.js'

test('slow restore cannot overwrite first active streaming turn', () => {
  const gate = createRequestGate()
  const restore = createRestoreGuard('old-conversation')
  const token = restore.begin()
  const active = gate.tryBegin()
  restore.invalidate()
  const current = [
    { id: 'user-local', role: 'user', content: 'xin chào' },
    { id: 'assistant-local', role: 'assistant', content: 'đang stream' },
  ]
  const result = applyRestore(current, [{ id: 1, role: 'user', content: 'old' }], {
    canApply: restore.canApply(token, { requestActive: gate.locked, currentConversationId: 'new-conversation' }),
  })
  assert.deepEqual(result, current)
  gate.finish(active.epoch)
})

test('reload restore applies once when no request is active', () => {
  const restore = createRestoreGuard('saved')
  const token = restore.begin()
  const result = applyRestore([], [{ id: 1, role: 'user', content: 'hello', sources: [] }], {
    canApply: restore.canApply(token, { requestActive: false, currentConversationId: 'saved' }),
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].content, 'hello')
})

test('synchronous request gate rejects rapid double send and cancel releases it', () => {
  const gate = createRequestGate()
  const first = gate.tryBegin()
  assert.ok(first)
  assert.equal(gate.tryBegin(), null)
  gate.cancel()
  assert.ok(gate.tryBegin())
})
