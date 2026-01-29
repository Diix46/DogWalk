CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_rate_limits_ip ON rate_limits (ip, created_at);
CREATE INDEX idx_rate_limits_expires ON rate_limits (expires_at);
