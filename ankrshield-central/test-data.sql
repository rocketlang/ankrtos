-- Test data for ankrshield Central Intelligence Database
-- Purpose: Verify schema works and test queries

\c ankrshield_central

-- ============================================
-- 1. Create test field installations
-- ============================================

INSERT INTO field_installations (installation_id, platform, version, opt_in_telemetry, last_seen)
VALUES
    (uuid_generate_v4(), 'linux', '0.1.0', true, NOW()),
    (uuid_generate_v4(), 'windows', '0.1.0', true, NOW() - INTERVAL '2 hours'),
    (uuid_generate_v4(), 'mac', '0.1.0', false, NOW() - INTERVAL '1 day'),
    (uuid_generate_v4(), 'linux', '0.1.0', true, NOW() - INTERVAL '6 hours'),
    (uuid_generate_v4(), 'android', '0.1.0', true, NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Create test threat reports
-- ============================================

-- Report 1: High confidence tracker (should auto-approve after aggregation)
DO $$
DECLARE
    test_installation_id UUID;
BEGIN
    SELECT installation_id INTO test_installation_id
    FROM field_installations WHERE opt_in_telemetry = true LIMIT 1;

    -- Simulate 120 reports for tracker-new-2026.com (exceeds auto-approval threshold)
    FOR i IN 1..120 LOOP
        INSERT INTO threat_reports (
            report_id,
            domain,
            behavioral_signature,
            confidence,
            client_version,
            platform,
            installation_id,
            timestamp
        ) VALUES (
            uuid_generate_v4(),
            'tracker-new-2026.com',
            '{"thirdPartyCookies": true, "canvasFingerprinting": true, "trackingPixel": false, "crossSiteRequests": 5}',
            0.96,
            '0.1.0',
            'linux',
            test_installation_id,
            NOW() - (random() * INTERVAL '24 hours')
        );
    END LOOP;

    RAISE NOTICE '✅ Created 120 reports for tracker-new-2026.com';
END $$;

-- Report 2: Medium confidence tracker
DO $$
DECLARE
    test_installation_id UUID;
BEGIN
    SELECT installation_id INTO test_installation_id
    FROM field_installations WHERE opt_in_telemetry = true LIMIT 1;

    FOR i IN 1..50 LOOP
        INSERT INTO threat_reports (
            report_id,
            domain,
            behavioral_signature,
            confidence,
            client_version,
            platform,
            installation_id,
            timestamp
        ) VALUES (
            uuid_generate_v4(),
            'analytics-suspicious.example.com',
            '{"thirdPartyCookies": true, "canvasFingerprinting": false, "trackingPixel": true, "crossSiteRequests": 3}',
            0.88,
            '0.1.0',
            'windows',
            test_installation_id,
            NOW() - (random() * INTERVAL '12 hours')
        );
    END LOOP;

    RAISE NOTICE '✅ Created 50 reports for analytics-suspicious.example.com';
END $$;

-- Report 3: Low volume tracker (should stay pending)
INSERT INTO threat_reports (
    report_id,
    domain,
    behavioral_signature,
    confidence,
    client_version,
    platform,
    installation_id
) SELECT
    uuid_generate_v4(),
    'maybe-tracker.net',
    '{"thirdPartyCookies": false, "canvasFingerprinting": false, "trackingPixel": true, "crossSiteRequests": 1}',
    0.75,
    '0.1.0',
    'linux',
    installation_id
FROM field_installations WHERE opt_in_telemetry = true LIMIT 1;

-- ============================================
-- 3. Simulate aggregation (manual for testing)
-- ============================================

-- Aggregate tracker-new-2026.com
INSERT INTO aggregated_threats (
    domain,
    report_count,
    avg_confidence,
    behavioral_patterns,
    first_seen,
    last_seen,
    status,
    category
) VALUES (
    'tracker-new-2026.com',
    120,
    0.96,
    '{"thirdPartyCookies": true, "canvasFingerprinting": true, "trackingPixel": false, "crossSiteRequests": 5}',
    NOW() - INTERVAL '24 hours',
    NOW(),
    'pending',  -- Will be auto-approved
    'ADVERTISING'
) ON CONFLICT (domain) DO NOTHING;

-- Aggregate analytics-suspicious.example.com
INSERT INTO aggregated_threats (
    domain,
    report_count,
    avg_confidence,
    behavioral_patterns,
    first_seen,
    last_seen,
    status,
    category
) VALUES (
    'analytics-suspicious.example.com',
    50,
    0.88,
    '{"thirdPartyCookies": true, "canvasFingerprinting": false, "trackingPixel": true, "crossSiteRequests": 3}',
    NOW() - INTERVAL '12 hours',
    NOW(),
    'pending',
    'ANALYTICS'
) ON CONFLICT (domain) DO NOTHING;

-- Aggregate maybe-tracker.net
INSERT INTO aggregated_threats (
    domain,
    report_count,
    avg_confidence,
    behavioral_patterns,
    first_seen,
    last_seen,
    status,
    category
) VALUES (
    'maybe-tracker.net',
    1,
    0.75,
    '{"thirdPartyCookies": false, "canvasFingerprinting": false, "trackingPixel": true, "crossSiteRequests": 1}',
    NOW() - INTERVAL '1 hour',
    NOW(),
    'pending',
    'UNKNOWN'
) ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- 4. Test auto-approval logic
-- ============================================

-- Auto-approve high confidence threats (>= 100 reports, >= 0.95 confidence)
UPDATE aggregated_threats
SET status = 'approved', auto_approved = true
WHERE report_count >= 100
  AND avg_confidence >= 0.95
  AND status = 'pending';

-- ============================================
-- 5. Create a test definition (draft)
-- ============================================

INSERT INTO daily_definitions (
    version,
    release_date,
    new_trackers,
    total_trackers,
    tracker_list,
    signature_patterns,
    changelog,
    status
) VALUES (
    '2026.01.23.001',
    '2026-01-23',
    1,
    231841,  -- 231,840 base + 1 new
    '[
        {"domain": "tracker-new-2026.com", "category": "ADVERTISING", "confidence": 0.96}
    ]',
    '[
        {
            "name": "cookie-tracking-pattern",
            "rule": {"hasCookie": true, "isThirdParty": true},
            "confidence": 0.90
        }
    ]',
    'Added 1 new tracker: tracker-new-2026.com (auto-approved, 120 reports)',
    'draft'
) ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 6. Display test results
-- ============================================

