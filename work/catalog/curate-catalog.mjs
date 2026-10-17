#!/usr/bin/env node

/**
 * Tạo manifest catalog dùng chung cho Store, Admin và server-dotnet.
 * Curation là quyết định xác định: lọc bản ghi lỗi, sắp theo ID và lấy vòng
 * tròn theo danh mục để lần chạy lại luôn có cùng 996 sản phẩm nhập.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(scriptDirectory, '..', '..')
const adminRoot = path.resolve(storeRoot, '..', 'Store-Admin')
const importedPath = path.join(storeRoot, 'src', 'data', 'imported-products.json')
const featuredModulePath = path.join(storeRoot, 'shared', 'products.js')
const storeManifestPath = path.join(storeRoot, 'shared', 'catalog-manifest.json')
const adminManifestPath = path.join(adminRoot, 'shared', 'catalog-manifest.json')

const TARGET_IMPORTED_COUNT = 996
const REQUIRED_TOTAL = 1000
const FEATURED_IDS = ['1', '2', '3', '4']
const FEATURED_IMAGES = {
  '1': '/products/headphones.svg',
  '2': '/products/bag.svg',
  '3': '/products/watch.svg',
  '4': '/products/cup.svg',
}

function normalizeId(value) {
  return String(value ?? '').trim()
}

function compareId(left, right) {
  const a = normalizeId(left)
  const b = normalizeId(right)
  return a < b ? -1 : a > b ? 1 : 0
}

function readBigEndian16(bytes, offset) {
  return bytes.readUInt16BE(offset)
}

function readLittleEndian16(bytes, offset) {
  return bytes.readUInt16LE(offset)
}

function readWebpDimensions(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = bytes.toString('ascii', 12, 16)
  if (chunk === 'VP8X' && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    return { width, height }
  }
  if (chunk === 'VP8 ' && bytes.length >= 30) {
    const width = readLittleEndian16(bytes, 26) & 0x3fff
    const height = readLittleEndian16(bytes, 28) & 0x3fff
    return { width, height }
  }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
    const width = (bits & 0x3fff) + 1
    const height = ((bits >>> 14) & 0x3fff) + 1
    return { width, height }
  }
  return null
}

function readImageDimensions(filePath) {
  const bytes = fs.readFileSync(filePath)
  if (bytes.length >= 24 && bytes.toString('ascii', 1, 4) === 'PNG') {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }
  const webp = readWebpDimensions(bytes)
  if (webp) return webp
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break
    const marker = bytes[offset]
    offset += 1
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) break
    const segmentLength = readBigEndian16(bytes, offset)
    if (segmentLength < 2) break
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isStartOfFrame && offset + 7 < bytes.length) {
      return { width: readBigEndian16(bytes, offset + 5), height: readBigEndian16(bytes, offset + 3) }
    }
    offset += segmentLength
  }
  return null
}

function resolvePublicImage(root, imagePath) {
  const relativePath = String(imagePath || '').replace(/^\/+/, '')
  return path.join(root, 'public', relativePath)
}

function isUsableImage(root, imagePath) {
  if (!String(imagePath || '').startsWith('/products/')) return false
  const filePath = resolvePublicImage(root, imagePath)
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false
  if (path.extname(filePath).toLowerCase() === '.svg') return fs.statSync(filePath).size > 0
  const dimensions = readImageDimensions(filePath)
  if (!dimensions || dimensions.width < 64 || dimensions.height < 64) return false
  const aspect = dimensions.width / dimensions.height
  return aspect >= 0.25 && aspect <= 4
}

function hasRequiredImportedFields(product) {
  const requiredStrings = ['id', 'source', 'sourceId', 'name', 'category', 'description', 'image', 'sourceUrl']
  return requiredStrings.every((key) => typeof product[key] === 'string' && product[key].trim().length > 0)
    && Number.isFinite(Number(product.price))
    && isUsableImage(storeRoot, product.image)
    && isUsableImage(adminRoot, product.image)
}

function deduplicateCandidates(products) {
  const seenId = new Set()
  const seenImage = new Set()
  const seenName = new Set()
  const result = []
  for (const product of [...products].sort((left, right) => compareId(left.id, right.id))) {
    const id = normalizeId(product.id)
    const image = String(product.image).trim().toLowerCase()
    const name = String(product.name).trim().toLocaleLowerCase('vi')
    if (seenId.has(id) || seenImage.has(image) || seenName.has(name)) continue
    seenId.add(id)
    seenImage.add(image)
    seenName.add(name)
    result.push({ ...product, id })
  }
  return result
}

function selectBalancedCandidates(candidates, count) {
  const byCategory = new Map()
  for (const product of candidates) {
    const category = String(product.category).trim()
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category).push(product)
  }
  const categories = [...byCategory.keys()].sort((left, right) => left.localeCompare(right, 'vi'))
  const selected = []
  while (selected.length < count) {
    let progressed = false
    for (const category of categories) {
      const bucket = byCategory.get(category)
      if (!bucket.length) continue
      selected.push(bucket.shift())
      progressed = true
      if (selected.length === count) break
    }
    if (!progressed) throw new Error(`Không đủ sản phẩm hợp lệ: cần ${count}, chỉ có ${selected.length}`)
  }
  return selected
}

function normalizeFeatured(products) {
  const byId = new Map(products.map((product) => [normalizeId(product.id), product]))
  return FEATURED_IDS.map((id) => {
    const product = byId.get(id)
    if (!product) throw new Error(`Thiếu sản phẩm tự thiết kế ID ${id}`)
    const image = FEATURED_IMAGES[id]
    if (!isUsableImage(storeRoot, image) || !isUsableImage(adminRoot, image)) throw new Error(`Ảnh sản phẩm tự thiết kế không hợp lệ: ${image}`)
    return {
      ...product,
      id,
      source: 'store-designed',
      sourceId: id,
      image,
      images: [image],
      discountPercent: 0,
      stockCount: 20,
    }
  })
}

const importedProducts = JSON.parse(fs.readFileSync(importedPath, 'utf8'))
const { products: featuredProducts } = await import(pathToFileURL(featuredModulePath).href)
const validCandidates = importedProducts.filter(hasRequiredImportedFields)
const uniqueCandidates = deduplicateCandidates(validCandidates)
const selectedImported = selectBalancedCandidates(uniqueCandidates, TARGET_IMPORTED_COUNT)
const products = [...normalizeFeatured(featuredProducts), ...selectedImported]
if (products.length !== REQUIRED_TOTAL) throw new Error(`Manifest phải có ${REQUIRED_TOTAL} sản phẩm, nhận ${products.length}`)

const manifest = {
  schemaVersion: 1,
  selectedCount: REQUIRED_TOTAL,
  products,
}
const serialized = `${JSON.stringify(manifest, null, 2)}\n`
fs.writeFileSync(storeManifestPath, serialized)
fs.writeFileSync(adminManifestPath, serialized)

const counts = Object.fromEntries([...new Set(products.map((product) => product.category))].sort((left, right) => left.localeCompare(right, 'vi')).map((category) => [category, products.filter((product) => product.category === category).length]))
console.log(JSON.stringify({ sourceCount: importedProducts.length, validCount: validCandidates.length, uniqueCount: uniqueCandidates.length, selectedCount: products.length, importedSelected: selectedImported.length, categoryCounts: counts, storeManifestPath, adminManifestPath }, null, 2))
