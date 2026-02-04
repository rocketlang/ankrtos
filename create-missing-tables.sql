-- ============================================================================
-- Ankr Compliance Platform - Create Missing Tables Script
-- Jai GuruJi! Shree Ganesh! 🙏
-- Created: December 22, 2025
-- 
-- This script creates ALL tables based on the Prisma schema.
-- It's idempotent - safe to run multiple times.
--
-- USAGE: 
--   docker exec -i compliance-postgres psql -U ankr -d compliance < create-missing-tables.sql
-- ============================================================================

\echo '=============================================================='
\echo 'ANKR COMPLIANCE - CREATE MISSING TABLES'
\echo 'Date: December 22, 2025'
\echo '=============================================================='

-- ============================================================================
-- STEP 1: Create compliance schema if it doesn't exist
-- ============================================================================
\echo ''
\echo '📋 Step 1: Creating compliance schema...'
CREATE SCHEMA IF NOT EXISTS compliance;

-- Set search path to include compliance schema
SET search_path TO compliance, public;

-- ============================================================================
-- STEP 2: Create ENUM types
-- ============================================================================
\echo ''
\echo '📋 Step 2: Creating ENUM types...'

-- EntityType
DO $$ BEGIN
    CREATE TYPE "EntityType" AS ENUM (
        'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 
        'PUBLIC_LIMITED', 'OPC', 'SECTION_8', 'TRUST', 'SOCIETY', 'HUF'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CompanyStatus
DO $$ BEGIN
    CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- MsmeCategory
DO $$ BEGIN
    CREATE TYPE "MsmeCategory" AS ENUM ('MICRO', 'SMALL', 'MEDIUM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddressType
DO $$ BEGIN
    CREATE TYPE "AddressType" AS ENUM ('REGISTERED', 'CORPORATE', 'BRANCH', 'FACTORY', 'WAREHOUSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- GstRegistrationType
DO $$ BEGIN
    CREATE TYPE "GstRegistrationType" AS ENUM ('REGULAR', 'COMPOSITION', 'CASUAL', 'SEZ', 'ISD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- GstFilingFrequency
DO $$ BEGIN
    CREATE TYPE "GstFilingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RegistrationStatus
DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PersonType
DO $$ BEGIN
    CREATE TYPE "PersonType" AS ENUM ('DIRECTOR', 'DESIGNATED_PARTNER', 'PARTNER', 'PROPRIETOR', 'KMP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PersonStatus
DO $$ BEGIN
    CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'CEASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CompanyRole
DO $$ BEGIN
    CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Jurisdiction
DO $$ BEGIN
    CREATE TYPE "Jurisdiction" AS ENUM ('CENTRAL', 'STATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FilingType
DO $$ BEGIN
    CREATE TYPE "FilingType" AS ENUM ('RETURN', 'FORM', 'PAYMENT', 'MEETING', 'AUDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FilingFrequency
DO $$ BEGIN
    CREATE TYPE "FilingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'EVENT_BASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CalendarStatus
DO $$ BEGIN
    CREATE TYPE "CalendarStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'NOT_APPLICABLE', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- HolidayType
DO $$ BEGIN
    CREATE TYPE "HolidayType" AS ENUM ('NATIONAL', 'STATE', 'BANK', 'RESTRICTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ProfessionalType
DO $$ BEGIN
    CREATE TYPE "ProfessionalType" AS ENUM ('CA', 'CS', 'LAWYER', 'TAX_CONSULTANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ProfessionalStatus
DO $$ BEGIN
    CREATE TYPE "ProfessionalStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ServiceCategory
DO $$ BEGIN
    CREATE TYPE "ServiceCategory" AS ENUM (
        'GST_FILING', 'INCOME_TAX', 'TDS_RETURN', 'ROC_FILING', 'AUDIT',
        'COMPANY_REGISTRATION', 'TRADEMARK', 'LEGAL_DRAFTING', 'COMPLIANCE_REVIEW', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PricingType
DO $$ BEGIN
    CREATE TYPE "PricingType" AS ENUM ('FIXED', 'HOURLY', 'QUOTE_BASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- EngagementStatus
DO $$ BEGIN
    CREATE TYPE "EngagementStatus" AS ENUM ('INQUIRY', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SenderType
DO $$ BEGIN
    CREATE TYPE "SenderType" AS ENUM ('COMPANY', 'PROFESSIONAL', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TransactionType
DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('SUBSCRIPTION', 'MARKETPLACE', 'ADDON', 'REFUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TransactionStatus
DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- EscrowStatus
DO $$ BEGIN
    CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SubscriptionStatus
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

\echo 'ENUMs created successfully!'

-- ============================================================================
-- STEP 3: Create Company table
-- ============================================================================
\echo ''
\echo '📋 Step 3: Creating Company table...'

CREATE TABLE IF NOT EXISTS compliance."Company" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "entityType" "EntityType" NOT NULL,
    "dateOfIncorporation" TIMESTAMP,
    cin TEXT UNIQUE,
    llpin TEXT UNIQUE,
    pan TEXT NOT NULL UNIQUE,
    tan TEXT,
    "primaryNicCode" TEXT,
    "industrySector" TEXT,
    "authorizedCapital" DECIMAL,
    "paidUpCapital" DECIMAL,
    "financialYearEnd" TEXT DEFAULT '03-31',
    "totalEmployees" INTEGER DEFAULT 0,
    "permanentEmployees" INTEGER DEFAULT 0,
    "contractEmployees" INTEGER DEFAULT 0,
    "isMsme" BOOLEAN DEFAULT false,
    "msmeCategory" "MsmeCategory",
    "udyamRegistration" TEXT,
    status "CompanyStatus" DEFAULT 'ACTIVE',
    "onboardingCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "createdBy" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "Company_pan_idx" ON compliance."Company"(pan);
CREATE INDEX IF NOT EXISTS "Company_cin_idx" ON compliance."Company"(cin);
CREATE INDEX IF NOT EXISTS "Company_status_idx" ON compliance."Company"(status);

\echo 'Company table created!'

-- ============================================================================
-- STEP 4: Create CompanyAddress table
-- ============================================================================
\echo ''
\echo '📋 Step 4: Creating CompanyAddress table...'

CREATE TABLE IF NOT EXISTS compliance."CompanyAddress" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "addressType" "AddressType" NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    city TEXT NOT NULL,
    district TEXT,
    "stateCode" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    pincode TEXT NOT NULL,
    "isPrimary" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CompanyAddress_companyId_idx" ON compliance."CompanyAddress"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyAddress_stateCode_idx" ON compliance."CompanyAddress"("stateCode");

\echo 'CompanyAddress table created!'

-- ============================================================================
-- STEP 5: Create Registration Tables
-- ============================================================================
\echo ''
\echo '📋 Step 5: Creating Registration tables...'

-- GstRegistration
CREATE TABLE IF NOT EXISTS compliance."GstRegistration" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    gstin TEXT NOT NULL UNIQUE,
    "stateCode" TEXT NOT NULL,
    "registrationType" "GstRegistrationType" NOT NULL,
    "registrationDate" TIMESTAMP,
    "filingFrequency" "GstFilingFrequency" DEFAULT 'MONTHLY',
    "isEinvoiceApplicable" BOOLEAN DEFAULT false,
    "einvoiceFromDate" TIMESTAMP,
    username TEXT,
    "isPrimary" BOOLEAN DEFAULT false,
    status "RegistrationStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "GstRegistration_companyId_idx" ON compliance."GstRegistration"("companyId");
CREATE INDEX IF NOT EXISTS "GstRegistration_stateCode_idx" ON compliance."GstRegistration"("stateCode");

-- EpfRegistration
CREATE TABLE IF NOT EXISTS compliance."EpfRegistration" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "establishmentCode" TEXT NOT NULL UNIQUE,
    "establishmentName" TEXT,
    "registrationDate" TIMESTAMP,
    "coveredEmployees" INTEGER DEFAULT 0,
    "isExempted" BOOLEAN DEFAULT false,
    status "RegistrationStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "EpfRegistration_companyId_idx" ON compliance."EpfRegistration"("companyId");

-- EsiRegistration
CREATE TABLE IF NOT EXISTS compliance."EsiRegistration" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "esiCode" TEXT NOT NULL UNIQUE,
    "stateCode" TEXT NOT NULL,
    "registrationDate" TIMESTAMP,
    "coveredEmployees" INTEGER DEFAULT 0,
    status "RegistrationStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "EsiRegistration_companyId_idx" ON compliance."EsiRegistration"("companyId");
CREATE INDEX IF NOT EXISTS "EsiRegistration_stateCode_idx" ON compliance."EsiRegistration"("stateCode");

-- PtRegistration
CREATE TABLE IF NOT EXISTS compliance."PtRegistration" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "stateCode" TEXT NOT NULL,
    "ptecNumber" TEXT,
    "ptrcNumber" TEXT,
    "registrationDate" TIMESTAMP,
    status "RegistrationStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "stateCode")
);

CREATE INDEX IF NOT EXISTS "PtRegistration_companyId_idx" ON compliance."PtRegistration"("companyId");

-- LwfRegistration
CREATE TABLE IF NOT EXISTS compliance."LwfRegistration" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "stateCode" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registrationDate" TIMESTAMP,
    status "RegistrationStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "stateCode")
);

CREATE INDEX IF NOT EXISTS "LwfRegistration_companyId_idx" ON compliance."LwfRegistration"("companyId");

\echo 'Registration tables created!'

-- ============================================================================
-- STEP 6: Create Personnel and other Company-related tables
-- ============================================================================
\echo ''
\echo '📋 Step 6: Creating Personnel and related tables...'

-- CompanyPersonnel
CREATE TABLE IF NOT EXISTS compliance."CompanyPersonnel" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "personType" "PersonType" NOT NULL,
    designation TEXT,
    din TEXT,
    dpin TEXT,
    pan TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    email TEXT,
    mobile TEXT,
    "dateOfAppointment" TIMESTAMP,
    "dateOfCessation" TIMESTAMP,
    "hasDsc" BOOLEAN DEFAULT false,
    "dscExpiryDate" TIMESTAMP,
    "isAuthorizedSignatory" BOOLEAN DEFAULT false,
    status "PersonStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CompanyPersonnel_companyId_idx" ON compliance."CompanyPersonnel"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyPersonnel_din_idx" ON compliance."CompanyPersonnel"(din);

-- CompanyTurnover
CREATE TABLE IF NOT EXISTS compliance."CompanyTurnover" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "financialYear" TEXT NOT NULL,
    "turnoverAmount" DECIMAL NOT NULL,
    "isAudited" BOOLEAN DEFAULT false,
    "isEstimated" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "financialYear")
);

-- CompanyStateEmployees
CREATE TABLE IF NOT EXISTS compliance."CompanyStateEmployees" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "stateCode" TEXT NOT NULL,
    "employeeCount" INTEGER DEFAULT 0,
    "asOfDate" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "stateCode", "asOfDate")
);

-- UserCompanyAccess
CREATE TABLE IF NOT EXISTS compliance."UserCompanyAccess" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    role "CompanyRole" NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "companyId")
);

CREATE INDEX IF NOT EXISTS "UserCompanyAccess_userId_idx" ON compliance."UserCompanyAccess"("userId");

\echo 'Personnel and related tables created!'

-- ============================================================================
-- STEP 7: Create ComplianceRule table (THE CRITICAL ONE!)
-- ============================================================================
\echo ''
\echo '📋 Step 7: Creating ComplianceRule table (CRITICAL)...'

CREATE TABLE IF NOT EXISTS compliance."ComplianceRule" (
    id TEXT PRIMARY KEY,  -- e.g., GST_GSTR1_MONTHLY
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    "subCategory" TEXT,
    jurisdiction "Jurisdiction" NOT NULL,
    "stateCode" TEXT,
    description TEXT,
    "filingType" "FilingType" NOT NULL,
    frequency "FilingFrequency" NOT NULL,
    portal TEXT,
    "formNumber" TEXT,
    "applicabilityRules" JSONB NOT NULL,
    "dueDateRules" JSONB NOT NULL,
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
-- STEP 8: Create CompanyApplicableRules table
-- ============================================================================
\echo ''
\echo '📋 Step 8: Creating CompanyApplicableRules table...'

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
-- STEP 9: Create ComplianceCalendar table
-- ============================================================================
\echo ''
\echo '📋 Step 9: Creating/Updating ComplianceCalendar table...'

CREATE TABLE IF NOT EXISTS compliance."ComplianceCalendar" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL REFERENCES compliance."Company"(id) ON DELETE CASCADE,
    "ruleId" TEXT NOT NULL REFERENCES compliance."ComplianceRule"(id),
    "filingPeriod" TEXT NOT NULL,
    "periodStartDate" TIMESTAMP NOT NULL,
    "periodEndDate" TIMESTAMP NOT NULL,
    "originalDueDate" TIMESTAMP NOT NULL,
    "extendedDueDate" TIMESTAMP,
    "actualDueDate" TIMESTAMP NOT NULL,
    status "CalendarStatus" DEFAULT 'PENDING',
    "completedAt" TIMESTAMP,
    "completedBy" TEXT,
    "acknowledgementNumber" TEXT,
    "filingDate" TIMESTAMP,
    remarks TEXT,
    "assignedTo" TEXT,
    "assignedProfessionalId" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("companyId", "ruleId", "filingPeriod")
);

CREATE INDEX IF NOT EXISTS "ComplianceCalendar_companyId_idx" ON compliance."ComplianceCalendar"("companyId");
CREATE INDEX IF NOT EXISTS "ComplianceCalendar_actualDueDate_idx" ON compliance."ComplianceCalendar"("actualDueDate");
CREATE INDEX IF NOT EXISTS "ComplianceCalendar_status_idx" ON compliance."ComplianceCalendar"(status);

\echo 'ComplianceCalendar table created!'

-- ============================================================================
-- STEP 10: Create DueDateExtension and Holiday tables
-- ============================================================================
\echo ''
\echo '📋 Step 10: Creating DueDateExtension and Holiday tables...'

-- DueDateExtension
CREATE TABLE IF NOT EXISTS compliance."DueDateExtension" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "ruleId" TEXT NOT NULL,
    "originalDueDate" TIMESTAMP NOT NULL,
    "extendedDueDate" TIMESTAMP NOT NULL,
    "notificationNumber" TEXT,
    "notificationDate" TIMESTAMP,
    "appliesToStates" TEXT[],
    "appliesToEntityTypes" "EntityType"[],
    reason TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DueDateExtension_ruleId_idx" ON compliance."DueDateExtension"("ruleId");
CREATE INDEX IF NOT EXISTS "DueDateExtension_originalDueDate_idx" ON compliance."DueDateExtension"("originalDueDate");

-- Holiday
CREATE TABLE IF NOT EXISTS compliance."Holiday" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "holidayDate" DATE NOT NULL,
    name TEXT NOT NULL,
    type "HolidayType" NOT NULL,
    "stateCode" TEXT,
    year INTEGER NOT NULL,
    UNIQUE("holidayDate", "stateCode")
);

CREATE INDEX IF NOT EXISTS "Holiday_year_idx" ON compliance."Holiday"(year);
CREATE INDEX IF NOT EXISTS "Holiday_stateCode_idx" ON compliance."Holiday"("stateCode");

\echo 'DueDateExtension and Holiday tables created!'

-- ============================================================================
-- STEP 11: Create Marketplace tables
-- ============================================================================
\echo ''
\echo '📋 Step 11: Creating Marketplace tables...'

-- Professional
CREATE TABLE IF NOT EXISTS compliance."Professional" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    type "ProfessionalType" NOT NULL,
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
    status "ProfessionalStatus" DEFAULT 'PENDING',
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
    category "ServiceCategory" NOT NULL,
    "pricingType" "PricingType" NOT NULL,
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
    status "EngagementStatus" DEFAULT 'INQUIRY',
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
    "senderType" "SenderType" NOT NULL,
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
-- STEP 12: Create Payment tables
-- ============================================================================
\echo ''
\echo '📋 Step 12: Creating Payment tables...'

-- Transaction
CREATE TABLE IF NOT EXISTS compliance."Transaction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type "TransactionType" NOT NULL,
    "companyId" TEXT,
    "professionalId" TEXT,
    "engagementId" TEXT,
    "subscriptionId" TEXT,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    status "TransactionStatus" DEFAULT 'PENDING',
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
    status "EscrowStatus" DEFAULT 'HELD',
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
    status "SubscriptionStatus" DEFAULT 'ACTIVE',
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
-- STEP 13: Create AuditLog table (TimescaleDB)
-- ============================================================================
\echo ''
\echo '📋 Step 13: Creating AuditLog table...'

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
-- STEP 14: Insert Sample Compliance Rules
-- ============================================================================
\echo ''
\echo '📋 Step 14: Inserting sample compliance rules...'

INSERT INTO compliance."ComplianceRule" (id, name, category, "subCategory", jurisdiction, "filingType", frequency, portal, "formNumber", "applicabilityRules", "dueDateRules")
VALUES 
    ('GST_GSTR1_MONTHLY', 'GSTR-1 Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-1', 
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 11, "ifHoliday": "NEXT_WORKING"}'),
    
    ('GST_GSTR3B_MONTHLY', 'GSTR-3B Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-3B',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 20, "ifHoliday": "NEXT_WORKING"}'),
    
    ('TDS_24Q_QUARTERLY', 'TDS Return - Salary (24Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '24Q',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP"], "conditions": [{"field": "permanentEmployees", "operator": "gt", "value": 0}]}',
     '{"base": "QUARTER_END", "offsetDays": 31, "ifHoliday": "NEXT_WORKING"}'),
    
    ('TDS_26Q_QUARTERLY', 'TDS Return - Non-Salary (26Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '26Q',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": []}',
     '{"base": "QUARTER_END", "offsetDays": 31, "ifHoliday": "NEXT_WORKING"}'),
    
    ('MCA_AOC4_ANNUAL', 'AOC-4 Annual Financial Statements', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'AOC-4',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"base": "AGM_DATE", "offsetDays": 30, "ifHoliday": "NEXT_WORKING"}'),
    
    ('MCA_MGT7_ANNUAL', 'MGT-7 Annual Return', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'MGT-7',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"base": "AGM_DATE", "offsetDays": 60, "ifHoliday": "NEXT_WORKING"}'),
    
    ('EPF_ECR_MONTHLY', 'EPF Monthly ECR', 'EPF', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://unifiedportal.epfindia.gov.in', 'ECR',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "epfRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 15, "ifHoliday": "NEXT_WORKING"}'),
    
    ('ESI_MONTHLY', 'ESI Monthly Return', 'ESI', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.esic.nic.in', 'ESI Return',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP"], "conditions": [{"field": "esiRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "MONTH_END", "offsetDays": 15, "ifHoliday": "NEXT_WORKING"}'),
    
    ('IT_ADVANCE_TAX_Q1', 'Advance Tax - Q1 (15% by June 15)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Advance Tax',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 6, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}'),
    
    ('IT_ADVANCE_TAX_Q2', 'Advance Tax - Q2 (45% by Sep 15)', 'INCOME_TAX', 'PAYMENT', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Advance Tax',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "turnovers.latest", "operator": "gt", "value": 1000000}]}',
     '{"month": 9, "day": 15, "ifHoliday": "PREVIOUS_WORKING"}'),
     
    ('GST_GSTR9_ANNUAL', 'GSTR-9 Annual Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.gst.gov.in', 'GSTR-9',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"], "conditions": [{"field": "gstRegistrations.exists", "operator": "eq", "value": true}]}',
     '{"base": "FINANCIAL_YEAR_END", "offsetDays": 270, "ifHoliday": "NEXT_WORKING"}'),
     
    ('MCA_DIR3KYC_ANNUAL', 'DIR-3 KYC Annual', 'MCA', 'ANNUAL_FILING', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'DIR-3 KYC',
     '{"entityTypes": ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "OPC"], "conditions": []}',
     '{"month": 9, "day": 30, "ifHoliday": "PREVIOUS_WORKING"}')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    "subCategory" = EXCLUDED."subCategory",
    "updatedAt" = NOW();

\echo 'Sample compliance rules inserted!'

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo ''
\echo '=============================================================='
\echo 'VERIFICATION - Checking created tables'
\echo '=============================================================='

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'compliance' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'compliance'
ORDER BY table_name;

\echo ''
\echo 'Compliance Rules count:'
SELECT COUNT(*) as rule_count FROM compliance."ComplianceRule";

\echo ''
\echo '=============================================================='
\echo 'ALL TABLES CREATED SUCCESSFULLY!'
\echo '=============================================================='
\echo ''
\echo 'Next steps:'
\echo '1. Run populate-calendar.sql to create calendar events'
\echo '2. Verify web app shows calendar data'
\echo ''
