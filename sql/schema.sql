CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT,
    received_at INTEGER NOT NULL,
    expires_at INTEGER,
    html_content TEXT,
    text_content TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    attachment_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inboxes (
    address TEXT PRIMARY KEY,
    password_hash TEXT,
    owner_api_key_id TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (owner_api_key_id) REFERENCES api_keys (id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    r2_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
);