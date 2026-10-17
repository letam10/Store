import assert from 'node:assert/strict'
import test from 'node:test'
import importedProducts from '../src/data/imported-products.json' with { type: 'json' }
import details from '../src/data/product-details.json' with { type: 'json' }
import manifest from '../shared/catalog-manifest.json' with { type: 'json' }
import { products } from '../src/data/products.js'

test('bổ sung nội dung cho mọi sản phẩm nhập mà không đổi giá, ảnh, mã hay danh mục', () => {
  const byId = new Map(products.map((product) => [String(product.id), product]))
  assert.equal(products.length, 1000)
  assert.equal(byId.size, products.length)
  assert.equal(Object.keys(details).length, importedProducts.length)
  const selectedImported = manifest.products.filter((product) => product.source !== 'store-designed')
  assert.equal(selectedImported.length, 996)
  for (const original of selectedImported) {
    const enriched = byId.get(String(original.id))
    assert.ok(details[original.id], original.id)
    for (const key of ['id', 'sourceId', 'name', 'price', 'category', 'image', 'images', 'stockCount', 'discountPercent', 'sourceUrl']) {
      assert.deepEqual(enriched[key], original[key], original.id + ': ' + key)
    }
    assert.ok(enriched.description.trim(), original.id)
    assert.ok(enriched.features.length, original.id)
    for (const value of Object.values(enriched.specifications)) {
      assert.ok(['string', 'number'].includes(typeof value), original.id)
      assert.doesNotMatch(String(value), /NaN|undefined|\[object Object\]/, original.id)
    }
  }
})

test('thông số chỉ lấy từ nguồn và mẫu tự thiết kế nêu rõ thông tin chưa công bố', () => {
  const sourcedProduct = products.find((product) => product.source !== 'store-designed' && product.brand)
  assert.ok(sourcedProduct)
  assert.equal(sourcedProduct.brand, details[sourcedProduct.id].brand)
  const importedProduct = products.find((product) => product.source !== 'store-designed')
  assert.ok(importedProduct)
  assert.ok(Object.keys(importedProduct.specifications).length > 0)
  assert.ok(importedProduct.description.length > 80)
  for (const product of products.slice(0, 4)) {
    assert.ok(product.description.length > 200)
    assert.ok(Object.keys(product.specifications).length >= 4)
    assert.match(Object.values(product.specifications).join(' '), /Chưa được công bố/)
  }
})
