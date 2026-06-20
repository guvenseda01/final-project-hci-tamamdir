const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let db;

function run(sql, params = []) {
  try {
    const stmt   = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
  } catch (err) {
    return Promise.reject(err);
  }
}

function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const row  = stmt.get(...params);
    return Promise.resolve(row ?? null);
  } catch (err) {
    return Promise.reject(err);
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return Promise.resolve(rows);
  } catch (err) {
    return Promise.reject(err);
  }
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id               TEXT PRIMARY KEY,
    full_name        TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    password_hash    TEXT NOT NULL,
    avatar_url       TEXT,
    bio              TEXT,
    department       TEXT,
    year             TEXT,
    is_verified      INTEGER DEFAULT 0,
    is_provider      INTEGER DEFAULT 0,
    wallet_balance   REAL DEFAULT 0.0,
    total_earnings   REAL DEFAULT 0.0,
    rating           REAL DEFAULT 0.0,
    review_count     INTEGER DEFAULT 0,
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE,
    icon  TEXT,
    slug  TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS user_interests (
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id            TEXT PRIMARY KEY,
    provider_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   TEXT NOT NULL REFERENCES categories(id),
    title         TEXT NOT NULL,
    description   TEXT,
    price         REAL NOT NULL,
    price_unit    TEXT DEFAULT 'session',
    delivery_days INTEGER DEFAULT 1,
    is_active     INTEGER DEFAULT 1,
    rating        REAL DEFAULT 0.0,
    review_count  INTEGER DEFAULT 0,
    order_count   INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS service_images (
    id         TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    is_cover   INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    service_id      TEXT NOT NULL REFERENCES services(id),
    buyer_id        TEXT NOT NULL REFERENCES users(id),
    provider_id     TEXT NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'pending',
    price_at_order  REAL NOT NULL,
    note            TEXT,
    scheduled_at    TEXT,
    completed_at    TEXT,
    cancelled_at    TEXT,
    cancel_reason   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id            TEXT PRIMARY KEY,
    participant_a TEXT NOT NULL REFERENCES users(id),
    participant_b TEXT NOT NULL REFERENCES users(id),
    last_message  TEXT,
    last_msg_at   TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    UNIQUE (participant_a, participant_b)
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    is_read         INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL UNIQUE REFERENCES orders(id),
    service_id  TEXT NOT NULL REFERENCES services(id),
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    provider_id TEXT NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL,
    comment     TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT,
    is_read    INTEGER DEFAULT 0,
    ref_id     TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id)`,
  `CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_buyer      ON orders(buyer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_provider   ON orders(provider_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifs_user       ON notifications(user_id, is_read)`,
];

async function seed() {
  const { v4: uuidv4 } = require('uuid');
  const row = await get('SELECT COUNT(*) AS n FROM categories');
  if (row && row.n > 0) return;

  const cats = [
    { name: 'Coding Lessons',     icon: 'code',              slug: 'coding-lessons'     },
    { name: 'Tennis Coaching',    icon: 'sports_tennis',     slug: 'tennis-coaching'    },
    { name: 'Custom Knitting',    icon: 'yarn',              slug: 'custom-knitting'    },
    { name: 'Graphic Design',     icon: 'palette',           slug: 'graphic-design'     },
    { name: 'Language Exchange',  icon: 'translate',         slug: 'language-exchange'  },
    { name: 'Photography',        icon: 'photo_camera',      slug: 'photography'        },
    { name: 'Instrument Lessons', icon: 'music_note',        slug: 'instrument-lessons' },
    { name: 'Calculus Tutoring',  icon: 'calculate',         slug: 'calculus-tutoring'  },
    { name: 'House Cleaning',     icon: 'cleaning_services', slug: 'house-cleaning'     },
    { name: 'Nail Art',           icon: 'spa',               slug: 'nail-art'           },
    { name: 'Pet Sitting',        icon: 'pets',              slug: 'pet-sitting'        },
    { name: 'Handmade Goods',     icon: 'handyman',          slug: 'handmade-goods'     },
  ];

  for (const c of cats) {
    await run(
      'INSERT OR IGNORE INTO categories (id,name,icon,slug) VALUES (?,?,?,?)',
      [uuidv4(), c.name, c.icon, c.slug]
    );
  }
  console.log(`🌱  Seeded ${cats.length} categories`);
}

async function initDB() {
  const dbPath = path.resolve(__dirname, '../../tamamdir.db');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  for (const stmt of SCHEMA_STATEMENTS) {
    db.exec(stmt);
  }

  await seed();
  console.log(`📦  SQLite connected: ${dbPath}`);
}

module.exports = { initDB, run, get, all };
