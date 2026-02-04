-- ankrshield Central Intelligence Database Schema
-- Purpose: Crowdsourced threat intelligence aggregation
-- Version: 1.0.0
-- Date: January 23, 2026

-- Create database (if running separately)
-- CREATE DATABASE ankrshield_central;
-- \c ankrshield_central;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table 1: threat_reports (Raw reports from field installations)
-- ============================================

CREATE TABLE IF NOT EXISTS threat_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID UNIQUE NOT NULL,              -- Random UUID from client (for deduplication)
    domain TEXT NOT NULL,
    behavioral_signature JSONB,                   -- {thirdPartyCookies: true, canvasFingerprinting: false, ...}
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    client_version TEXT,
    platform TEXT CHECK (platform IN ('windows', 'mac', 'linux', 'android', 'ios', 'unknown')),
    installation_id UUID NOT NULL,               -- Anonymous device ID
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_threat_reports_domain ON threat_reports(domain);
CREATE INDEX idx_threat_reports_processed ON threat_reports(processed);
CREATE INDEX idx_threat_reports_timestamp ON threat_reports(timestamp DESC);
CREATE INDEX idx_threat_reports_installation_id ON threat_reports(installation_id);
CREATE INDEX idx_threat_reports_report_id ON threat_reports(report_id);

-- Comments
COMMENT ON TABLE threat_reports IS 'Raw anonymous threat reports from field installations';
COMMENT ON COLUMN threat_reports.report_id IS 'Random UUID from client for deduplication';
COMMENT ON COLUMN threat_reports.domain IS 'Suspicious domain reported';
COMMENT ON COLUMN threat_reports.behavioral_signature IS 'JSON object of detected behaviors';
COMMENT ON COLUMN threat_reports.confidence IS 'Client confidence score (0.0 - 1.0)';
COMMENT ON COLUMN threat_reports.installation_id IS 'Anonymous device ID (random UUID, not traceable)';
COMMENT ON COLUMN threat_reports.processed IS 'Whether this report has been aggregated';

-- ============================================
-- Table 2: aggregated_threats (Processed intelligence)
-- ============================================

CREATE TYPE threat_status AS ENUM ('pending', 'approved', 'rejected', 'watching', 'false_positive');
CREATE TYPE threat_category AS ENUM ('ADVERTISING', 'ANALYTICS', 'SOCIAL_MEDIA', 'FINGERPRINTING', 'MALWARE', 'CRYPTOMINING', 'UNKNOWN');

CREATE TABLE IF NOT EXISTS aggregated_threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT UNIQUE NOT NULL,
    report_count INT DEFAULT 0,                   -- How many field reports
    avg_confidence FLOAT,                         -- Average confidence from reports
    behavioral_patterns JSONB,                    -- Aggregated behaviors
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    status threat_status DEFAULT 'pending',
    category threat_category DEFAULT 'UNKNOWN',
    reviewed_by UUID,                             -- Admin user who reviewed
    reviewed_at TIMESTAMP,
    notes TEXT,                                   -- Admin notes
    auto_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_aggregated_threats_domain ON aggregated_threats(domain);
CREATE INDEX idx_aggregated_threats_status ON aggregated_threats(status);
CREATE INDEX idx_aggregated_threats_report_count ON aggregated_threats(report_count DESC);
CREATE INDEX idx_aggregated_threats_category ON aggregated_threats(category);
CREATE INDEX idx_aggregated_threats_updated ON aggregated_threats(updated_at DESC);

-- Comments
COMMENT ON TABLE aggregated_threats IS 'Aggregated threat intelligence from multiple reports';
COMMENT ON COLUMN aggregated_threats.report_count IS 'Number of field installations that reported this';
COMMENT ON COLUMN aggregated_threats.avg_confidence IS 'Average confidence score (with differential privacy noise)';
COMMENT ON COLUMN aggregated_threats.status IS 'Review status: pending/approved/rejected/watching';
COMMENT ON COLUMN aggregated_threats.auto_approved IS 'Whether approved automatically (high confidence + high report count)';

