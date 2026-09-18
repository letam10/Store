export class ApiStreamError extends Error {
  constructor(message, code = 'API_ERROR') {
    super(message)
    this.name = 'ApiStreamError'
    this.code = code
  }
}

async function readError(response) {
  try {
    const body = await response.json()
    return new ApiStreamError(body.message || 'Yêu cầu API thất bại.', body.error || 'API_ERROR')
  } catch {
    return new ApiStreamError('Yêu cầu API thất bại với HTTP ' + response.status, 'HTTP_' + response.status)
  }
}

export async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  if (!response.ok) throw await readError(response)
  return response.json()
}

export async function streamChat({
  endpoint,
  message,
  conversationId,
  csrfToken,
  signal,
  onEvent,
}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    signal,
    headers: {
      'content-type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    body: JSON.stringify({
      message,
      ...(conversationId ? { conversationId } : {}),
    }),
  })

  if (!response.ok) throw await readError(response)
  if (!response.body) throw new ApiStreamError('Trình duyệt không nhận được stream.', 'NO_STREAM')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  async function consume(line) {
    const trimmed = line.trim()
    if (!trimmed) return
    let event
    try {
      event = JSON.parse(trimmed)
    } catch {
      throw new ApiStreamError('Backend trả về stream không hợp lệ.', 'BAD_STREAM')
    }
    onEvent?.(event)
    if (event.type === 'error') {
      throw new ApiStreamError(event.message || 'AI local không thể trả lời.', event.code || 'AI_ERROR')
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        await consume(line)
        newline = buffer.indexOf('\n')
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) await consume(buffer)
  } finally {
    reader.releaseLock()
  }
}
