CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    discord_user_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    discord_user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    mp_payment_id TEXT UNIQUE,
    pix_copy_paste TEXT,
    pix_qr_base64 TEXT,
    created_at INTEGER NOT NULL,
    paid_at INTEGER,
    delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_orders_pending_delivery
    ON orders(status, delivered_at, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user
    ON orders(discord_user_id, created_at);

