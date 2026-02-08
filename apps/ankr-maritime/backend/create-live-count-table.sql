-- AIS Live Count Table - Fast stats lookup
CREATE TABLE IF NOT EXISTS ais_live_count (
  id SERIAL PRIMARY KEY,
  total_positions BIGINT NOT NULL,
  unique_vessels BIGINT NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ais_live_count_updated ON ais_live_count(last_updated DESC);

-- Insert initial row if table is empty
INSERT INTO ais_live_count (total_positions, unique_vessels, last_updated)
SELECT 0, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM ais_live_count);

COMMENT ON TABLE ais_live_count IS 'Cached AIS statistics - updated every 15 minutes for fast landing page queries';