-- ============================================
-- Table 3: daily_definitions (Published tracker updates)
-- ============================================

CREATE TYPE definition_status AS ENUM ('active', 'deprecated', 'draft');

CREATE TABLE IF NOT EXISTS daily_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT UNIQUE NOT NULL,                 -- "2026.01.23.001"
    release_date DATE NOT NULL,
    new_trackers INT DEFAULT 0,                   -- Count of new trackers in this version
    removed_trackers INT DEFAULT 0,               -- False positives removed
    total_trackers INT DEFAULT 0,                 -- Total trackers in this version
    tracker_list JSONB,                           -- Array of {domain, category, confidence}
    signature_patterns JSONB,                     -- Behavioral detection rules
    ml_model_version TEXT,                        -- If ML model updated
    changelog TEXT,                               -- Human-readable changes
    download_count INT DEFAULT 0,
    status definition_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_daily_definitions_version ON daily_definitions(version);
CREATE INDEX idx_daily_definitions_date ON daily_definitions(release_date DESC);
CREATE INDEX idx_daily_definitions_status ON daily_definitions(status);

-- Comments
COMMENT ON TABLE daily_definitions IS 'Daily tracker definition updates (like antivirus definitions)';
COMMENT ON COLUMN daily_definitions.version IS 'Version format: YYYY.MM.DD.NNN';
COMMENT ON COLUMN daily_definitions.tracker_list IS 'Full list of trackers in this definition';
COMMENT ON COLUMN daily_definitions.signature_patterns IS 'Behavioral detection rules';
COMMENT ON COLUMN daily_definitions.download_count IS 'How many times this version was downloaded';

-- ============================================
-- Table 4: field_installations (Track deployments)
-- ============================================

CREATE TABLE IF NOT EXISTS field_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID UNIQUE NOT NULL,         -- Anonymous device ID
    platform TEXT CHECK (platform IN ('windows', 'mac', 'linux', 'android', 'ios', 'unknown')),
    version TEXT,                                 -- Client app version
    opt_in_telemetry BOOLEAN DEFAULT false,
    last_definition_version TEXT,
    last_seen TIMESTAMP,
    report_count INT DEFAULT 0,                   -- Total reports submitted by this installation
    total_blocked INT DEFAULT 0,                  -- Stats for user dashboard
    first_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_field_installations_installation_id ON field_installations(installation_id);
CREATE INDEX idx_field_installations_opt_in ON field_installations(opt_in_telemetry);
CREATE INDEX idx_field_installations_last_seen ON field_installations(last_seen DESC);
CREATE INDEX idx_field_installations_platform ON field_installations(platform);

-- Comments
COMMENT ON TABLE field_installations IS 'Anonymous tracking of field app installations';
COMMENT ON COLUMN field_installations.installation_id IS 'Random UUID generated by client, not traceable to user';
COMMENT ON COLUMN field_installations.opt_in_telemetry IS 'Whether user opted in to submit threat reports';
COMMENT ON COLUMN field_installations.report_count IS 'Total reports contributed by this installation';

-- ============================================
-- Table 5: admin_users (Admin dashboard access)
-- ============================================

CREATE TYPE admin_role AS ENUM ('viewer', 'reviewer', 'admin', 'superadmin');

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role admin_role DEFAULT 'viewer',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(active);

-- Comments
COMMENT ON TABLE admin_users IS 'Admin dashboard user accounts';
COMMENT ON COLUMN admin_users.role IS 'viewer=read only, reviewer=can approve/reject, admin=full access, superadmin=system access';

