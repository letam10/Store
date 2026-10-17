#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(directory, '..', '..')
const adminRoot = path.resolve(storeRoot, '..', 'Store-Admin')
const featuredIds = ['1', '2', '3', '4']

function loadManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'shared', 'catalog-manifest.json'), 'utf8'))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function audit(root, manifest) {
  assert(manifest.schemaVersion === 1, `${root}: schemaVersion không phải 1`)
  assert(manifest.selectedCount === 1000, `${root}: selectedCount không phải 1000`)
  assert(Array.isArray(manifest.products) && manifest.products.length === 1000, `${root}: số sản phẩm không phải 1000`)
  const ids = manifest.products.map((product) => String(product.id))
  assert(new Set(ids).size === ids.length, `${root}: ID bị trùng`)
  assert(JSON.stringify(ids.slice(0, 4)) === JSON.stringify(featuredIds), `${root}: bốn ID đầu không phải 1..4`)
  assert(ids.filter((id) => !featuredIds.includes(id)).length === 996, `${root}: số sản phẩm nhập không phải 996`)
  const categoryCounts = new Map()
  for (const product of manifest.products) {
    assert(product.name && product.category && product.description, `${root}: thiếu trường nội dung ở ${product.id}`)
    assert(product.image && product.image.startsWith('/products/'), `${root}: ảnh không hợp lệ ở ${product.id}`)
    const image = path.join(root, 'public', product.image.replace(/^\/+/, ''))
    assert(fs.existsSync(image), `${root}: không tìm thấy ảnh ${product.image}`)
    categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1)
  }
  return { count: manifest.products.length, ids, categoryCounts: Object.fromEntries(categoryCounts) }
}

const store = loadManifest(storeRoot)
const admin = loadManifest(adminRoot)
const storeAudit = audit(storeRoot, store)
const adminAudit = audit(adminRoot, admin)
assert(JSON.stringify(storeAudit.ids) === JSON.stringify(adminAudit.ids), 'ID Store và Admin không đồng nhất')
console.log(JSON.stringify({ ok: true, count: storeAudit.count, categories: storeAudit.categoryCounts, idsMatch: true }, null, 2))
