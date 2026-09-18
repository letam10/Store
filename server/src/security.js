import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(value) {
  return createHash('sha256').update(String(value)).digest('hex')
}

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(password, salt, 64).toString('hex')
  return { salt, hash: derived }
}

export function verifyPassword(password, salt, expectedHash) {
  try {
    const actual = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex')
    const expected = Buffer.from(expectedHash, 'hex')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function parseCookies(header = '') {
  const result = {}
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(value)
    } catch {
      result[key] = value
    }
  }
  return result
}

export function setCookie(res, name, value, {
  maxAge,
  secure = false,
  sameSite = 'Strict',
  httpOnly = true,
  path = '/',
} = {}) {
  const parts = [
    name + '=' + encodeURIComponent(value),
    'Path=' + path,
    'SameSite=' + sameSite,
  ]
  if (httpOnly) parts.push('HttpOnly')
  if (secure) parts.push('Secure')
  if (Number.isFinite(maxAge)) parts.push('Max-Age=' + Math.max(0, Math.floor(maxAge)))
  res.append('Set-Cookie', parts.join('; '))
}

export function clearCookie(res, name, options = {}) {
  setCookie(res, name, '', { ...options, maxAge: 0 })
}

export class SlidingWindowLimiter {
  constructor({ limit, windowMs }) {
    this.limit = limit
    this.windowMs = windowMs
    this.entries = new Map()
  }

  consume(key) {
    const now = Date.now()
    const cutoff = now - this.windowMs
    const previous = (this.entries.get(key) || []).filter((timestamp) => timestamp > cutoff)
    if (previous.length >= this.limit) {
      const retryAfterMs = Math.max(1000, previous[0] + this.windowMs - now)
      this.entries.set(key, previous)
      return { allowed: false, retryAfterMs }
    }
    previous.push(now)
    this.entries.set(key, previous)
    return { allowed: true, retryAfterMs: 0 }
  }
}
