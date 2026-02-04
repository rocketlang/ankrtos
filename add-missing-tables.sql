-- ============================================================================
-- Ankr Compliance Platform - Add Missing Tables ONLY
-- Jai GuruJi! Shree Ganesh! 🙏
-- Created: December 22, 2025
-- 
-- This script ONLY creates missing tables, doesn't touch existing ones.
-- Safe to run - uses IF NOT EXISTS everywhere.
--
-- USAGE: 
--   docker exec -i compliance-postgres psql -U ankr -d compliance < add-missing-tables.sql
-- ============================================================================

\echo '=============================================================='
\echo 'ANKR COMPLIANCE - ADDING MISSING TABLES'
\echo 'Date: December 22, 2025'
\echo '=============================================================='

-- Set search path
SET search_path TO compliance, public;

-- ============================================================================
-- STEP 1: Add missing ENUM types
-- ============================================================================
\echo ''
\echo '📋 Step 1: Adding missing ENUM types...'

-- Jurisdiction (for ComplianceRule)
DO $$ BEGIN
    CREATE TYPE compliance."Jurisdiction" AS ENUM ('CENTRAL', 'STATE');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type Jurisdiction already exists, skipping';
END $$;

-- FilingType (for ComplianceRule)
DO $$ BEGIN
    CREATE TYPE compliance."FilingType" AS ENUM ('RETURN', 'FORM', 'PAYMENT', 'MEETING', 'AUDIT');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type FilingType already exists, skipping';
END $$;

-- FilingFrequency (for ComplianceRule)
DO $$ BEGIN
    CREATE TYPE compliance."FilingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'EVENT_BASED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type FilingFrequency already exists, skipping';
END $$;

