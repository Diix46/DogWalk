CREATE TABLE reviews (
  id integer PRIMARY KEY AUTOINCREMENT,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id text NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  walk_id integer REFERENCES walks(id) ON DELETE SET NULL,
  rating integer NOT NULL,
  comment text,
  created_at integer NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_reviews_route_id ON reviews(route_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
