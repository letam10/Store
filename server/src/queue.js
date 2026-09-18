function abortError() {
  const error = new Error('Tác vụ đã bị hủy.')
  error.name = 'AbortError'
  error.code = 'ABORTED'
  return error
}

export class GenerationQueue {
  constructor({ concurrency = 1, maxQueued = 4 } = {}) {
    this.concurrency = concurrency
    this.maxQueued = maxQueued
    this.active = 0
    this.waiting = []
  }

  get snapshot() {
    return { active: this.active, queued: this.waiting.length }
  }

  run(task, signal) {
    if (signal?.aborted) return Promise.reject(abortError())
    if (this.active >= this.concurrency && this.waiting.length >= this.maxQueued) {
      const error = new Error('Hàng đợi AI đang đầy.')
      error.code = 'QUEUE_FULL'
      return Promise.reject(error)
    }

    return new Promise((resolve, reject) => {
      const item = { task, signal, resolve, reject, onAbort: null }
      item.onAbort = () => {
        const index = this.waiting.indexOf(item)
        if (index >= 0) {
          this.waiting.splice(index, 1)
          reject(abortError())
        }
      }
      signal?.addEventListener('abort', item.onAbort, { once: true })

      if (this.active < this.concurrency) this.#start(item)
      else this.waiting.push(item)
    })
  }

  #start(item) {
    item.signal?.removeEventListener('abort', item.onAbort)
    if (item.signal?.aborted) {
      item.reject(abortError())
      this.#drain()
      return
    }

    this.active += 1
    Promise.resolve()
      .then(() => item.task(item.signal))
      .then(item.resolve, item.reject)
      .finally(() => {
        this.active -= 1
        this.#drain()
      })
  }

  #drain() {
    while (this.active < this.concurrency && this.waiting.length > 0) {
      this.#start(this.waiting.shift())
    }
  }
}
