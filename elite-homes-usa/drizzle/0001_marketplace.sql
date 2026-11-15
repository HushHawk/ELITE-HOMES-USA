CREATE TABLE IF NOT EXISTS market_properties (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  preview INTEGER NOT NULL,
  seller_json TEXT NOT NULL,
  public_json TEXT NOT NULL DEFAULT '{}',
  public_photos TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS market_listing_status ON market_properties(preview, status, updated_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS market_offers (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES market_properties(id),
  preview INTEGER NOT NULL,
  offer_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS market_offer_date ON market_offers(preview, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS market_media (
  id TEXT PRIMARY KEY,
  preview INTEGER NOT NULL,
  property_id TEXT REFERENCES market_properties(id),
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS market_media_property ON market_media(property_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS market_events (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS market_event_record ON market_events(record_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS site_content (
  preview INTEGER PRIMARY KEY,
  content_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS site_reviews (
  id TEXT PRIMARY KEY,
  request_id TEXT UNIQUE,
  preview INTEGER NOT NULL,
  review_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL
);
