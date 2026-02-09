-- Add GFW-specific columns to vessel_positions
ALTER TABLE vessel_positions 
ADD COLUMN IF NOT EXISTS gfw_event_id TEXT,
ADD COLUMN IF NOT EXISTS gfw_event_type TEXT,
ADD COLUMN IF NOT EXISTS port_id TEXT,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_interpolated BOOLEAN DEFAULT FALSE;

-- Index for deduplication queries (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_dedup 
ON vessel_positions("vesselId", timestamp, latitude, longitude);

-- Index for GFW event lookup
CREATE INDEX IF NOT EXISTS idx_vessel_positions_gfw_event 
ON vessel_positions(gfw_event_id) WHERE gfw_event_id IS NOT NULL;

-- Index for port visit queries
CREATE INDEX IF NOT EXISTS idx_vessel_positions_port 
ON vessel_positions(port_id) WHERE port_id IS NOT NULL;

-- Index for GFW event type filtering
CREATE INDEX IF NOT EXISTS idx_vessel_positions_gfw_type 
ON vessel_positions(gfw_event_type) WHERE gfw_event_type IS NOT NULL;

-- Add enrichment source to vessels table
ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS enrichment_source TEXT;

-- Comment for documentation
COMMENT ON COLUMN vessel_positions.gfw_event_id IS 'GFW event ID for tracking origin';
COMMENT ON COLUMN vessel_positions.gfw_event_type IS 'Type: port_visit, fishing, encounter, loitering';
COMMENT ON COLUMN vessel_positions.port_id IS 'Port ID for port visit events';
COMMENT ON COLUMN vessel_positions.confidence_score IS 'Data quality score (0-1)';
COMMENT ON COLUMN vessel_positions.is_interpolated IS 'True if position is estimated/interpolated';
