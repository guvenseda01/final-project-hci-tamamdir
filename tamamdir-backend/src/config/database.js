const { Pool } = require('pg');

let pool;

// Convert SQLite ? placeholders to PostgreSQL $1, $2, … notation
function toPostgres(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function run(sql, params = []) {
  const result = await pool.query(toPostgres(sql), params);
  return { rowCount: result.rowCount };
}

async function get(sql, params = []) {
  const result = await pool.query(toPostgres(sql), params);
  return result.rows[0] ?? null;
}

async function all(sql, params = []) {
  const result = await pool.query(toPostgres(sql), params);
  return result.rows;
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
    is_verified          INTEGER DEFAULT 0,
    is_verified_student  INTEGER DEFAULT 0,
    is_provider          INTEGER DEFAULT 0,
    wallet_balance   REAL DEFAULT 0.0,
    total_earnings   REAL DEFAULT 0.0,
    rating           REAL DEFAULT 0.0,
    review_count     INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
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
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS service_images (
    id         TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    is_cover   INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    service_id      TEXT NOT NULL REFERENCES services(id),
    buyer_id        TEXT NOT NULL REFERENCES users(id),
    provider_id     TEXT NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'pending',
    price_at_order  REAL NOT NULL,
    note            TEXT,
    scheduled_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id            TEXT PRIMARY KEY,
    participant_a TEXT NOT NULL REFERENCES users(id),
    participant_b TEXT NOT NULL REFERENCES users(id),
    service_id    TEXT REFERENCES services(id),
    last_message  TEXT,
    last_msg_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    is_read         INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS conversation_tamamdir (
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    service_id      TEXT NOT NULL REFERENCES services(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    confirmed_at    TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, service_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS conversation_service_arrangements (
    conversation_id      TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    service_id           TEXT NOT NULL REFERENCES services(id),
    cancel_count         INTEGER DEFAULT 0,
    customer_cancel_count INTEGER DEFAULT 0,
    provider_cancel_count INTEGER DEFAULT 0,
    banned_until         TIMESTAMPTZ,
    banned_user_id       TEXT REFERENCES users(id),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, service_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL UNIQUE REFERENCES orders(id),
    service_id  TEXT NOT NULL REFERENCES services(id),
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    provider_id TEXT NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS user_reviews (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL UNIQUE REFERENCES orders(id),
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    reviewee_id TEXT NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT,
    is_read    INTEGER DEFAULT 0,
    ref_id     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS service_favorites (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, service_id)
  )`,
  `CREATE TABLE IF NOT EXISTS email_verifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id)`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)`,
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
  if (row && parseInt(row.n) > 0) return;

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
      'INSERT INTO categories (id,name,icon,slug) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
      [uuidv4(), c.name, c.icon, c.slug]
    );
  }
  console.log(`🌱  Seeded ${cats.length} categories`);
}

async function initDB() {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const stmt of SCHEMA_STATEMENTS) {
    await pool.query(stmt);
  }

  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_student INTEGER DEFAULT 0'
  );
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1'
  );
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ'
  );
  await pool.query(
    'ALTER TABLE conversations ADD COLUMN IF NOT EXISTS service_id TEXT REFERENCES services(id)'
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversation_service_arrangements (
      conversation_id      TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      service_id           TEXT NOT NULL REFERENCES services(id),
      cancel_count         INTEGER DEFAULT 0,
      customer_cancel_count INTEGER DEFAULT 0,
      provider_cancel_count INTEGER DEFAULT 0,
      banned_until         TIMESTAMPTZ,
      banned_user_id       TEXT REFERENCES users(id),
      updated_at           TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (conversation_id, service_id)
    )
  `);
  await pool.query(
    'ALTER TABLE conversation_service_arrangements ADD COLUMN IF NOT EXISTS customer_cancel_count INTEGER DEFAULT 0'
  );
  await pool.query(
    'ALTER TABLE conversation_service_arrangements ADD COLUMN IF NOT EXISTS provider_cancel_count INTEGER DEFAULT 0'
  );
  await pool.query(`
    UPDATE conversation_service_arrangements
    SET customer_cancel_count = cancel_count
    WHERE customer_cancel_count = 0 AND cancel_count > 0
  `);
  await pool.query(`
    UPDATE users SET is_verified_student = 1
    WHERE is_verified_student = 0
      AND (
        LOWER(email) LIKE '%@iyte.edu.tr'
        OR LOWER(email) LIKE '%@std.iyte.edu.tr'
      )
  `);
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_rating REAL DEFAULT 0.0'
  );
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_review_count INTEGER DEFAULT 0'
  );
  await pool.query(
    "ALTER TABLE services ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'on_campus'"
  );
  await pool.query(
    "UPDATE services SET location_type = 'gulbahce' WHERE location_type = 'near_campus'"
  );
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0'
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id   TEXT NOT NULL,
      reason      TEXT NOT NULL,
      details     TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC)'
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_blocks (
      blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (blocker_id, blocked_id),
      CHECK (blocker_id != blocked_id)
    )
  `);
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id)'
  );

  // Allow multiple conversations per pair (one per service)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_a_participant_b_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_service_unique
    ON conversations (participant_a, participant_b, service_id)
    WHERE service_id IS NOT NULL
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_legacy_unique
    ON conversations (participant_a, participant_b)
    WHERE service_id IS NULL
  `);

  await seed();
  console.log(`📦  PostgreSQL connected: ${process.env.DATABASE_URL}`);
}

module.exports = { initDB, run, get, all };