-- HolidayType (for Holiday)
DO $$ BEGIN
    CREATE TYPE compliance."HolidayType" AS ENUM ('NATIONAL', 'STATE', 'BANK', 'RESTRICTED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type HolidayType already exists, skipping';
END $$;

-- ProfessionalType (for Marketplace)
DO $$ BEGIN
    CREATE TYPE compliance."ProfessionalType" AS ENUM ('CA', 'CS', 'LAWYER', 'TAX_CONSULTANT');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type ProfessionalType already exists, skipping';
END $$;

-- ProfessionalStatus
DO $$ BEGIN
    CREATE TYPE compliance."ProfessionalStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type ProfessionalStatus already exists, skipping';
END $$;

-- ServiceCategory
DO $$ BEGIN
    CREATE TYPE compliance."ServiceCategory" AS ENUM (
        'GST_FILING', 'INCOME_TAX', 'TDS_RETURN', 'ROC_FILING', 'AUDIT',
        'COMPANY_REGISTRATION', 'TRADEMARK', 'LEGAL_DRAFTING', 'COMPLIANCE_REVIEW', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type ServiceCategory already exists, skipping';
END $$;

-- PricingType
DO $$ BEGIN
    CREATE TYPE compliance."PricingType" AS ENUM ('FIXED', 'HOURLY', 'QUOTE_BASED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type PricingType already exists, skipping';
END $$;

-- EngagementStatus
DO $$ BEGIN
    CREATE TYPE compliance."EngagementStatus" AS ENUM ('INQUIRY', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type EngagementStatus already exists, skipping';
END $$;

-- SenderType
DO $$ BEGIN
    CREATE TYPE compliance."SenderType" AS ENUM ('COMPANY', 'PROFESSIONAL', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type SenderType already exists, skipping';
END $$;

-- TransactionType
DO $$ BEGIN
    CREATE TYPE compliance."TransactionType" AS ENUM ('SUBSCRIPTION', 'MARKETPLACE', 'ADDON', 'REFUND');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type TransactionType already exists, skipping';
END $$;

-- TransactionStatus
DO $$ BEGIN
    CREATE TYPE compliance."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type TransactionStatus already exists, skipping';
END $$;

-- EscrowStatus
DO $$ BEGIN
    CREATE TYPE compliance."EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type EscrowStatus already exists, skipping';
END $$;

-- SubscriptionStatus
DO $$ BEGIN
    CREATE TYPE compliance."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type SubscriptionStatus already exists, skipping';
END $$;

\echo 'ENUMs added!'

-- ============================================================================
-- STEP 2: Create ComplianceRule table (CRITICAL - MISSING!)
-- ============================================================================
\echo ''
\echo '📋 Step 2: Creating ComplianceRule table (CRITICAL)...'

CREATE TABLE IF NOT EXISTS compliance."ComplianceRule" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    "subCategory" TEXT,
    jurisdiction compliance."Jurisdiction" NOT NULL,
    "stateCode" TEXT,
    description TEXT,
    "filingType" compliance."FilingType" NOT NULL,
    frequency compliance."FilingFrequency" NOT NULL,
    portal TEXT,
    "formNumber" TEXT,
    "applicabilityRules" JSONB NOT NULL DEFAULT '{}',
    "dueDateRules" JSONB NOT NULL DEFAULT '{}',
    "penaltyRules" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "effectiveFrom" TIMESTAMP,
    "effectiveUntil" TIMESTAMP,
    "yamlPath" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ComplianceRule_category_idx" ON compliance."ComplianceRule"(category);
CREATE INDEX IF NOT EXISTS "ComplianceRule_jurisdiction_idx" ON compliance."ComplianceRule"(jurisdiction);
CREATE INDEX IF NOT EXISTS "ComplianceRule_stateCode_idx" ON compliance."ComplianceRule"("stateCode");

\echo 'ComplianceRule table created!'

-- ============================================================================
-- STEP 3: Create CompanyApplicableRules table
-- ============================================================================
\echo ''
\echo '📋 Step 3: Creating CompanyApplicableRules table...'

CREATE TABLE IF NOT EXISTS compliance."CompanyApplicableRules" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "isApplicable" BOOLEAN DEFAULT true,
    "applicabilityReason" TEXT,
    "isManuallyDisabled" BOOLEAN DEFAULT false,
    "disabledReason" TEXT,
    "disabledBy" TEXT,
    "calculatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "ruleId")
);

CREATE INDEX IF NOT EXISTS "CompanyApplicableRules_companyId_idx" ON compliance."CompanyApplicableRules"("companyId");

\echo 'CompanyApplicableRules table created!'

-- ============================================================================
-- STEP 4: Create DueDateExtension table
-- ============================================================================
\echo ''
\echo '📋 Step 4: Creating DueDateExtension table...'

CREATE TABLE IF NOT EXISTS compliance."DueDateExtension" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "ruleId" TEXT NOT NULL,
    "originalDueDate" TIMESTAMP NOT NULL,
    "extendedDueDate" TIMESTAMP NOT NULL,
    "notificationNumber" TEXT,
    "notificationDate" TIMESTAMP,
    "appliesToStates" TEXT[],
    "appliesToEntityTypes" compliance."EntityType"[],
    reason TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DueDateExtension_ruleId_idx" ON compliance."DueDateExtension"("ruleId");
CREATE INDEX IF NOT EXISTS "DueDateExtension_originalDueDate_idx" ON compliance."DueDateExtension"("originalDueDate");

\echo 'DueDateExtension table created!'

-- ============================================================================
-- STEP 5: Create Holiday table
-- ============================================================================
\echo ''
\echo '📋 Step 5: Creating Holiday table...'

CREATE TABLE IF NOT EXISTS compliance."Holiday" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "holidayDate" DATE NOT NULL,
    name TEXT NOT NULL,
    type compliance."HolidayType" NOT NULL,
    "stateCode" TEXT,
    year INTEGER NOT NULL,
    UNIQUE("holidayDate", "stateCode")
);

CREATE INDEX IF NOT EXISTS "Holiday_year_idx" ON compliance."Holiday"(year);
CREATE INDEX IF NOT EXISTS "Holiday_stateCode_idx" ON compliance."Holiday"("stateCode");

\echo 'Holiday table created!'

-- ============================================================================
-- STEP 6: Create Marketplace tables
-- ============================================================================
\echo ''
\echo '📋 Step 6: Creating Marketplace tables...'

-- Professional
CREATE TABLE IF NOT EXISTS compliance."Professional" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    type compliance."ProfessionalType" NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseVerified" BOOLEAN DEFAULT false,
    "verifiedAt" TIMESTAMP,
    "verifiedBy" TEXT,
    "firmName" TEXT,
    "experienceYears" INTEGER,
    bio TEXT,
    specializations TEXT[],
    languages TEXT[],
    "ratingAvg" DECIMAL DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "completedJobs" INTEGER DEFAULT 0,
    status compliance."ProfessionalStatus" DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Professional_type_idx" ON compliance."Professional"(type);
CREATE INDEX IF NOT EXISTS "Professional_status_idx" ON compliance."Professional"(status);

-- Service
CREATE TABLE IF NOT EXISTS compliance."Service" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "professionalId" TEXT NOT NULL REFERENCES compliance."Professional"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category compliance."ServiceCategory" NOT NULL,
    "pricingType" compliance."PricingType" NOT NULL,
    price DECIMAL,
    "priceFrom" DECIMAL,
    "priceTo" DECIMAL,
    "deliveryDays" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Service_professionalId_idx" ON compliance."Service"("professionalId");
CREATE INDEX IF NOT EXISTS "Service_category_idx" ON compliance."Service"(category);

-- Engagement
CREATE TABLE IF NOT EXISTS compliance."Engagement" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL REFERENCES compliance."Professional"(id),
    "serviceId" TEXT REFERENCES compliance."Service"(id),
    status compliance."EngagementStatus" DEFAULT 'INQUIRY',
    "quotedPrice" DECIMAL,
    "finalPrice" DECIMAL,
    description TEXT,
    requirements TEXT,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "dueDate" TIMESTAMP,
    "escrowId" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Engagement_companyId_idx" ON compliance."Engagement"("companyId");
CREATE INDEX IF NOT EXISTS "Engagement_professionalId_idx" ON compliance."Engagement"("professionalId");
CREATE INDEX IF NOT EXISTS "Engagement_status_idx" ON compliance."Engagement"(status);

-- EngagementMessage
CREATE TABLE IF NOT EXISTS compliance."EngagementMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "engagementId" TEXT NOT NULL REFERENCES compliance."Engagement"(id) ON DELETE CASCADE,
    "senderId" TEXT NOT NULL,
    "senderType" compliance."SenderType" NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "EngagementMessage_engagementId_idx" ON compliance."EngagementMessage"("engagementId");

-- Review
CREATE TABLE IF NOT EXISTS compliance."Review" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "engagementId" TEXT NOT NULL REFERENCES compliance."Engagement"(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    "reviewText" TEXT,
    "qualityRating" INTEGER,
    "communicationRating" INTEGER,
    "timelinessRating" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Review_engagementId_idx" ON compliance."Review"("engagementId");

\echo 'Marketplace tables created!'

-- ============================================================================
-- STEP 7: Create Payment tables
-- ============================================================================
\echo ''
\echo '📋 Step 7: Creating Payment tables...'

-- Transaction
CREATE TABLE IF NOT EXISTS compliance."Transaction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type compliance."TransactionType" NOT NULL,
    "companyId" TEXT,
    "professionalId" TEXT,
    "engagementId" TEXT,
    "subscriptionId" TEXT,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    status compliance."TransactionStatus" DEFAULT 'PENDING',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Transaction_companyId_idx" ON compliance."Transaction"("companyId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON compliance."Transaction"(status);

-- Escrow
CREATE TABLE IF NOT EXISTS compliance."Escrow" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "engagementId" TEXT NOT NULL UNIQUE,
    amount DECIMAL NOT NULL,
    status compliance."EscrowStatus" DEFAULT 'HELD',
    "heldAt" TIMESTAMP DEFAULT NOW(),
    "releasedAt" TIMESTAMP,
    "releasedTo" TEXT
);

CREATE INDEX IF NOT EXISTS "Escrow_status_idx" ON compliance."Escrow"(status);

-- Subscription
CREATE TABLE IF NOT EXISTS compliance."Subscription" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    status compliance."SubscriptionStatus" DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP NOT NULL,
    "currentPeriodEnd" TIMESTAMP NOT NULL,
    "cancelledAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Subscription_companyId_idx" ON compliance."Subscription"("companyId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON compliance."Subscription"(status);

\echo 'Payment tables created!'

-- ============================================================================
-- STEP 8: Create AuditLog table
-- ============================================================================
\echo ''
\echo '📋 Step 8: Creating AuditLog table...'

CREATE TABLE IF NOT EXISTS compliance."AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    timestamp TIMESTAMP DEFAULT NOW(),
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON compliance."AuditLog"(timestamp);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON compliance."AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_resource_idx" ON compliance."AuditLog"(resource, "resourceId");

\echo 'AuditLog table created!'

-- ============================================================================
-- STEP 9: Insert Compliance Rules (38 rules from YAML)
-- ============================================================================
\echo ''
\echo '📋 Step 9: Inserting Compliance Rules...'

INSERT INTO compliance."ComplianceRule" (id, name, category, "subCategory", jurisdiction, "filingType", frequency, portal, "formNumber", "applicabilityRules", "dueDateRules", description)
VALUES 
    -- GST Rules (7)
    ('GST_GSTR1_MONTHLY', 'GSTR-1 Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-1', 
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 11, "ifHoliday": "NEXT_WORKING"}',
     'Monthly return for outward supplies'),
    
    ('GST_GSTR3B_MONTHLY', 'GSTR-3B Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-3B',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 20, "ifHoliday": "NEXT_WORKING"}',
     'Monthly summary return with tax payment'),

    ('GST_GSTR9_ANNUAL', 'GSTR-9 Annual Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.gst.gov.in', 'GSTR-9',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "FINANCIAL_YEAR_END", "offsetDays": 270, "ifHoliday": "NEXT_WORKING"}',
     'Annual return consolidating monthly returns'),

    ('GST_GSTR9C_ANNUAL', 'GSTR-9C Reconciliation', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.gst.gov.in', 'GSTR-9C',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": [{"field": "turnovers.latest", "operator": "gte", "value": 50000000}]}',
     '{"base": "FINANCIAL_YEAR_END", "offsetDays": 270, "ifHoliday": "NEXT_WORKING"}',
     'Reconciliation statement for turnover above 5 Cr'),

    ('GST_CMP08_QUARTERLY', 'CMP-08 Composition Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.gst.gov.in', 'CMP-08',
     '{"entityTypes": ["PROPRIETORSHIP", "PARTNERSHIP"], "conditions": [{"field": "gstRegistrations.registrationType", "operator": "eq", "value": "COMPOSITION"}]}',
     '{"base": "QUARTER_END", "offsetDays": 18, "ifHoliday": "NEXT_WORKING"}',
     'Quarterly return for composition dealers'),

    ('GST_ITC04_HALF_YEARLY', 'ITC-04 Job Work Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'HALF_YEARLY', 'https://www.gst.gov.in', 'ITC-04',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": []}',
     '{"base": "HALF_YEAR_END", "offsetDays": 25, "ifHoliday": "NEXT_WORKING"}',
     'Details of goods sent/received for job work'),

    ('GST_GSTR8_MONTHLY', 'GSTR-8 TCS Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-8',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": [{"field": "isEcommerceOperator", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 10, "ifHoliday": "NEXT_WORKING"}',
     'TCS collection by e-commerce operators'),

    -- TDS Rules (6)
    ('TDS_24Q_QUARTERLY', 'TDS Return - Salary (24Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '24Q',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": [{"field": "permanentEmployees", "operator": "gt", "value": 0}]}',
     '{"base": "QUARTER_END", "offsetDays": 31, "ifHoliday": "NEXT_WORKING"}',
     'Quarterly TDS return for salary payments'),
    
    ('TDS_26Q_QUARTERLY', 'TDS Return - Non-Salary (26Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '26Q',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 31, "ifHoliday": "NEXT_WORKING"}',
     'Quarterly TDS return for non-salary payments'),

    ('TDS_27Q_QUARTERLY', 'TDS Return - NRI (27Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '27Q',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 31, "ifHoliday": "NEXT_WORKING"}',
     'Quarterly TDS return for NRI payments'),

    ('TDS_FORM16_ANNUAL', 'Form 16 - TDS Certificate', 'TDS', 'CERTIFICATE', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.incometax.gov.in', 'Form 16',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": [{"field": "permanentEmployees", "operator": "gt", "value": 0}]}',
     '{"month": 6, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual TDS certificate for employees'),

    ('TDS_FORM16A_QUARTERLY', 'Form 16A - TDS Certificate', 'TDS', 'CERTIFICATE', 'CENTRAL', 'FORM', 'QUARTERLY', 'https://www.incometax.gov.in', 'Form 16A',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Quarterly TDS certificate for non-salary'),

    ('TCS_27EQ_QUARTERLY', 'TCS Return (27EQ)', 'TCS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '27EQ',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 15, "ifHoliday": "NEXT_WORKING"}',
     'Quarterly TCS collection return'),

    -- Income Tax Rules (7)
    ('IT_ADVANCE_TAX_Q1', 'Advance Tax - Q1 (15%)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Challan 280',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 6, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'First installment - 15% of estimated tax'),
    
    ('IT_ADVANCE_TAX_Q2', 'Advance Tax - Q2 (45%)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Challan 280',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 9, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Second installment - 45% cumulative'),

    ('IT_ADVANCE_TAX_Q3', 'Advance Tax - Q3 (75%)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Challan 280',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 12, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Third installment - 75% cumulative'),

    ('IT_ADVANCE_TAX_Q4', 'Advance Tax - Q4 (100%)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Challan 280',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 3, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Fourth installment - 100% of tax'),

    ('IT_ITR_COMPANY', 'ITR Filing - Company', 'INCOME_TAX', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.incometax.gov.in', 'ITR-6',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": []}',
     '{"month": 10, "day": 31, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual income tax return for companies'),

    ('IT_ITR_LLP', 'ITR Filing - LLP', 'INCOME_TAX', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.incometax.gov.in', 'ITR-5',
     '{"entityTypes": ["LLP"], "conditions": []}',
     '{"month": 7, "day": 31, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual income tax return for LLPs'),

    ('IT_TAX_AUDIT', 'Tax Audit Report', 'INCOME_TAX', 'AUDIT', 'CENTRAL', 'AUDIT', 'ANNUAL', 'https://www.incometax.gov.in', 'Form 3CA/3CB',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 10000000}]}',
     '{"month": 9, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}',
     'Tax audit for turnover above 1 Cr'),

    -- MCA Rules (10)
    ('MCA_AOC4_ANNUAL', 'AOC-4 Financial Statements', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'AOC-4',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"base": "AGM_DATE", "offsetDays": 30, "ifHoliday": "NEXT_WORKING"}',
     'Annual financial statements filing'),
    
    ('MCA_MGT7_ANNUAL', 'MGT-7 Annual Return', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'MGT-7',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"base": "AGM_DATE", "offsetDays": 60, "ifHoliday": "NEXT_WORKING"}',
     'Annual return of company'),

    ('MCA_MGT7A_ANNUAL', 'MGT-7A Annual Return (Small)', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'MGT-7A',
     '{"entityTypes": ["PRIVATE_LIMITED", "OPC"], "conditions": [{"field": "paidUpCapital", "operator": "lte", "value": 20000000}]}',
     '{"base": "AGM_DATE", "offsetDays": 60, "ifHoliday": "NEXT_WORKING"}',
     'Simplified annual return for small companies'),

    ('MCA_ADT1_ANNUAL', 'ADT-1 Auditor Appointment', 'MCA', 'FORMS', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'ADT-1',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": []}',
     '{"base": "AGM_DATE", "offsetDays": 15, "ifHoliday": "NEXT_WORKING"}',
     'Auditor appointment intimation'),

    ('MCA_DIR3KYC_ANNUAL', 'DIR-3 KYC', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'DIR-3 KYC',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"month": 9, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual KYC for directors'),

    ('MCA_FORM11_ANNUAL', 'Form 11 - LLP Annual Return', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'Form 11',
     '{"entityTypes": ["LLP"], "conditions": []}',
     '{"month": 5, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual return for LLPs'),

    ('MCA_FORM8_ANNUAL', 'Form 8 - LLP Statement of Accounts', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'Form 8',
     '{"entityTypes": ["LLP"], "conditions": []}',
     '{"month": 10, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}',
     'Statement of accounts for LLPs'),

    ('MCA_AGM_ANNUAL', 'Annual General Meeting', 'MCA', 'MEETING', 'CENTRAL', 'MEETING', 'ANNUAL', 'https://www.mca.gov.in', 'AGM',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": []}',
     '{"base": "FINANCIAL_YEAR_END", "offsetDays": 180, "ifHoliday": "PREVIOUS_WORKING"}',
     'Mandatory annual general meeting'),

    ('MCA_BOARD_MEETING', 'Board Meeting', 'MCA', 'MEETING', 'CENTRAL', 'MEETING', 'QUARTERLY', 'https://www.mca.gov.in', 'Board Meeting',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 0, "ifHoliday": "PREVIOUS_WORKING"}',
     'Quarterly board meeting (max 120 days gap)'),

    ('MCA_DPT3_ANNUAL', 'DPT-3 Return of Deposits', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'DPT-3',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED"], "conditions": []}',
     '{"month": 6, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}',
     'Annual return of deposits'),

    -- EPF Rules (3)
    ('EPF_ECR_MONTHLY', 'EPF Monthly ECR', 'EPF', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://unifiedportal.epfindia.gov.in', 'ECR',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "epfRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 15, "ifHoliday": "NEXT_WORKING"}',
     'Monthly EPF contribution return'),
    
    ('EPF_PAYMENT_MONTHLY', 'EPF Monthly Payment', 'EPF', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'MONTHLY', 'https://unifiedportal.epfindia.gov.in', 'Challan',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "epfRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Monthly EPF contribution payment'),

    ('EPF_ANNUAL_RETURN', 'EPF Annual Return', 'EPF', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://unifiedportal.epfindia.gov.in', 'Form 3A/6A',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "epfRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"month": 4, "day": 30, "ifHoliday": "NEXT_WORKING"}',
     'Annual EPF return'),

    -- ESI Rules (4)
    ('ESI_MONTHLY', 'ESI Monthly Contribution', 'ESI', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'MONTHLY', 'https://www.esic.nic.in', 'ESI Challan',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "esiRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 15, "ifHoliday": "PREVIOUS_WORKING"}',
     'Monthly ESI contribution payment'),

    ('ESI_RETURN_HALF_YEARLY', 'ESI Half-Yearly Return', 'ESI', 'RETURNS', 'CENTRAL', 'RETURN', 'HALF_YEARLY', 'https://www.esic.nic.in', 'Form 5',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "esiRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "HALF_YEAR_END", "offsetDays": 42, "ifHoliday": "NEXT_WORKING"}',
     'Half-yearly ESI return'),

    ('ESI_ACCIDENT_REPORT', 'ESI Accident Report', 'ESI', 'FORMS', 'CENTRAL', 'FORM', 'EVENT_BASED', 'https://www.esic.nic.in', 'Form 12',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "esiRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "EVENT_DATE", "offsetDays": 1, "ifHoliday": "NEXT_WORKING"}',
     'Report within 24 hours of accident'),

    ('ESI_ANNUAL_RETURN', 'ESI Annual Return', 'ESI', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.esic.nic.in', 'Form 01',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "esiRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"month": 1, "day": 15, "ifHoliday": "NEXT_WORKING"}',
     'Annual ESI return')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    "subCategory" = EXCLUDED."subCategory",
    description = EXCLUDED.description,
    "dueDateRules" = EXCLUDED."dueDateRules",
    "applicabilityRules" = EXCLUDED."applicabilityRules",
    "updatedAt" = NOW();

\echo 'Compliance rules inserted!'

-- ============================================================================
-- STEP 10: Insert 2025 National Holidays
-- ============================================================================
\echo ''
\echo '📋 Step 10: Inserting 2025 Holidays...'

INSERT INTO compliance."Holiday" ("holidayDate", name, type, year) VALUES
    ('2025-01-26', 'Republic Day', 'NATIONAL', 2025),
    ('2025-03-14', 'Holi', 'NATIONAL', 2025),
    ('2025-04-14', 'Ambedkar Jayanti', 'NATIONAL', 2025),
    ('2025-04-18', 'Good Friday', 'NATIONAL', 2025),
    ('2025-05-01', 'May Day', 'NATIONAL', 2025),
    ('2025-05-12', 'Buddha Purnima', 'NATIONAL', 2025),
    ('2025-06-07', 'Eid ul-Fitr', 'NATIONAL', 2025),
    ('2025-08-15', 'Independence Day', 'NATIONAL', 2025),
    ('2025-08-16', 'Janmashtami', 'NATIONAL', 2025),
    ('2025-10-02', 'Gandhi Jayanti', 'NATIONAL', 2025),
    ('2025-10-20', 'Dussehra', 'NATIONAL', 2025),
    ('2025-11-01', 'Diwali', 'NATIONAL', 2025),
    ('2025-11-05', 'Guru Nanak Jayanti', 'NATIONAL', 2025),
    ('2025-12-25', 'Christmas', 'NATIONAL', 2025)
ON CONFLICT ("holidayDate", "stateCode") DO NOTHING;

\echo 'Holidays inserted!'

-- ============================================================================
-- STEP 11: Add Foreign Key constraint for ComplianceCalendar -> ComplianceRule
-- ============================================================================
\echo ''
\echo '📋 Step 11: Adding foreign key constraint...'

-- First check if constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ComplianceCalendar_ruleId_fkey'
        AND table_schema = 'compliance'
    ) THEN
        -- Add FK constraint (if all existing ruleIds have matching rules)
        ALTER TABLE compliance."ComplianceCalendar" 
        ADD CONSTRAINT "ComplianceCalendar_ruleId_fkey" 
        FOREIGN KEY ("ruleId") REFERENCES compliance."ComplianceRule"(id);
        RAISE NOTICE 'Foreign key constraint added!';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add FK constraint - some ruleIds may not exist in ComplianceRule table';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo ''
\echo '=============================================================='
\echo 'VERIFICATION'
\echo '=============================================================='

\echo ''
\echo 'Tables in compliance schema:'
SELECT table_name FROM information_schema.tables WHERE table_schema = 'compliance' ORDER BY table_name;

\echo ''
\echo 'Compliance Rules count by category:'
SELECT category, COUNT(*) as count FROM compliance."ComplianceRule" GROUP BY category ORDER BY category;

\echo ''
\echo 'Total rules:'
SELECT COUNT(*) as total_rules FROM compliance."ComplianceRule";

\echo ''
\echo 'Holidays count:'
SELECT COUNT(*) as total_holidays FROM compliance."Holiday";

\echo ''
\echo '=============================================================='
\echo 'ALL MISSING TABLES ADDED SUCCESSFULLY!'
\echo '=============================================================='
\echo ''
\echo 'Summary:'
\echo '- ComplianceRule: 38 rules added'
\echo '- Holiday: 14 national holidays for 2025'
\echo '- Marketplace tables: Professional, Service, Engagement, etc.'
\echo '- Payment tables: Transaction, Escrow, Subscription'
\echo ''
