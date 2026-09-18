import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'

const DEMO_ORDERS = Object.freeze([
  ['DEMO-1001', '2026-09-01', 'completed', 890000, 0, 1],
  ['DEMO-1002', '2026-09-03', 'paid', 249000, 0, 1],
  ['DEMO-1003', '2026-09-07', 'completed', 1290000, 159000, 1],
  ['DEMO-1004', '2026-09-09', 'cancelled', 159000, 0, 1],
])

export class StoreDb {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true })
    this.db = new Database(path)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.#migrate()
    this.#seedDemoOrders()
  }

  close() {
    this.db.close()
  }

  #migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK(kind IN ('support', 'admin')),
        owner_key TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        compact_status TEXT NOT NULL DEFAULT 'not_needed',
        last_compacted_message_id INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_owner
        ON conversations(kind, owner_key, updated_at);

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 1,
        sources_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation
        ON messages(conversation_id, id);

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        business_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
        refund_amount INTEGER NOT NULL DEFAULT 0 CHECK(refund_amount >= 0),
        is_demo INTEGER NOT NULL DEFAULT 1
      );
    `)
  }

  #seedDemoOrders() {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO orders (id, business_date, status, total_amount, refund_amount, is_demo) VALUES (?, ?, ?, ?, ?, ?)',
    )
    const transaction = this.db.transaction((rows) => {
      for (const row of rows) insert.run(...row)
    })
    transaction(DEMO_ORDERS)
  }

  getSetting(key) {
    return this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value ?? null
  }

  setSetting(key, value) {
    const now = new Date().toISOString()
    this.db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, String(value), now)
  }

  createAdmin({ username, passwordSalt, passwordHash }) {
    const now = new Date().toISOString()
    return this.db.prepare(
      'INSERT INTO admins (username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)',
    ).run(username, passwordSalt, passwordHash, now)
  }

  getAdminByUsername(username) {
    return this.db.prepare('SELECT * FROM admins WHERE username = ? COLLATE NOCASE').get(username) ?? null
  }

  createAdminSession({ tokenHash, adminId, expiresAt }) {
    const now = new Date().toISOString()
    this.db.prepare(
      'INSERT INTO admin_sessions (token_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    ).run(tokenHash, adminId, expiresAt, now)
  }

  getAdminSession(tokenHash) {
    return this.db.prepare(`
      SELECT s.token_hash, s.expires_at, a.id AS admin_id, a.username
      FROM admin_sessions s
      JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ?
    `).get(tokenHash) ?? null
  }

  deleteAdminSession(tokenHash) {
    this.db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash)
  }

  cleanupExpiredSessions() {
    this.db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(new Date().toISOString())
  }

  createConversation({ kind, ownerKey }) {
    const now = new Date().toISOString()
    const conversation = {
      id: randomUUID(),
      kind,
      owner_key: ownerKey,
      summary: '',
      compact_status: 'not_needed',
      last_compacted_message_id: 0,
      created_at: now,
      updated_at: now,
    }
    this.db.prepare(`
      INSERT INTO conversations
        (id, kind, owner_key, summary, compact_status, last_compacted_message_id, created_at, updated_at)
      VALUES
        (@id, @kind, @owner_key, @summary, @compact_status, @last_compacted_message_id, @created_at, @updated_at)
    `).run(conversation)
    return conversation
  }

  getConversation(id) {
    return this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) ?? null
  }

  getMessages(conversationId) {
    return this.db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC',
    ).all(conversationId)
  }

  getLastMessage(conversationId) {
    return this.db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1',
    ).get(conversationId) ?? null
  }

  addMessage({ conversationId, role, content, sources = [], completed = true }) {
    const now = new Date().toISOString()
    const result = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, completed, sources_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(conversationId, role, content, completed ? 1 : 0, JSON.stringify(sources), now)
    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId)
    return Number(result.lastInsertRowid)
  }

  updateCompact({ conversationId, summary, status, lastCompactedMessageId }) {
    this.db.prepare(`
      UPDATE conversations
      SET summary = ?, compact_status = ?, last_compacted_message_id = ?, updated_at = ?
      WHERE id = ?
    `).run(summary, status, lastCompactedMessageId, new Date().toISOString(), conversationId)
  }

  calculateRevenue({ from, to }) {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS all_orders,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) AS included_orders,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'completed') THEN total_amount ELSE 0 END), 0) AS gross_revenue,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'completed') THEN refund_amount ELSE 0 END), 0) AS refunds,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'completed') THEN total_amount - refund_amount ELSE 0 END), 0) AS net_revenue,
        SUM(CASE WHEN is_demo = 1 THEN 1 ELSE 0 END) AS demo_orders
      FROM orders
      WHERE business_date BETWEEN ? AND ?
    `).get(from, to)

    return {
      from,
      to,
      timezone: 'Asia/Ho_Chi_Minh',
      includedStatuses: ['paid', 'completed'],
      excludedStatuses: ['cancelled'],
      allOrders: Number(row.all_orders || 0),
      includedOrders: Number(row.included_orders || 0),
      grossRevenue: Number(row.gross_revenue || 0),
      refunds: Number(row.refunds || 0),
      netRevenue: Number(row.net_revenue || 0),
      currency: 'VND',
      dataMode: Number(row.all_orders || 0) > 0 && Number(row.demo_orders || 0) === Number(row.all_orders || 0)
        ? 'demo'
        : 'mixed-or-real',
    }
  }
}
