ALTER TABLE routes ADD COLUMN source text NOT NULL DEFAULT 'curated';
ALTER TABLE routes ADD COLUMN osm_area_hash text;
ALTER TABLE routes ADD COLUMN generated_at text;
