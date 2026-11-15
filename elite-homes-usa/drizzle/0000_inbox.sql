CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  payload TEXT NOT NULL,
  source TEXT NOT NULL,
  preview INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  follow_up TEXT NOT NULL DEFAULT '',
  email_key TEXT,
  unsubscribe_key TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS submissions_channel_date ON submissions(channel, created_at DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_unique ON submissions(preview, email_key) WHERE channel = 'newsletter' AND active = 1;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activity_time ON activities(submission_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
