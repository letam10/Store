import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeTheme, presetTheme, themeVariables } from '../shared/theme.js'
import { accountCartKey, cartStorageKey, migrateLegacyCart } from '../src/storefront/state.js'

test('theme contract keeps all presets and safe fallback', () => {
  const theme = normalizeTheme({ presetId: 'olive', defaultMode: 'dark', dark: { colors: { accent: 'bad' }, radius: { card: 99 } } })
  assert.equal(theme.schemaVersion, 1)
  assert.equal(theme.presetId, 'olive')
  assert.equal(theme.defaultMode, 'dark')
  assert.match(theme.dark.colors.accent, /^#[0-9A-F]{6}$/)
  assert.equal(theme.dark.radius.card, 16)
  assert.equal(themeVariables(theme, 'dark')['--accent'], theme.dark.colors.accent)
})

test('theme presets provide independent normalized documents', () => {
  const forest = presetTheme('forest')
  const terracotta = presetTheme('terracotta')
  assert.notEqual(forest.presetId, terracotta.presetId)
  assert.notEqual(forest.light.colors.accent, terracotta.light.colors.accent)
})

test('cart keys isolate guest and accounts and migrate legacy once', () => {
  const storage = new Map([['storeCartV1', JSON.stringify([{ id: 'old' }])]])
  const adapter = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) }
  assert.equal(cartStorageKey(null), 'storeCartGuestV2')
  assert.equal(accountCartKey('42'), 'storeCartAccountV2:42')
  assert.equal(migrateLegacyCart(adapter), true)
  assert.equal(storage.has('storeCartV1'), false)
  assert.equal(migrateLegacyCart(adapter), false)
})
