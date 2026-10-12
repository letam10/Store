/**
 * @codex-vn-doc
 * Tệp: src/api/chat.js
 * Mục đích: Client gọi chat hỗ trợ và đọc luồng NDJSON, xử lý done/error/abort.
 * Thành phần chính: ApiStreamError, apiJson, streamChat.
 * Liên kết trực tiếp: ./endpoint.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { apiEndpoint, apiCredentials } from './endpoint.js'
import { apiErrorMessage, userMessage } from './userMessages.js'
export class ApiStreamError extends Error {
  constructor(message, code = 'API_ERROR', extra = {}) {
    super(userMessage({ code, message }))
    this.name = 'ApiStreamError'
    this.code = code
    Object.assign(this, extra)
  }
}

// Chức năng readError: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
async function readError(response) {
  try {
    const body = await response.json()
    return new ApiStreamError(apiErrorMessage(body, response.status), body?.error || 'API_ERROR')
  } catch (error) {
    if (error.name === 'AbortError') throw error
    if (error.name === 'TimeoutError') return new ApiStreamError(userMessage(error), 'TIMEOUT')
    return new ApiStreamError(apiErrorMessage({}, response.status), 'HTTP_' + response.status)
  }
}

async function fetchLocalized(url, options) {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiStreamError(userMessage(error), error.code)
  }
}

// Chức năng apiJson: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export async function apiJson(url, options = {}) {
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const response = await fetchLocalized(apiEndpoint(url), {
    credentials: apiCredentials,
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!response.ok) throw await readError(response)
  try {
    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiStreamError(userMessage(error), error.code)
  }
}

// Chức năng validateEvent: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function validateEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event) || typeof event.type !== 'string') {
    throw new ApiStreamError('Backend trả về event không hợp lệ.', 'BAD_STREAM_EVENT')
  }
  if (event.type === 'delta' && typeof event.content !== 'string') {
    throw new ApiStreamError('Event delta thiếu content hợp lệ.', 'BAD_STREAM_EVENT')
  }
  if (event.type === 'done' && typeof event.conversationId !== 'string') {
    throw new ApiStreamError('Event done thiếu conversationId.', 'BAD_STREAM_EVENT')
  }
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (event.type === 'error' && typeof event.code !== 'string') {
    throw new ApiStreamError('Event error thiếu code.', 'BAD_STREAM_EVENT')
  }
  return event
}

// Chức năng streamChat: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export async function streamChat({
  endpoint,
  message,
  conversationId,
  requestId,
  csrfToken,
  signal,
  onEvent,
}) {
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const response = await fetchLocalized(apiEndpoint(endpoint), {
    method: 'POST',
    credentials: apiCredentials,
    signal,
    headers: {
      'content-type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    body: JSON.stringify({
      message,
      requestId,
      ...(conversationId ? { conversationId } : {}),
    }),
  })

  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!response.ok) throw await readError(response)
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  if (!response.body) throw new ApiStreamError('Trình duyệt không nhận được stream.', 'NO_STREAM')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let terminalReceived = false
  let cleanEof = false

  // Chức năng consume: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const consume = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let event
    try { event = validateEvent(JSON.parse(trimmed)) }
    // Nhánh lỗi: chuyển ngoại lệ thành phản hồi an toàn và giữ trạng thái nhất quán.
    catch (error) {
      // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
      if (error instanceof ApiStreamError) throw error
      throw new ApiStreamError('Backend trả về stream JSON không hợp lệ.', 'BAD_STREAM')
    }
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (terminalReceived) throw new ApiStreamError('Backend gửi event sau done.', 'BAD_STREAM')
    if (event.type === 'error') event.message = apiErrorMessage(event)
    onEvent?.(event)
    if (event.type === 'done') terminalReceived = true
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (event.type === 'error') {
      throw new ApiStreamError(event.message, event.code, {
        incomplete: Boolean(event.incomplete || event.partial),
      })
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        consume(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) consume(buffer)
    cleanEof = true
    if (!terminalReceived) {
      throw new ApiStreamError('Kết nối kết thúc trước event done.', 'INCOMPLETE_STREAM', { incomplete: true })
    }
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof ApiStreamError) throw error
    throw new ApiStreamError(userMessage(error), error.code, { incomplete: true })
  } finally {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!cleanEof || !terminalReceived || signal?.aborted) {
      try { await reader.cancel() } catch { /* best effort */ }
    }
    try { reader.releaseLock() } catch { /* already released */ }
  }
}
