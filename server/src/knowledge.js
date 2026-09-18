import { products, productDataMeta } from '../../shared/products.js'
import { approvedPolicies, missingPolicyMessage } from '../../shared/storePolicies.js'

const PRODUCT_TERMS = /sản phẩm|giá|mua|tai nghe|túi|đồng hồ|ly|công nghệ|phụ kiện|đời sống|tư vấn/i
const POLICY_TERMS = /đổi trả|hoàn tiền|bảo hành|giao hàng|vận chuyển|chính sách|nội quy/i
const REPORT_TERMS = /doanh thu|thống kê|báo cáo|đơn hàng|refund|hoàn tiền/i
const STOP_WORDS = new Set(['sản', 'phẩm', 'giá', 'mua', 'cho', 'tôi', 'mình', 'bạn', 'của', 'store', 'tư', 'vấn'])

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
}

export function searchProducts(message, limit = 4) {
  if (!PRODUCT_TERMS.test(message)) return []
  const words = normalize(message)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))

  const ranked = products
    .map((product) => {
      const haystack = normalize([product.name, product.category, product.label].join(' '))
      const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0)
      return { product, score }
    })
    .sort((a, b) => b.score - a.score)

  const matched = ranked.filter((entry) => entry.score > 0).map((entry) => entry.product)
  if (matched.length > 0) return matched.slice(0, limit)
  return products.slice(0, limit)
}

export function buildSupportKnowledge(message) {
  const matchedProducts = searchProducts(message)
  const policyRequested = POLICY_TERMS.test(message)
  const sections = []
  const sources = []

  if (matchedProducts.length > 0) {
    sections.push(
      'DỮ LIỆU SẢN PHẨM DEMO HIỆN TẠI:\n' +
      matchedProducts.map((product) =>
        '- Mã ' + product.id + ': ' + product.name + '; danh mục ' + product.category +
        '; giá ' + product.price + ' VND; nhãn ' + product.label + '.'
      ).join('\n') +
      '\nKhông có dữ liệu tồn kho trong nguồn hiện tại.',
    )
    for (const product of matchedProducts) {
      sources.push({
        kind: 'product',
        id: 'product:' + product.id,
        label: 'Dữ liệu sản phẩm demo · ' + product.name,
        dataMode: productDataMeta.mode,
      })
    }
  }

  if (policyRequested) {
    if (approvedPolicies.length === 0) {
      sections.push('CHÍNH SÁCH ĐÃ DUYỆT: chưa có. Khi được hỏi, trả lời đúng câu: "' + missingPolicyMessage + '"')
      sources.push({
        kind: 'policy',
        id: 'policy:none',
        label: 'Chính sách Store · chưa có nội dung được duyệt',
      })
    } else {
      sections.push('CHÍNH SÁCH ĐÃ DUYỆT:\n' + approvedPolicies.map((item) => '- ' + item).join('\n'))
      sources.push({ kind: 'policy', id: 'policy:approved', label: 'Chính sách Store đã duyệt' })
    }
  }

  if (sections.length === 0) {
    sections.push(
      'Không có dữ liệu Store liên quan được tra cứu cho câu hỏi này. Không suy đoán giá, tồn kho, đơn hàng hoặc chính sách.',
    )
  }

  return { text: sections.join('\n\n'), sources }
}

export function isReportRequest(message) {
  return REPORT_TERMS.test(message)
}

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return { year: map.year, month: map.month, day: map.day }
}

export function resolveReportRange(message) {
  const dates = String(message).match(/\b\d{4}-\d{2}-\d{2}\b/g) || []
  if (dates.length >= 2) return { from: dates[0], to: dates[1], inferred: false }
  if (dates.length === 1) return { from: dates[0], to: dates[0], inferred: false }
  const now = localDateParts()
  return {
    from: now.year + '-' + now.month + '-01',
    to: now.year + '-' + now.month + '-' + now.day,
    inferred: true,
  }
}

export function buildAdminKnowledge(message, report) {
  const support = buildSupportKnowledge(message)
  const sections = [support.text]
  const sources = [...support.sources]

  if (report) {
    sections.push(
      'BÁO CÁO BACKEND ĐÃ TÍNH:\n' +
      '- Khoảng thời gian: ' + report.from + ' đến ' + report.to + ' (' + report.timezone + ').\n' +
      '- Trạng thái tính doanh thu: ' + report.includedStatuses.join(', ') + '.\n' +
      '- Đơn bị loại: ' + report.excludedStatuses.join(', ') + '.\n' +
      '- Tổng đơn trong khoảng: ' + report.allOrders + '.\n' +
      '- Đơn được tính: ' + report.includedOrders + '.\n' +
      '- Doanh thu gộp: ' + report.grossRevenue + ' ' + report.currency + '.\n' +
      '- Hoàn tiền đã trừ: ' + report.refunds + ' ' + report.currency + '.\n' +
      '- Doanh thu ròng: ' + report.netRevenue + ' ' + report.currency + '.\n' +
      '- Chế độ dữ liệu: ' + report.dataMode + '.\n' +
      'AI chỉ được diễn giải các số liệu này, không tự tính lại từ dữ liệu thô.',
    )
    sources.push({
      kind: 'report',
      id: 'report:revenue:' + report.from + ':' + report.to,
      label: 'Backend SQLite · doanh thu ' + report.from + ' → ' + report.to,
      dataMode: report.dataMode,
    })
  }

  return { text: sections.join('\n\n'), sources }
}
