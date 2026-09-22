import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { routeName } from '../src/storefront/state.js'
import { apiEndpoint } from '../src/api/endpoint.js'

test('customer project has no admin/backend source or imports', () => {
  for (const path of ['server', 'ai', 'src/pages/Admin.jsx', 'src/pages/AdminModules.jsx', 'src/pages/adminState.js']) {
    assert.equal(existsSync(resolve(path)), false, path)
  }
  const walk = (folder) => readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(folder, entry.name)) : [join(folder, entry.name)])
  for (const path of walk('src').filter((path) => /\.(js|jsx)$/.test(path))) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), /(?:from\s+['"][^'"]*Admin|\/api\/admin|href\s*=\s*['"]\/admin|Bạn là admin|Đi tới Admin)/)
  }
  assert.equal(routeName('/admin'), 'not-found')
  assert.equal(routeName('/admin/settings'), 'not-found')
})

test('same-origin support endpoint is default and local artwork ships with customer app', () => {
  assert.equal(apiEndpoint('/api/support/chat'), '/api/support/chat')
  for (const name of ['headphones', 'bag', 'watch', 'cup']) {
    assert.match(readFileSync('public/products/' + name + '.svg', 'utf8'), /<svg/)
  }
  assert.match(readFileSync('public/_redirects', 'utf8'), /\/index.html 200/)
})
