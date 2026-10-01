import assert from 'node:assert/strict'
import test from 'node:test'
import importedProducts from '../src/data/imported-products.json' with { type: 'json' }
import details from '../src/data/product-details.json' with { type: 'json' }
import { products } from '../src/data/products.js'

test('bổ sung nội dung cho mọi sản phẩm nhập mà không đổi giá, ảnh, mã hay danh mục', () => {
  const byId = new Map(products.map((product) => [String(product.id), product]))
  assert.equal(products.length, 2000)
  assert.equal(byId.size, products.length)
  assert.equal(Object.keys(details).length, importedProducts.length)
  for (const original of importedProducts) {
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
  const notebook = products.find((product) => product.sourceId === '0da4c835-29b6-0d6f-8b5b-104dccbd0026')
  assert.equal(notebook.brand, 'AmazonBasics')
  assert.match(notebook.features.join(' '), /4 GB RAM.*1 TB HDD/)
  const strainer = products.find((product) => product.id === 'dummyjson-57')
  assert.equal(strainer.specifications['Mã mẫu'], 'KIT-BRD-FIN-057')
  assert.match(strainer.specifications['Khối lượng theo nguồn'], /chưa nêu đơn vị/)
  for (const product of products.slice(0, 4)) {
    assert.ok(product.description.length > 200)
    assert.ok(Object.keys(product.specifications).length >= 4)
    assert.match(Object.values(product.specifications).join(' '), /Chưa được công bố/)
  }
})
