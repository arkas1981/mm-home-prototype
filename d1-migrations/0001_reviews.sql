CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  booking_code TEXT NOT NULL,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (
    rating >= 1
    AND rating <= 5
  ),
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'approved',
      'rejected'
    )
  ),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS
idx_reviews_booking_code
ON reviews (
  booking_code
);

CREATE INDEX IF NOT EXISTS
idx_reviews_status_created
ON reviews (
  status,
  created_at
);
