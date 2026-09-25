import assert from 'node:assert/strict'
import test from 'node:test'
import { displayCategory, enrichProducts, mostViewed, similarProducts } from '../src/storefront/catalog.js'

test('demo catalog groups jewelry, apparel, laptops, electronics and components', () => {
  assert.equal(displayCategory({ name: 'Gold Pendant Necklace', category: 'Đời sống' }), 'Trang sức')
  assert.equal(displayCategory({ name: 'Dress Pump', category: 'Đời sống' }), 'Trang phục')
  assert.equal(displayCategory({ name: 'Laptop', category: 'Công nghệ' }), 'Laptop')
  assert.equal(displayCategory({ name: 'Phone Charger Cable', category: 'Công nghệ' }), 'Linh kiện')
})

test('admin offer overrides demo discount and view ranking excludes out of stock', () => {
  const imported = enrichProducts()
  assert.equal(imported.length, 1000)
  assert.equal(imported[4].discountPercent, 15)
  const changed = enrichProducts([{ id: imported[4].id, discountPercent: 20, stockCount: 0, viewCount: 100 }, { id: imported[5].id, discountPercent: 5, stockCount: 2, viewCount: 10 }])
  assert.equal(changed[4].price, Math.round(changed[4].originalPrice * .8 / 10) * 10)
  assert.equal(changed[4].stockCount, 0)
  assert.equal(mostViewed(changed, 1)[0].id, imported[5].id)
  assert.ok(similarProducts(changed, changed[4]).every((item) => item.stockCount !== 0 && item.category === changed[4].category))
})