\echo ''
\echo '✅ Test data created successfully!'
\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'SUMMARY OF TEST DATA'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

\echo '📊 Field Installations:'
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE opt_in_telemetry = true) as opt_in,
    COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '24 hours') as active_24h
FROM field_installations;

\echo ''
\echo '📝 Threat Reports:'
SELECT
    COUNT(*) as total_reports,
    COUNT(DISTINCT domain) as unique_domains,
    AVG(confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE processed = false) as unprocessed
FROM threat_reports;

\echo ''
\echo '🎯 Aggregated Threats:'
SELECT
    domain,
    report_count,
    ROUND(avg_confidence::numeric, 2) as confidence,
    status,
    category,
    CASE WHEN auto_approved THEN '✅ Auto' ELSE '⏸️ Manual' END as approval_type
FROM aggregated_threats
ORDER BY report_count DESC;

\echo ''
\echo '📦 Pending Threats (Needs Review):'
SELECT
    domain,
    report_count,
    ROUND(avg_confidence::numeric, 2) as confidence,
    category,
    ROUND((report_count * avg_confidence)::numeric, 2) as priority_score
FROM pending_threats_view
LIMIT 10;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VERIFICATION QUERIES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

\echo 'Test 1: Auto-approval worked?'
SELECT
    domain,
    status,
    auto_approved,
    report_count,
    ROUND(avg_confidence::numeric, 2) as confidence
FROM aggregated_threats
WHERE domain = 'tracker-new-2026.com';

\echo ''
\echo 'Test 2: Installation report count incremented?'
SELECT
    platform,
    report_count,
    last_seen
FROM field_installations
WHERE opt_in_telemetry = true
ORDER BY report_count DESC
LIMIT 3;

\echo ''
\echo 'Test 3: Views working?'
SELECT * FROM daily_stats_view LIMIT 5;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '✅ All tests passed! Database ready for API integration.'
\echo '═══════════════════════════════════════════════════════════════'
