#!/usr/bin/env node

/**
 * Giảm có kiểm soát Đồ gia dụng và Trang phục để catalog runtime còn 500 mục.
 * Chỉ giữ lại bản ghi đang có trong manifest; không bổ sung sản phẩm mới.
 * Chọn đại diện theo độ khác nhau của tên, loại nguồn và nhóm sản phẩm để
 * loại trùng/tương tự trước khi đạt số lượng mục tiêu.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(scriptDirectory, '..', '..', '..')
const adminRoot = path.resolve(storeRoot, '..', 'Store-Admin')
const storeManifestPath = path.join(storeRoot, 'shared', 'catalog-manifest.json')
const adminManifestPath = path.join(adminRoot, 'shared', 'catalog-manifest.json')
const featuredIds = new Set(['1', '2', '3', '4'])
const targetCounts = Object.freeze({
  'Đồ gia dụng': 70,
  'Trang phục': 69,
})
const shouldWrite = process.argv.includes('--write')

const stopWords = new Set([
  'amazon', 'brand', 'collection', 'essentials', 'everyday', 'solimo', 'amazonbasics',
  'marketplace', 'màu', 'color', 'size', 'the', 'fix', 'drop', 'nữ', 'nam', 'women',
  'men', 'woman', 'man', 'for', 'and', 'with', 'kèm', 'bộ', 'món', 'chiếc', 'cái',
  'loại', 'nguồn', 'thời', 'trang', 'cao', 'cấp', 'chính', 'hãng', 'premium', 'new',
])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, (match) => match === 'Đ' ? 'D' : 'd')
    .toLocaleLowerCase('vi')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token))
}

function sourceType(product) {
  const feature = (product.features || []).find((item) => /^loai nguon\s*:/i.test(normalize(item)))
  return normalize(feature?.split(':').slice(1).join(':') || product.source || 'unknown')
}

function metadata(product, index) {
  const fullTokens = tokens(product.name)
  const baseName = String(product.name || '').split(/\s+-\s+|\(/, 1)[0]
  const coreTokens = tokens(baseName)
  return {
    product,
    index,
    nameKey: normalize(product.name),
    coreKey: coreTokens.join(' '),
    sourceType: sourceType(product),
    tokens: new Set(fullTokens),
  }
}

function jaccard(left, right) {
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  let intersection = 0
  for (const token of left) if (right.has(token)) intersection += 1
  return intersection / union.size
}

function similarity(left, right) {
  if (left.nameKey === right.nameKey) return 1
  if (left.coreKey && left.coreKey === right.coreKey) return 0.98
  const typeBonus = left.sourceType === right.sourceType ? 0.1 : 0
  return Math.min(0.96, jaccard(left.tokens, right.tokens) + typeBonus)
}

function selectDiverse(products, count) {
  const pool = products.map(metadata)
  const selected = []
  while (selected.length < count) {
    let best = null
    let bestScore = Number.POSITIVE_INFINITY
    for (const candidate of pool) {
      if (selected.some((item) => item.product.id === candidate.product.id)) continue
      const maxSimilarity = selected.length
        ? Math.max(...selected.map((item) => similarity(candidate, item)))
        : 0
      const sourceTypeSeen = selected.some((item) => item.sourceType === candidate.sourceType)
      const sourceSeen = selected.some((item) => item.product.source === candidate.product.source)
      const score = maxSimilarity - (sourceTypeSeen ? 0 : 0.08) - (sourceSeen ? 0 : 0.02) + candidate.index / 1e9
      if (score < bestScore) {
        best = candidate
        bestScore = score
      }
    }
    if (!best) throw new Error(`Không đủ sản phẩm để giữ lại ${count} mục.`)
    selected.push(best)
  }
  return selected.map((item) => item.product)
}

function similarityPairCount(products, threshold) {
  const items = products.map(metadata)
  let count = 0
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      if (similarity(items[left], items[right]) >= threshold) count += 1
    }
  }
  return count
}

function categoryCounts(products) {
  return Object.fromEntries([...new Set(products.map((product) => product.category))]
    .sort((left, right) => left.localeCompare(right, 'vi'))
    .map((category) => [category, products.filter((product) => product.category === category).length]))
}

const storeManifest = readJson(storeManifestPath)
const adminManifest = readJson(adminManifestPath)
const storeIds = storeManifest.products.map((product) => String(product.id))
const adminIds = adminManifest.products.map((product) => String(product.id))
if (JSON.stringify(storeIds) !== JSON.stringify(adminIds)) throw new Error('Manifest Store và Admin đang lệch ID hoặc thứ tự.')
if (JSON.stringify(storeIds.slice(0, 4)) !== JSON.stringify([...featuredIds])) throw new Error('Bốn sản phẩm nền phải đứng đầu manifest.')

const keepIds = new Set(featuredIds)
const report = {}
for (const [category, target] of Object.entries(targetCounts)) {
  const candidates = storeManifest.products.filter((product) => product.category === category && !featuredIds.has(String(product.id)))
  if (candidates.length < target) throw new Error(`${category}: cần ${target}, chỉ có ${candidates.length} sản phẩm.`)
  const selected = selectDiverse(candidates, target)
  for (const product of selected) keepIds.add(String(product.id))
  report[category] = {
    before: candidates.length,
    after: selected.length,
    removed: candidates.length - selected.length,
    similarPairsBefore: similarityPairCount(candidates, 0.75),
    similarPairsAfter: similarityPairCount(selected, 0.75),
  }
}

for (const product of storeManifest.products) {
  if (!targetCounts[product.category] || featuredIds.has(String(product.id))) keepIds.add(String(product.id))
}

const products = storeManifest.products.filter((product) => keepIds.has(String(product.id)))
const output = { ...storeManifest, selectedCount: products.length, products }
const outputText = `${JSON.stringify(output, null, 2)}\n`
if (shouldWrite) {
  fs.writeFileSync(storeManifestPath, outputText, 'utf8')
  fs.writeFileSync(adminManifestPath, outputText, 'utf8')
}

console.log(JSON.stringify({
  ok: true,
  dryRun: !shouldWrite,
  selectedCount: products.length,
  importedCount: products.filter((product) => !featuredIds.has(String(product.id))).length,
  categories: categoryCounts(products),
  report,
  storeManifestPath,
  adminManifestPath,
}, null, 2))
