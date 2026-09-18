function linkedAbortController(signal, timeoutMs) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    },
  }
}

function ollamaError(message, code = 'OLLAMA_ERROR') {
  const error = new Error(message)
  error.code = code
  return error
}

export class OllamaClient {
  constructor({ baseUrl, model, timeoutMs }) {
    this.baseUrl = baseUrl
    this.model = model
    this.timeoutMs = timeoutMs
  }

  async check() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.min(this.timeoutMs, 3000))
    try {
      const response = await fetch(this.baseUrl + '/api/tags', { signal: controller.signal })
      if (!response.ok) {
        return { connected: false, modelPresent: false, error: 'HTTP_' + response.status }
      }
      const payload = await response.json()
      const names = (payload.models || []).map((item) => item.name || item.model)
      return {
        connected: true,
        modelPresent: names.includes(this.model),
        models: names,
      }
    } catch (error) {
      return {
        connected: false,
        modelPresent: false,
        error: error?.name === 'AbortError' ? 'TIMEOUT' : 'UNREACHABLE',
      }
    } finally {
      clearTimeout(timer)
    }
  }

  async *chatStream({ messages, think, numCtx, numPredict, signal }) {
    const linked = linkedAbortController(signal, this.timeoutMs)
    try {
      const response = await fetch(this.baseUrl + '/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          think,
          options: {
            num_ctx: numCtx,
            num_predict: numPredict,
          },
        }),
        signal: linked.signal,
      })

      if (!response.ok) {
        const code = response.status === 404 ? 'MODEL_NOT_FOUND' : 'OLLAMA_HTTP_' + response.status
        throw ollamaError('Ollama trả về lỗi HTTP ' + response.status + '.', code)
      }
      if (!response.body) throw ollamaError('Ollama không trả về stream.', 'OLLAMA_NO_STREAM')

      const decoder = new TextDecoder()
      let buffer = ''
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true })
        let newline = buffer.indexOf('\n')
        while (newline >= 0) {
          const line = buffer.slice(0, newline).trim()
          buffer = buffer.slice(newline + 1)
          if (line) {
            let payload
            try {
              payload = JSON.parse(line)
            } catch {
              throw ollamaError('Stream Ollama chứa JSON không hợp lệ.', 'OLLAMA_BAD_STREAM')
            }
            if (payload.error) throw ollamaError('Ollama báo lỗi khi sinh nội dung.', 'OLLAMA_STREAM_ERROR')
            const content = payload.message?.content
            if (content) yield content
            // payload.message.thinking cố ý bị bỏ qua và không bao giờ chuyển tới trình duyệt.
          }
          newline = buffer.indexOf('\n')
        }
      }

      const tail = (buffer + decoder.decode()).trim()
      if (tail) {
        let payload
        try {
          payload = JSON.parse(tail)
        } catch {
          throw ollamaError('Phần cuối stream Ollama không hợp lệ.', 'OLLAMA_BAD_STREAM')
        }
        if (payload.error) throw ollamaError('Ollama báo lỗi khi sinh nội dung.', 'OLLAMA_STREAM_ERROR')
        if (payload.message?.content) yield payload.message.content
      }
    } catch (error) {
      if (linked.signal.aborted) {
        const aborted = new Error(signal?.aborted ? 'Tác vụ đã bị hủy.' : 'Ollama quá thời gian chờ.')
        aborted.name = signal?.aborted ? 'AbortError' : 'TimeoutError'
        aborted.code = signal?.aborted ? 'ABORTED' : 'OLLAMA_TIMEOUT'
        throw aborted
      }
      throw error
    } finally {
      linked.cleanup()
    }
  }
}