-- ============================================
-- Table 6: admin_activity_log (Audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,                         -- 'approved_threat', 'rejected_threat', 'generated_definition', etc
    details JSONB,                                -- Action-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX idx_admin_activity_log_created ON admin_activity_log(created_at DESC);

-- Comments
COMMENT ON TABLE admin_activity_log IS 'Audit log of all admin actions';

-- ============================================
-- Functions & Triggers
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aggregated_threats_updated_at
    BEFORE UPDATE ON aggregated_threats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment installation report count
CREATE OR REPLACE FUNCTION increment_installation_report_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE field_installations
    SET report_count = report_count + 1,
        last_seen = NOW()
    WHERE installation_id = NEW.installation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_report_count
    AFTER INSERT ON threat_reports
    FOR EACH ROW
    EXECUTE FUNCTION increment_installation_report_count();

-- ============================================
-- Views for common queries
-- ============================================

-- Pending threats requiring review
CREATE OR REPLACE VIEW pending_threats_view AS
SELECT
    id,
    domain,
    report_count,
    avg_confidence,
    behavioral_patterns,
    first_seen,
    last_seen,
    category,
    (report_count * avg_confidence) as priority_score,
    (NOW() - first_seen) as age
FROM aggregated_threats
WHERE status = 'pending'
ORDER BY priority_score DESC, report_count DESC;

-- Active installations stats
CREATE OR REPLACE VIEW active_installations_view AS
SELECT
    COUNT(*) as total_installations,
    COUNT(*) FILTER (WHERE opt_in_telemetry = true) as opt_in_count,
    COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '24 hours') as active_24h,
    COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days') as active_7d,
    platform,
    AVG(report_count) as avg_reports_per_installation
FROM field_installations
GROUP BY platform;

-- Daily stats
CREATE OR REPLACE VIEW daily_stats_view AS
SELECT
    DATE(timestamp) as date,
    COUNT(*) as reports_received,
    COUNT(DISTINCT domain) as unique_domains_reported,
    COUNT(DISTINCT installation_id) as active_reporters,
    AVG(confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE processed = true) as processed_count
FROM threat_reports
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ============================================
-- Sample data (for testing)
-- ============================================

-- Create a test admin user (password: 'admin123' - bcrypt hash)
-- Note: Change this in production!
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
    'admin@ankrshield.com',
    '$2b$10$rX0H3YVqZ9yP5N2hK.H8ZuF7xGtQc3E0KdN5J8L9M.P6Q1R7S2T8U',  -- Placeholder hash
    'Admin User',
    'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Grants (if using separate roles)
-- ============================================

-- Example: Grant permissions to api_user role
-- GRANT SELECT, INSERT ON threat_reports TO api_user;
-- GRANT SELECT, UPDATE ON field_installations TO api_user;
-- GRANT SELECT ON aggregated_threats TO api_user;
-- GRANT SELECT ON daily_definitions TO api_user;

-- ============================================
-- Data retention policies
-- ============================================

-- Delete old processed reports (keep for 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS void AS $$
BEGIN
    DELETE FROM threat_reports
    WHERE processed = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-reports', '0 2 * * *', 'SELECT cleanup_old_reports()');

-- ============================================
-- Indexes for analytics queries
-- ============================================

CREATE INDEX idx_threat_reports_created_date ON threat_reports(DATE(created_at));
CREATE INDEX idx_aggregated_threats_priority ON aggregated_threats((report_count * avg_confidence) DESC);

-- ============================================
-- Completion message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ankrshield Central Intelligence Database Schema Created Successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  1. threat_reports - Raw reports from field installations';
    RAISE NOTICE '  2. aggregated_threats - Processed threat intelligence';
    RAISE NOTICE '  3. daily_definitions - Published tracker updates';
    RAISE NOTICE '  4. field_installations - Anonymous deployment tracking';
    RAISE NOTICE '  5. admin_users - Admin dashboard access';
    RAISE NOTICE '  6. admin_activity_log - Audit trail';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - pending_threats_view';
    RAISE NOTICE '  - active_installations_view';
    RAISE NOTICE '  - daily_stats_view';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run: psql -U ankrshield -d ankrshield_central -f schema.sql';
    RAISE NOTICE '  2. Verify tables: \dt';
    RAISE NOTICE '  3. Test with sample data';
    RAISE NOTICE '';
END $$;
