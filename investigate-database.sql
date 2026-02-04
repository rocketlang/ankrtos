-- ============================================================================
-- Ankr Compliance Platform - Database Schema Investigation Script
-- Jai GuruJi! Shree Ganesh! 🙏
-- Created: December 22, 2025
-- 
-- USAGE: 
--   docker exec -i compliance-postgres psql -U ankr -d compliance < investigate-database.sql
-- ============================================================================

\echo '=============================================================='
\echo 'ANKR COMPLIANCE - DATABASE INVESTIGATION REPORT'
\echo 'Date:' :DBNAME
\echo '=============================================================='

-- ============================================================================
-- SECTION 1: CHECK ALL SCHEMAS
-- ============================================================================
\echo ''
\echo '📋 SECTION 1: Available Schemas'
\echo '--------------------------------------------------------------'
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

-- ============================================================================
-- SECTION 2: CHECK ALL TABLES IN EACH SCHEMA
-- ============================================================================
\echo ''
\echo '📋 SECTION 2: All Tables by Schema'
\echo '--------------------------------------------------------------'
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- ============================================================================
-- SECTION 3: CHECK COMPLIANCE SCHEMA SPECIFICALLY
-- ============================================================================
\echo ''
\echo '📋 SECTION 3: Tables in "compliance" schema'
\echo '--------------------------------------------------------------'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'compliance'
ORDER BY table_name;

-- ============================================================================
-- SECTION 4: CHECK PUBLIC SCHEMA
-- ============================================================================
\echo ''
\echo '📋 SECTION 4: Tables in "public" schema'
\echo '--------------------------------------------------------------'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION 5: CHECK FOR CRITICAL MISSING TABLES
-- ============================================================================
\echo ''
\echo '📋 SECTION 5: Critical Tables Status'
\echo '--------------------------------------------------------------'

-- Check for ComplianceRule table
\echo 'Checking ComplianceRule...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ComplianceRule') THEN '✅ EXISTS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_rule') THEN '✅ EXISTS (snake_case)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliancerule') THEN '✅ EXISTS (lowercase)'
        ELSE '❌ MISSING'
    END AS "ComplianceRule Status";

-- Check for ComplianceCalendar table
\echo 'Checking ComplianceCalendar...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ComplianceCalendar') THEN '✅ EXISTS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_calendar') THEN '✅ EXISTS (snake_case)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliancecalendar') THEN '✅ EXISTS (lowercase)'
        ELSE '❌ MISSING'
    END AS "ComplianceCalendar Status";

-- Check for Company table
\echo 'Checking Company...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Company') THEN '✅ EXISTS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company') THEN '✅ EXISTS (lowercase)'
        ELSE '❌ MISSING'
    END AS "Company Status";

-- Check for Holiday table
\echo 'Checking Holiday...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Holiday') THEN '✅ EXISTS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holiday') THEN '✅ EXISTS (lowercase)'
        ELSE '❌ MISSING'
    END AS "Holiday Status";

-- ============================================================================
-- SECTION 6: ROW COUNTS FOR EXISTING TABLES
-- ============================================================================
\echo ''
\echo '📋 SECTION 6: Row Counts for Existing Tables'
\echo '--------------------------------------------------------------'

-- Dynamic count (try different table naming conventions)
DO $$
DECLARE
    rec RECORD;
    row_count INTEGER;
BEGIN
    FOR rec IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I.%I', rec.table_schema, rec.table_name) INTO row_count;
        RAISE NOTICE 'Table %.%: % rows', rec.table_schema, rec.table_name, row_count;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 7: CHECK ENUM TYPES
-- ============================================================================
\echo ''
\echo '📋 SECTION 7: Enum Types Defined'
\echo '--------------------------------------------------------------'
SELECT 
    n.nspname AS schema,
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
GROUP BY n.nspname, t.typname
ORDER BY n.nspname, t.typname;

-- ============================================================================
-- SECTION 8: CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================
\echo ''
\echo '📋 SECTION 8: Foreign Key Constraints'
\echo '--------------------------------------------------------------'
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name;

-- ============================================================================
-- SECTION 9: CHECK EXTENSIONS
-- ============================================================================
\echo ''
\echo '📋 SECTION 9: Installed Extensions'
\echo '--------------------------------------------------------------'
SELECT extname, extversion 
FROM pg_extension 
ORDER BY extname;

-- ============================================================================
-- SECTION 10: PRISMA MIGRATIONS TABLE
-- ============================================================================
\echo ''
\echo '📋 SECTION 10: Prisma Migrations History'
\echo '--------------------------------------------------------------'
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 20;

-- ============================================================================
-- SECTION 11: SPECIFIC TABLE STRUCTURES
-- ============================================================================
\echo ''
\echo '📋 SECTION 11: Checking ComplianceCalendar Structure'
\echo '--------------------------------------------------------------'

-- Try to describe the ComplianceCalendar table if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('ComplianceCalendar', 'compliance_calendar', 'compliancecalendar')
ORDER BY ordinal_position;

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo ''
\echo '=============================================================='
\echo 'INVESTIGATION COMPLETE'
\echo '=============================================================='
\echo ''
\echo 'NEXT STEPS:'
\echo '1. If tables are missing, run: npx prisma db push'
\echo '2. If Prisma not available, use create-missing-tables.sql'
\echo '3. Check for schema mismatch (public vs compliance)'
\echo ''
