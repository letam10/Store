export class ContextBudgetError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ContextBudgetError'
    this.code = 'CONTEXT_TOO_LARGE'
  }
}

export function estimateTokens(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  // Ước lượng bảo thủ, không phải tokenizer chính xác của qwen.
  return Math.ceil((text?.length || 0) / 3) + 1
}

function parseSources(raw) {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function clip(value, max = 420) {
  const text = String(value).replace(/\s+/g, ' ').trim()
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

export function buildCompactSummary(messages, existingSummary = '', maxChars = 6000) {
  const lines = []
  if (existingSummary) lines.push(clip(existingSummary, Math.floor(maxChars * 0.35)))

  for (const message of messages) {
    if (message.role === 'user') {
      lines.push('Người dùng nói: ' + clip(message.content))
      continue
    }

    lines.push('Store đã trả lời (không dùng câu này làm dữ liệu biến động): ' + clip(message.content))
    const sources = parseSources(message.sources_json)
    const stableRefs = sources
      .filter((source) => source?.kind === 'product')
      .map((source) => source.id)
      .filter(Boolean)
    if (stableRefs.length > 0) {
      lines.push('Tham chiếu sản phẩm đã xác minh lúc đó: ' + stableRefs.join(', ') + '. Giá/tồn kho phải tra cứu lại.')
    }
    if (sources.some((source) => source?.kind === 'report')) {
      lines.push('Đã có báo cáo backend trước đó; số liệu doanh thu phải tra cứu lại cho yêu cầu hiện tại.')
    }
  }

  const summary = lines.join('\n')
  return summary.length <= maxChars ? summary : summary.slice(summary.length - maxChars)
}

function promptTokenEstimate({ systemPrompt, knowledgeText, summary, messages, outputBudget }) {
  const messageTokens = messages.reduce(
    (total, message) => total + estimateTokens(message.content) + 12,
    0,
  )
  return estimateTokens(systemPrompt) +
    estimateTokens(knowledgeText) +
    estimateTokens(summary) +
    messageTokens +
    outputBudget
}

export function prepareConversationContext({
  storeDb,
  conversation,
  systemPrompt,
  knowledgeText,
  numCtx,
  outputBudget,
}) {
  const allMessages = storeDb.getMessages(conversation.id)
  let summary = conversation.summary || ''
  let lastCompactedId = Number(conversation.last_compacted_message_id || 0)
  let activeMessages = allMessages.filter((message) => message.id > lastCompactedId)
  const hardBudget = Math.floor(numCtx * 0.8)

  let estimated = promptTokenEstimate({
    systemPrompt,
    knowledgeText,
    summary,
    messages: activeMessages,
    outputBudget,
  })

  let compactStatus = conversation.compact_status || 'not_needed'

  if (estimated > hardBudget) {
    const keepRecent = 8
    if (activeMessages.length <= keepRecent) {
      storeDb.updateCompact({
        conversationId: conversation.id,
        summary,
        status: 'failed',
        lastCompactedMessageId: lastCompactedId,
      })
      throw new ContextBudgetError('Ngữ cảnh hiện tại quá lớn và không thể compact an toàn.')
    }

    const compacted = activeMessages.slice(0, -keepRecent)
    const maxSummaryChars = Math.min(12000, Math.floor(numCtx * 0.15 * 3))
    summary = buildCompactSummary(compacted, summary, maxSummaryChars)
    lastCompactedId = compacted.at(-1).id
    activeMessages = activeMessages.slice(-keepRecent)
    compactStatus = 'compacted'

    estimated = promptTokenEstimate({
      systemPrompt,
      knowledgeText,
      summary,
      messages: activeMessages,
      outputBudget,
    })

    if (estimated > hardBudget) {
      storeDb.updateCompact({
        conversationId: conversation.id,
        summary: conversation.summary || '',
        status: 'failed',
        lastCompactedMessageId: Number(conversation.last_compacted_message_id || 0),
      })
      throw new ContextBudgetError('Compact không đủ để đưa ngữ cảnh về ngân sách an toàn.')
    }

    storeDb.updateCompact({
      conversationId: conversation.id,
      summary,
      status: compactStatus,
      lastCompactedMessageId: lastCompactedId,
    })
  }

  const modelMessages = [{ role: 'system', content: systemPrompt }]
  if (summary) {
    modelMessages.push({
      role: 'system',
      content:
        'TÓM TẮT HỘI THOẠI DO BACKEND QUẢN LÝ. Đây là bản tóm tắt có thể thiếu chi tiết; dữ liệu biến động phải tra cứu lại.\n' +
        summary,
    })
  }
  modelMessages.push({ role: 'system', content: 'DỮ LIỆU TRA CỨU CHO LƯỢT NÀY:\n' + knowledgeText })
  modelMessages.push(
    ...activeMessages.map((message) => ({ role: message.role, content: message.content })),
  )

  return {
    messages: modelMessages,
    compactStatus,
    estimatedTokens: estimated,
    budgetTokens: hardBudget,
  }
}
