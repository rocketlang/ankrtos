--
-- PostgreSQL database dump
--

\restrict XgZhwHs51F8IfbANqe4Qji7IO3JHcYQhbUCQIF2SJ80IihmXNc6MDXV8a5Qk4Uy

-- Dumped from database version 16.11
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: timescaledb; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS timescaledb WITH SCHEMA public;


--
-- Name: EXTENSION timescaledb; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION timescaledb IS 'Enables scalable inserts and complex queries for time-series data (Community Edition)';


--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: ankr
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO ankr;

--
-- Name: compliance; Type: SCHEMA; Schema: -; Owner: ankr
--

CREATE SCHEMA compliance;


ALTER SCHEMA compliance OWNER TO ankr;

--
-- Name: marketplace; Type: SCHEMA; Schema: -; Owner: ankr
--

CREATE SCHEMA marketplace;


ALTER SCHEMA marketplace OWNER TO ankr;

--
-- Name: AddressType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."AddressType" AS ENUM (
    'REGISTERED',
    'CORPORATE',
    'BRANCH',
    'FACTORY',
    'WAREHOUSE',
    'GODOWN',
    'PROJECT_SITE'
);


ALTER TYPE compliance."AddressType" OWNER TO ankr;

--
-- Name: CalendarStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."CalendarStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'OVERDUE',
    'NOT_APPLICABLE',
    'WAIVED'
);


ALTER TYPE compliance."CalendarStatus" OWNER TO ankr;

--
-- Name: CompanyRole; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."CompanyRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'VIEWER',
    'DIRECTOR',
    'CA',
    'CS',
    'LAWYER',
    'AUDITOR',
    'ACCOUNTANT'
);


ALTER TYPE compliance."CompanyRole" OWNER TO ankr;

--
-- Name: CompanyStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."CompanyStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'STRIKE_OFF',
    'UNDER_LIQUIDATION',
    'DORMANT'
);


ALTER TYPE compliance."CompanyStatus" OWNER TO ankr;

--
-- Name: DirectorCategory; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."DirectorCategory" AS ENUM (
    'EXECUTIVE',
    'NON_EXECUTIVE',
    'INDEPENDENT',
    'NOMINEE',
    'ALTERNATE',
    'ADDITIONAL',
    'MANAGING',
    'WHOLE_TIME'
);


ALTER TYPE compliance."DirectorCategory" OWNER TO ankr;

--
-- Name: EHSCategory; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EHSCategory" AS ENUM (
    'ENVIRONMENT',
    'HEALTH_SAFETY',
    'FIRE_SAFETY',
    'FACTORY_COMPLIANCE',
    'EQUIPMENT_SAFETY',
    'ELECTRICAL_SAFETY'
);


ALTER TYPE compliance."EHSCategory" OWNER TO ankr;

--
-- Name: EHSComplianceStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EHSComplianceStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'CANCELLED',
    'UNDER_RENEWAL'
);


ALTER TYPE compliance."EHSComplianceStatus" OWNER TO ankr;

--
-- Name: EHSComplianceType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EHSComplianceType" AS ENUM (
    'PCB_CONSENT_ESTABLISH',
    'PCB_CONSENT_OPERATE',
    'PCB_CONSENT_RENEWAL',
    'FORM_V_ENV_STATEMENT',
    'HAZARDOUS_WASTE_AUTH',
    'E_WASTE_AUTH',
    'BIOMEDICAL_WASTE_AUTH',
    'PLASTIC_WASTE_REG',
    'BATTERY_WASTE_REG',
    'STACK_EMISSION_TEST',
    'AMBIENT_AIR_TEST',
    'EFFLUENT_TEST',
    'GROUNDWATER_TEST',
    'NOISE_LEVEL_TEST',
    'FACTORY_LICENSE',
    'FACTORY_LICENSE_RENEWAL',
    'FACTORY_PLAN_APPROVAL',
    'SAFETY_COMMITTEE',
    'MOCK_DRILL',
    'ACCIDENT_REPORT',
    'FIRE_NOC',
    'FIRE_NOC_RENEWAL',
    'FIRE_SAFETY_AUDIT',
    'FIRE_EQUIPMENT_SERVICE',
    'BOILER_REGISTRATION',
    'BOILER_INSPECTION',
    'PRESSURE_VESSEL_LICENSE',
    'LIFT_LICENSE',
    'LIFT_INSPECTION',
    'DG_SET_APPROVAL',
    'ELECTRICAL_INSTALLATION_APPROVAL',
    'ELECTRICAL_SAFETY_AUDIT',
    'ENVIRONMENT_CLEARANCE',
    'CRZ_CLEARANCE',
    'FOREST_CLEARANCE'
);


ALTER TYPE compliance."EHSComplianceType" OWNER TO ankr;

--
-- Name: EHSFilingFrequency; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EHSFilingFrequency" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY',
    'ANNUAL',
    'BIENNIAL',
    'ONE_TIME',
    'ON_OCCURRENCE'
);


ALTER TYPE compliance."EHSFilingFrequency" OWNER TO ankr;

--
-- Name: EHSTestType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EHSTestType" AS ENUM (
    'STACK_EMISSION',
    'AMBIENT_AIR_QUALITY',
    'EFFLUENT_QUALITY',
    'GROUNDWATER_QUALITY',
    'NOISE_LEVEL',
    'SOIL_QUALITY',
    'DRINKING_WATER',
    'DG_EMISSION',
    'WORKPLACE_ENVIRONMENT'
);


ALTER TYPE compliance."EHSTestType" OWNER TO ankr;

--
-- Name: EntityType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."EntityType" AS ENUM (
    'PROPRIETORSHIP',
    'PARTNERSHIP',
    'LLP',
    'PRIVATE_LIMITED',
    'PUBLIC_LIMITED',
    'OPC',
    'SECTION_8',
    'TRUST',
    'SOCIETY',
    'HUF',
    'AOP',
    'BOI',
    'GOVERNMENT',
    'LOCAL_AUTHORITY'
);


ALTER TYPE compliance."EntityType" OWNER TO ankr;

--
-- Name: FDIRoute; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."FDIRoute" AS ENUM (
    'AUTOMATIC',
    'GOVERNMENT'
);


ALTER TYPE compliance."FDIRoute" OWNER TO ankr;

--
-- Name: FEMAFormType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."FEMAFormType" AS ENUM (
    'ARF',
    'FC_GPR',
    'FC_TRS',
    'FLA_RETURN',
    'APR',
    'FORM_ODI',
    'ECB_2',
    'FORM_ESOP',
    'FORM_CN',
    'LLP_I',
    'LLP_II',
    'FORM_DI'
);


ALTER TYPE compliance."FEMAFormType" OWNER TO ankr;

--
-- Name: FEMATransactionType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."FEMATransactionType" AS ENUM (
    'FDI_EQUITY',
    'FDI_CCPS',
    'FDI_CCD',
    'SHARE_TRANSFER_R_TO_NR',
    'SHARE_TRANSFER_NR_TO_R',
    'SHARE_TRANSFER_NR_TO_NR',
    'ODI_EQUITY',
    'ODI_LOAN',
    'ECB_DRAWDOWN',
    'ECB_REPAYMENT',
    'ESOP_TO_NR',
    'CONVERTIBLE_NOTE',
    'DIVIDEND_REPATRIATION'
);


ALTER TYPE compliance."FEMATransactionType" OWNER TO ankr;

--
-- Name: FacilityType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."FacilityType" AS ENUM (
    'FACTORY',
    'WAREHOUSE',
    'OFFICE',
    'RETAIL',
    'MIXED_USE',
    'R_AND_D',
    'DATA_CENTER',
    'COLD_STORAGE'
);


ALTER TYPE compliance."FacilityType" OWNER TO ankr;

--
-- Name: ForeignInvestorType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."ForeignInvestorType" AS ENUM (
    'NRI',
    'OCI',
    'FOREIGN_COMPANY',
    'FOREIGN_INDIVIDUAL',
    'FVCI',
    'FII',
    'FPI',
    'PE_FUND',
    'SOVEREIGN_WEALTH_FUND',
    'FOREIGN_TRUST',
    'FOREIGN_LLP'
);


ALTER TYPE compliance."ForeignInvestorType" OWNER TO ankr;

--
-- Name: GstFilingFrequency; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."GstFilingFrequency" AS ENUM (
    'MONTHLY',
    'QUARTERLY'
);


ALTER TYPE compliance."GstFilingFrequency" OWNER TO ankr;

--
-- Name: GstRegistrationType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."GstRegistrationType" AS ENUM (
    'REGULAR',
    'COMPOSITION',
    'CASUAL',
    'SEZ',
    'SEZ_DEVELOPER',
    'ISD',
    'TDS',
    'TCS',
    'OIDAR',
    'NON_RESIDENT'
);


ALTER TYPE compliance."GstRegistrationType" OWNER TO ankr;

--
-- Name: InstrumentType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."InstrumentType" AS ENUM (
    'EQUITY_SHARES',
    'CCPS',
    'CCD',
    'WARRANT',
    'ESOP',
    'SWEAT_EQUITY',
    'CONVERTIBLE_NOTE'
);


ALTER TYPE compliance."InstrumentType" OWNER TO ankr;

--
-- Name: KMPDesignation; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."KMPDesignation" AS ENUM (
    'CEO',
    'CFO',
    'CS',
    'MD',
    'WTD',
    'MANAGER'
);


ALTER TYPE compliance."KMPDesignation" OWNER TO ankr;

--
-- Name: LwfFilingFrequency; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."LwfFilingFrequency" AS ENUM (
    'MONTHLY',
    'HALF_YEARLY',
    'ANNUAL'
);


ALTER TYPE compliance."LwfFilingFrequency" OWNER TO ankr;

--
-- Name: MsmeCategory; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."MsmeCategory" AS ENUM (
    'MICRO',
    'SMALL',
    'MEDIUM'
);


ALTER TYPE compliance."MsmeCategory" OWNER TO ankr;

--
-- Name: PersonStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."PersonStatus" AS ENUM (
    'ACTIVE',
    'CEASED',
    'DISQUALIFIED',
    'RESIGNED'
);


ALTER TYPE compliance."PersonStatus" OWNER TO ankr;

--
-- Name: PersonType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."PersonType" AS ENUM (
    'DIRECTOR',
    'DESIGNATED_PARTNER',
    'PARTNER',
    'PROPRIETOR',
    'KMP',
    'AUTHORIZED_SIGNATORY',
    'SHAREHOLDER'
);


ALTER TYPE compliance."PersonType" OWNER TO ankr;

--
-- Name: PollutionCategory; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."PollutionCategory" AS ENUM (
    'RED',
    'ORANGE',
    'GREEN',
    'WHITE'
);


ALTER TYPE compliance."PollutionCategory" OWNER TO ankr;

--
-- Name: PtFilingFrequency; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."PtFilingFrequency" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY',
    'ANNUAL'
);


ALTER TYPE compliance."PtFilingFrequency" OWNER TO ankr;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."RegistrationStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'CANCELLED',
    'SUSPENDED'
);


ALTER TYPE compliance."RegistrationStatus" OWNER TO ankr;

--
-- Name: RenewalStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."RenewalStatus" AS ENUM (
    'NOT_DUE',
    'DUE_SOON',
    'DUE',
    'OVERDUE',
    'APPLIED',
    'RENEWED'
);


ALTER TYPE compliance."RenewalStatus" OWNER TO ankr;

--
-- Name: SuggestionStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."SuggestionStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'IMPLEMENTED'
);


ALTER TYPE compliance."SuggestionStatus" OWNER TO ankr;

--
-- Name: SuggestionType; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."SuggestionType" AS ENUM (
    'RULE_CORRECTION',
    'NEW_RULE',
    'FEATURE_REQUEST',
    'BUG_REPORT',
    'GENERAL_FEEDBACK'
);


ALTER TYPE compliance."SuggestionType" OWNER TO ankr;

--
-- Name: TestResult; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."TestResult" AS ENUM (
    'PASS',
    'FAIL',
    'PARTIAL',
    'PENDING_REVIEW'
);


ALTER TYPE compliance."TestResult" OWNER TO ankr;

--
-- Name: TestingStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."TestingStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'OVERDUE'
);


ALTER TYPE compliance."TestingStatus" OWNER TO ankr;

--
-- Name: UserStatus; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION'
);


ALTER TYPE compliance."UserStatus" OWNER TO ankr;

--
-- Name: ValuationMethod; Type: TYPE; Schema: compliance; Owner: ankr
--

CREATE TYPE compliance."ValuationMethod" AS ENUM (
    'DCF',
    'NAV',
    'PE_MULTIPLE',
    'MARKET_PRICE',
    'BOOK_VALUE',
    'COMPARABLE_TRANSACTION'
);


ALTER TYPE compliance."ValuationMethod" OWNER TO ankr;

--
-- Name: AvailabilityStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."AvailabilityStatus" AS ENUM (
    'AVAILABLE',
    'BUSY',
    'UNAVAILABLE'
);


ALTER TYPE marketplace."AvailabilityStatus" OWNER TO ankr;

--
-- Name: DisputeRaisedBy; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."DisputeRaisedBy" AS ENUM (
    'CLIENT',
    'PROFESSIONAL'
);


ALTER TYPE marketplace."DisputeRaisedBy" OWNER TO ankr;

--
-- Name: DisputeStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."DisputeStatus" AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'ESCALATED',
    'CLOSED'
);


ALTER TYPE marketplace."DisputeStatus" OWNER TO ankr;

--
-- Name: EscrowStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."EscrowStatus" AS ENUM (
    'PENDING_PAYMENT',
    'FUNDED',
    'IN_PROGRESS',
    'DELIVERED',
    'RELEASED',
    'PARTIALLY_RELEASED',
    'DISPUTED',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE marketplace."EscrowStatus" OWNER TO ankr;

--
-- Name: JobStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."JobStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'DELIVERED',
    'REVISION_REQUESTED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED'
);


ALTER TYPE marketplace."JobStatus" OWNER TO ankr;

--
-- Name: MessageSenderType; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."MessageSenderType" AS ENUM (
    'CLIENT',
    'PROFESSIONAL',
    'SYSTEM'
);


ALTER TYPE marketplace."MessageSenderType" OWNER TO ankr;

--
-- Name: MilestoneStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."MilestoneStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'RELEASED',
    'DISPUTED'
);


ALTER TYPE marketplace."MilestoneStatus" OWNER TO ankr;

--
-- Name: ProfessionalType; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."ProfessionalType" AS ENUM (
    'CA',
    'CS',
    'LAWYER',
    'TAX_CONSULTANT',
    'AUDITOR',
    'COST_ACCOUNTANT',
    'COMPANY_SECRETARY'
);


ALTER TYPE marketplace."ProfessionalType" OWNER TO ankr;

--
-- Name: RazorpayOrderStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."RazorpayOrderStatus" AS ENUM (
    'CREATED',
    'ATTEMPTED',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE marketplace."RazorpayOrderStatus" OWNER TO ankr;

--
-- Name: VerificationStatus; Type: TYPE; Schema: marketplace; Owner: ankr
--

CREATE TYPE marketplace."VerificationStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE marketplace."VerificationStatus" OWNER TO ankr;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Company; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."Company" (
    id text NOT NULL,
    "legalName" character varying(255) NOT NULL,
    "tradeName" character varying(255),
    "entityType" compliance."EntityType" NOT NULL,
    "dateOfIncorporation" timestamp(3) without time zone,
    cin character varying(21),
    llpin character varying(8),
    pan character varying(10) NOT NULL,
    tan character varying(10),
    "primaryNicCode" character varying(5),
    "secondaryNicCodes" text[] DEFAULT ARRAY[]::text[],
    "industrySector" character varying(100),
    "businessActivity" text,
    "authorizedCapital" numeric(18,2),
    "paidUpCapital" numeric(18,2),
    "financialYearEnd" character varying(5) DEFAULT '03-31'::character varying NOT NULL,
    "totalEmployees" integer DEFAULT 0 NOT NULL,
    "permanentEmployees" integer DEFAULT 0 NOT NULL,
    "contractEmployees" integer DEFAULT 0 NOT NULL,
    "isMsme" boolean DEFAULT false NOT NULL,
    "msmeCategory" compliance."MsmeCategory",
    "udyamRegistration" character varying(25),
    email character varying(255),
    phone character varying(15),
    website character varying(255),
    status compliance."CompanyStatus" DEFAULT 'ACTIVE'::compliance."CompanyStatus" NOT NULL,
    "onboardingCompleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE compliance."Company" OWNER TO ankr;

--
-- Name: CompanyAddress; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."CompanyAddress" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "addressType" compliance."AddressType" NOT NULL,
    "addressLine1" character varying(255) NOT NULL,
    "addressLine2" character varying(255),
    landmark character varying(100),
    city character varying(100) NOT NULL,
    district character varying(100),
    "stateCode" character varying(2) NOT NULL,
    pincode character varying(6) NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "contactPerson" character varying(100),
    "contactPhone" character varying(15),
    "contactEmail" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."CompanyAddress" OWNER TO ankr;

--
-- Name: CompanyPersonnel; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."CompanyPersonnel" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "personType" compliance."PersonType" NOT NULL,
    designation character varying(100),
    din character varying(8),
    dpin character varying(8),
    pan character varying(10),
    salutation character varying(10),
    "firstName" character varying(100) NOT NULL,
    "middleName" character varying(100),
    "lastName" character varying(100),
    "fatherName" character varying(255),
    "dateOfBirth" timestamp(3) without time zone,
    gender character varying(10),
    nationality character varying(50) DEFAULT 'Indian'::character varying NOT NULL,
    email character varying(255),
    mobile character varying(15),
    "residentialAddress" text,
    city character varying(100),
    "stateCode" character varying(2),
    pincode character varying(6),
    "dateOfAppointment" timestamp(3) without time zone,
    "dateOfCessation" timestamp(3) without time zone,
    "cessationReason" character varying(255),
    "directorCategory" compliance."DirectorCategory",
    "isIndependentDirector" boolean,
    "kmpDesignation" compliance."KMPDesignation",
    "hasDsc" boolean DEFAULT false NOT NULL,
    "dscClass" character varying(10),
    "dscExpiryDate" timestamp(3) without time zone,
    "dscProvider" character varying(100),
    "isAuthorizedSignatory" boolean DEFAULT false NOT NULL,
    "authorizedFor" text[] DEFAULT ARRAY[]::text[],
    "shareholdingPercent" numeric(5,2),
    "numberOfShares" bigint,
    status compliance."PersonStatus" DEFAULT 'ACTIVE'::compliance."PersonStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."CompanyPersonnel" OWNER TO ankr;

--
-- Name: CompanyStateEmployees; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."CompanyStateEmployees" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "employeeCount" integer DEFAULT 0 NOT NULL,
    "permanentCount" integer,
    "contractCount" integer,
    "asOfDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE compliance."CompanyStateEmployees" OWNER TO ankr;

--
-- Name: CompanyTurnover; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."CompanyTurnover" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "financialYear" character varying(7) NOT NULL,
    "turnoverAmount" numeric(18,2) NOT NULL,
    "isAudited" boolean DEFAULT false NOT NULL,
    "isEstimated" boolean DEFAULT false NOT NULL,
    "auditDate" timestamp(3) without time zone,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."CompanyTurnover" OWNER TO ankr;

--
-- Name: ComplianceCalendar; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."ComplianceCalendar" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "ruleId" character varying(50) NOT NULL,
    "filingPeriod" character varying(20) NOT NULL,
    "periodStartDate" timestamp(3) without time zone NOT NULL,
    "periodEndDate" timestamp(3) without time zone NOT NULL,
    "originalDueDate" timestamp(3) without time zone NOT NULL,
    "extendedDueDate" timestamp(3) without time zone,
    "actualDueDate" timestamp(3) without time zone NOT NULL,
    status compliance."CalendarStatus" DEFAULT 'PENDING'::compliance."CalendarStatus" NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "completedBy" text,
    "acknowledgementNumber" character varying(100),
    "filingDate" timestamp(3) without time zone,
    remarks text,
    "assignedTo" text,
    "assignedProfessionalId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "acknowledgementDate" timestamp(3) without time zone,
    "proofDocumentUrl" text,
    "lateFee" numeric(10,2),
    "interestAmount" numeric(10,2),
    "taxPaid" numeric(10,2),
    "penaltyAmount" numeric(10,2),
    priority text DEFAULT 'NORMAL'::text,
    "reminderSent" boolean DEFAULT false,
    escalated boolean DEFAULT false,
    "filingRecordId" text
);


ALTER TABLE compliance."ComplianceCalendar" OWNER TO ankr;

--
-- Name: ComplianceRule; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."ComplianceRule" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "subCategory" text,
    jurisdiction text DEFAULT 'CENTRAL'::text NOT NULL,
    "stateCode" text,
    description text,
    "filingType" text NOT NULL,
    frequency text NOT NULL,
    portal text,
    "formNumber" text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    "notificationRef" text,
    "circularRef" text,
    "officialPdfUrl" text,
    "sourceUrl" text,
    "lastAmendedDate" date,
    "verifiedByCount" integer DEFAULT 0,
    "lastVerifiedAt" timestamp without time zone,
    "lastVerifiedBy" text,
    "amendmentHistory" jsonb DEFAULT '[]'::jsonb,
    "penaltyDetails" jsonb,
    "dueDay" integer,
    "dueDayType" text DEFAULT 'DAY_OF_MONTH'::text,
    "gracePeriodDays" integer DEFAULT 0
);


ALTER TABLE compliance."ComplianceRule" OWNER TO ankr;

--
-- Name: EHSCompliance; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."EHSCompliance" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "facilityId" text,
    "complianceType" compliance."EHSComplianceType" NOT NULL,
    category compliance."EHSCategory" NOT NULL,
    "subCategory" character varying(100),
    "issuingAuthority" character varying(255) NOT NULL,
    "authorityState" character varying(100),
    "authorityDistrict" character varying(100),
    "registrationNo" character varying(100),
    "applicationNo" character varying(100),
    "issueDate" timestamp(3) without time zone,
    "validFrom" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "renewalDueDate" timestamp(3) without time zone,
    "renewalStatus" compliance."RenewalStatus" DEFAULT 'NOT_DUE'::compliance."RenewalStatus" NOT NULL,
    "lastRenewalDate" timestamp(3) without time zone,
    "filingFrequency" compliance."EHSFilingFrequency",
    "nextFilingDue" timestamp(3) without time zone,
    "lastFiledDate" timestamp(3) without time zone,
    conditions text,
    remarks text,
    status compliance."EHSComplianceStatus" DEFAULT 'ACTIVE'::compliance."EHSComplianceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."EHSCompliance" OWNER TO ankr;

--
-- Name: EHSProfile; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."EHSProfile" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "isManufacturing" boolean DEFAULT false NOT NULL,
    "isFactory" boolean DEFAULT false NOT NULL,
    "hasEnvironmentalImpact" boolean DEFAULT false NOT NULL,
    "requiresFireNOC" boolean DEFAULT false NOT NULL,
    "factoryLicenseRequired" boolean DEFAULT false NOT NULL,
    "pcbConsentRequired" boolean DEFAULT false NOT NULL,
    "handlesHazardous" boolean DEFAULT false NOT NULL,
    "fireNOCRequired" boolean DEFAULT false NOT NULL,
    "factoryLicenseState" character varying(100),
    "pcbState" character varying(100),
    "pollutionCategory" compliance."PollutionCategory",
    "totalFacilities" integer DEFAULT 0 NOT NULL,
    "manufacturingUnits" integer DEFAULT 0 NOT NULL,
    warehouses integer DEFAULT 0 NOT NULL,
    offices integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."EHSProfile" OWNER TO ankr;

--
-- Name: EHSTestingRecord; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."EHSTestingRecord" (
    id text NOT NULL,
    "facilityId" text NOT NULL,
    "testType" compliance."EHSTestType" NOT NULL,
    "testingAgency" character varying(255) NOT NULL,
    "testingAgencyAccreditation" character varying(100),
    "scheduledDate" timestamp(3) without time zone,
    "actualDate" timestamp(3) without time zone,
    "nextDueDate" timestamp(3) without time zone,
    "reportNumber" character varying(100),
    "reportDate" timestamp(3) without time zone,
    "overallResult" compliance."TestResult",
    parameters jsonb,
    status compliance."TestingStatus" DEFAULT 'SCHEDULED'::compliance."TestingStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."EHSTestingRecord" OWNER TO ankr;

--
-- Name: EpfRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."EpfRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "establishmentCode" character varying(25) NOT NULL,
    "establishmentName" character varying(255),
    "registrationDate" timestamp(3) without time zone,
    "coveredEmployees" integer DEFAULT 0 NOT NULL,
    "isExempted" boolean DEFAULT false NOT NULL,
    "exemptionCategory" character varying(50),
    "exemptionDate" timestamp(3) without time zone,
    "wageLimit" numeric(10,2) DEFAULT 15000 NOT NULL,
    "employerContributionRate" numeric(5,2) DEFAULT 12 NOT NULL,
    "employeeContributionRate" numeric(5,2) DEFAULT 12 NOT NULL,
    "adminChargesRate" numeric(5,2) DEFAULT 0.5 NOT NULL,
    "isEdliApplicable" boolean DEFAULT true NOT NULL,
    username character varying(50),
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "dscHolderName" character varying(100),
    "dscExpiryDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."EpfRegistration" OWNER TO ankr;

--
-- Name: EsiRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."EsiRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "esiCode" character varying(17) NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "registrationDate" timestamp(3) without time zone,
    "coveredEmployees" integer DEFAULT 0 NOT NULL,
    "wageLimit" numeric(10,2) DEFAULT 21000 NOT NULL,
    "employerContributionRate" numeric(5,2) DEFAULT 3.25 NOT NULL,
    "employeeContributionRate" numeric(5,2) DEFAULT 0.75 NOT NULL,
    "dispensaryName" character varying(255),
    "dispensaryAddress" text,
    "dispensaryCode" character varying(20),
    username character varying(50),
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."EsiRegistration" OWNER TO ankr;

--
-- Name: FEMAFiling; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."FEMAFiling" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "formType" compliance."FEMAFormType" NOT NULL,
    "filingPeriod" character varying(50) NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "filedDate" timestamp(3) without time zone,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "acknowledgementNo" character varying(100),
    "rbiReferenceNo" character varying(100),
    "adBankName" character varying(200),
    "adBankCode" character varying(20),
    "isLate" boolean DEFAULT false NOT NULL,
    "daysLate" integer,
    "lateSubmissionFee" numeric(12,2),
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."FEMAFiling" OWNER TO ankr;

--
-- Name: FEMAProfile; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."FEMAProfile" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "hasForeignShareholders" boolean DEFAULT false NOT NULL,
    "hasNRIShareholders" boolean DEFAULT false NOT NULL,
    "hasOverseasSubsidiary" boolean DEFAULT false NOT NULL,
    "hasJointVenture" boolean DEFAULT false NOT NULL,
    "hasECB" boolean DEFAULT false NOT NULL,
    "hasESOPToNonResidents" boolean DEFAULT false NOT NULL,
    "hasConvertibleNotes" boolean DEFAULT false NOT NULL,
    "entityMasterCreated" boolean DEFAULT false NOT NULL,
    "entityMasterDate" timestamp(3) without time zone,
    "firmsUserId" character varying(50),
    sector character varying(200),
    "nicCode" character varying(10),
    "fdiRoute" compliance."FDIRoute",
    "sectoralFDICap" numeric(5,2),
    "totalForeignEquity" numeric(18,2),
    "foreignHoldingPercent" numeric(5,2),
    "totalODI" numeric(18,2),
    "primaryADBankName" character varying(200),
    "primaryADBankIFSC" character varying(11),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."FEMAProfile" OWNER TO ankr;

--
-- Name: FEMATransaction; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."FEMATransaction" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "transactionType" compliance."FEMATransactionType" NOT NULL,
    "transactionDate" timestamp(3) without time zone NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying(3) NOT NULL,
    "exchangeRate" numeric(12,6) NOT NULL,
    "amountInINR" numeric(18,2) NOT NULL,
    "foreignPartyName" character varying(255) NOT NULL,
    "foreignPartyCountry" character varying(100) NOT NULL,
    "foreignPartyType" compliance."ForeignInvestorType" NOT NULL,
    "foreignPartyAddress" text,
    "foreignPartyPAN" character varying(10),
    "foreignPartyLEI" character varying(20),
    "instrumentType" compliance."InstrumentType",
    "numberOfInstruments" integer,
    "faceValue" numeric(10,2),
    "issuePrice" numeric(10,2),
    premium numeric(18,2),
    "adBankName" character varying(200),
    "adBankIFSC" character varying(11),
    "fircNumber" character varying(50),
    "fircDate" timestamp(3) without time zone,
    "valuationDate" timestamp(3) without time zone,
    "valuationMethod" compliance."ValuationMethod",
    "valuerName" character varying(200),
    "fairMarketValue" numeric(18,2),
    "filingId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."FEMATransaction" OWNER TO ankr;

--
-- Name: Facility; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."Facility" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name character varying(255) NOT NULL,
    type compliance."FacilityType" NOT NULL,
    code character varying(50),
    "addressLine1" character varying(255) NOT NULL,
    "addressLine2" character varying(255),
    city character varying(100) NOT NULL,
    district character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(6) NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    "builtUpArea" numeric(12,2),
    "plotArea" numeric(12,2),
    "numberOfFloors" integer,
    "isHighRise" boolean DEFAULT false NOT NULL,
    "isManufacturing" boolean DEFAULT false NOT NULL,
    "manufacturingProcess" text,
    "productsManufactured" text,
    "annualProduction" numeric(18,2),
    "hasBoiler" boolean DEFAULT false NOT NULL,
    "boilerCapacity" numeric(10,2),
    "hasDGSet" boolean DEFAULT false NOT NULL,
    "dgSetCapacity" numeric(10,2),
    "hasETP" boolean DEFAULT false NOT NULL,
    "etpCapacity" numeric(10,2),
    "hasSTP" boolean DEFAULT false NOT NULL,
    "stpCapacity" numeric(10,2),
    "generatesHazWaste" boolean DEFAULT false NOT NULL,
    "hazWasteCategories" text[] DEFAULT ARRAY[]::text[],
    "generatesEWaste" boolean DEFAULT false NOT NULL,
    "generatesBioMedWaste" boolean DEFAULT false NOT NULL,
    "hasAirEmissions" boolean DEFAULT false NOT NULL,
    "emissionSources" text[] DEFAULT ARRAY[]::text[],
    "hasEffluentDischarge" boolean DEFAULT false NOT NULL,
    "effluentQuantity" numeric(10,2),
    "employeeCount" integer,
    "contractLabourCount" integer,
    "womenEmployees" integer,
    "operatingShifts" integer,
    "operatingDaysPerWeek" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "operationalSince" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."Facility" OWNER TO ankr;

--
-- Name: FactoryRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."FactoryRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "registrationNumber" character varying(50) NOT NULL,
    "licenseNumber" character varying(50),
    "registrationDate" timestamp(3) without time zone,
    "licenseExpiryDate" timestamp(3) without time zone,
    "factoryName" character varying(255) NOT NULL,
    "factoryAddress" text NOT NULL,
    "natureOfManufacturing" character varying(255),
    "productsManufactured" text[] DEFAULT ARRAY[]::text[],
    "installedPowerHP" numeric(10,2),
    "connectedLoadKW" numeric(10,2),
    "employeeCount" integer DEFAULT 0 NOT NULL,
    "maleWorkers" integer,
    "femaleWorkers" integer,
    "contractWorkers" integer,
    "coveredAreaSqFt" numeric(12,2),
    "openAreaSqFt" numeric(12,2),
    "isHazardous" boolean DEFAULT false NOT NULL,
    "hazardousProcesses" text[] DEFAULT ARRAY[]::text[],
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."FactoryRegistration" OWNER TO ankr;

--
-- Name: FilingRecord; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."FilingRecord" (
    id text DEFAULT ('fil_'::text || substr(md5((random())::text), 1, 10)) NOT NULL,
    "calendarItemId" text NOT NULL,
    "companyId" text NOT NULL,
    "filingType" text NOT NULL,
    "filingPeriod" text NOT NULL,
    status text DEFAULT 'DATA_ENTRY'::text NOT NULL,
    "jsonData" jsonb,
    "generatedFile" text,
    "generatedFilename" text,
    "validationResult" jsonb,
    "acknowledgementNumber" text,
    "acknowledgementDate" timestamp(3) without time zone,
    "filedAt" timestamp(3) without time zone,
    "filedBy" text,
    "portalResponse" text,
    "createdAt" timestamp(3) without time zone DEFAULT now(),
    "updatedAt" timestamp(3) without time zone DEFAULT now()
);


ALTER TABLE compliance."FilingRecord" OWNER TO ankr;

--
-- Name: GstRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."GstRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    gstin character varying(15) NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "registrationType" compliance."GstRegistrationType" NOT NULL,
    "registrationDate" timestamp(3) without time zone,
    "filingFrequency" compliance."GstFilingFrequency" DEFAULT 'MONTHLY'::compliance."GstFilingFrequency" NOT NULL,
    "isEinvoiceApplicable" boolean DEFAULT false NOT NULL,
    "einvoiceFromDate" timestamp(3) without time zone,
    "isEwayBillApplicable" boolean DEFAULT true NOT NULL,
    "isCompositionScheme" boolean DEFAULT false NOT NULL,
    "compositionCategory" character varying(50),
    username character varying(50),
    "isPrimary" boolean DEFAULT false NOT NULL,
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "legalName" character varying(255),
    "tradeName" character varying(255),
    "authorizedSignatoryName" character varying(100),
    "authorizedSignatoryDesignation" character varying(100),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."GstRegistration" OWNER TO ankr;

--
-- Name: LwfRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."LwfRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "registrationNumber" character varying(50),
    "registrationDate" timestamp(3) without time zone,
    "filingFrequency" compliance."LwfFilingFrequency" DEFAULT 'HALF_YEARLY'::compliance."LwfFilingFrequency" NOT NULL,
    "employerContribution" numeric(10,2),
    "employeeContribution" numeric(10,2),
    username character varying(50),
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."LwfRegistration" OWNER TO ankr;

--
-- Name: PtRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."PtRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "ptecNumber" character varying(50),
    "ptrcNumber" character varying(50),
    "registrationDate" timestamp(3) without time zone,
    "filingFrequency" compliance."PtFilingFrequency" DEFAULT 'MONTHLY'::compliance."PtFilingFrequency" NOT NULL,
    "taxSlabApplicable" character varying(50),
    "enrolledEmployees" integer DEFAULT 0 NOT NULL,
    username character varying(50),
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "wardCircle" character varying(50),
    "assessmentYear" character varying(10),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."PtRegistration" OWNER TO ankr;

--
-- Name: RuleUpdateLog; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."RuleUpdateLog" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "ruleId" text NOT NULL,
    "changedBy" text,
    "changeType" text NOT NULL,
    "oldValue" jsonb,
    "newValue" jsonb,
    source text,
    "createdAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE compliance."RuleUpdateLog" OWNER TO ankr;

--
-- Name: RuleVerification; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."RuleVerification" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "ruleId" text NOT NULL,
    "userId" text NOT NULL,
    "isAccurate" boolean NOT NULL,
    comments text,
    "suggestedChange" text,
    "sourceProvided" text,
    "verifiedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE compliance."RuleVerification" OWNER TO ankr;

--
-- Name: ShopEstRegistration; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."ShopEstRegistration" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "stateCode" character varying(2) NOT NULL,
    "registrationNumber" character varying(50) NOT NULL,
    "registrationDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "shopName" character varying(255),
    "shopAddress" text,
    "natureOfBusiness" character varying(255),
    "employeeCount" integer DEFAULT 0 NOT NULL,
    "maleEmployees" integer,
    "femaleEmployees" integer,
    "openingTime" character varying(5),
    "closingTime" character varying(5),
    "weeklyOff" character varying(20),
    status compliance."RegistrationStatus" DEFAULT 'ACTIVE'::compliance."RegistrationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE compliance."ShopEstRegistration" OWNER TO ankr;

--
-- Name: Suggestion; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."Suggestion" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    type compliance."SuggestionType" NOT NULL,
    status compliance."SuggestionStatus" DEFAULT 'PENDING'::compliance."SuggestionStatus",
    "userId" text,
    "userName" text,
    "userEmail" text,
    "userPhone" text,
    "isProfessional" boolean DEFAULT false,
    title text NOT NULL,
    description text,
    category text,
    "ruleId" text,
    "fieldToCorrect" text,
    "currentValue" text,
    "suggestedValue" text,
    "newRuleName" text,
    "newRuleCategory" text,
    "newRuleFrequency" text,
    "newRuleSource" text,
    "sourceUrl" text,
    "sourceDocument" text,
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    "reviewedBy" text,
    "reviewedAt" timestamp without time zone,
    "reviewNotes" text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE compliance."Suggestion" OWNER TO ankr;

--
-- Name: User; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."User" (
    id text NOT NULL,
    phone character varying(15) NOT NULL,
    email character varying(255),
    name character varying(100) NOT NULL,
    "avatarUrl" character varying(500),
    "isProfessional" boolean DEFAULT false NOT NULL,
    "professionalType" character varying(50),
    "professionalId" text,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "isKycVerified" boolean DEFAULT false NOT NULL,
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "googleId" text,
    "authProvider" text DEFAULT 'EMAIL'::text
);


ALTER TABLE compliance."User" OWNER TO ankr;

--
-- Name: UserCompanyAccess; Type: TABLE; Schema: compliance; Owner: ankr
--

CREATE TABLE compliance."UserCompanyAccess" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyId" text NOT NULL,
    role compliance."CompanyRole" NOT NULL,
    "grantedBy" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE compliance."UserCompanyAccess" OWNER TO ankr;

--
-- Name: Dispute; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Dispute" (
    id text NOT NULL,
    "escrowId" text NOT NULL,
    "raisedBy" marketplace."DisputeRaisedBy" NOT NULL,
    "raisedByUserId" text NOT NULL,
    reason character varying(255) NOT NULL,
    description text NOT NULL,
    evidence text[] DEFAULT ARRAY[]::text[],
    status marketplace."DisputeStatus" DEFAULT 'OPEN'::marketplace."DisputeStatus" NOT NULL,
    resolution text,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    "refundAmount" integer,
    "releaseAmount" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Dispute" OWNER TO ankr;

--
-- Name: Escrow; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Escrow" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "clientId" text NOT NULL,
    "professionalId" text NOT NULL,
    amount integer NOT NULL,
    "platformFee" integer NOT NULL,
    "netAmount" integer NOT NULL,
    status marketplace."EscrowStatus" DEFAULT 'PENDING_PAYMENT'::marketplace."EscrowStatus" NOT NULL,
    "paymentMethod" character varying(50),
    "razorpayOrderId" character varying(100),
    "razorpayPaymentId" character varying(100),
    "razorpaySignature" text,
    "fundedAt" timestamp(3) without time zone,
    "releasedAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Escrow" OWNER TO ankr;

--
-- Name: Gig; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Gig" (
    id text NOT NULL,
    "professionalId" text NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    tags text[] DEFAULT ARRAY[]::text[],
    packages jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    orders integer DEFAULT 0 NOT NULL,
    rating numeric(3,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Gig" OWNER TO ankr;

--
-- Name: Job; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Job" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "gigId" text,
    "clientId" text NOT NULL,
    "clientName" character varying(255) NOT NULL,
    "clientCompany" character varying(255),
    "clientEmail" character varying(255),
    "clientPhone" character varying(15),
    "professionalId" text NOT NULL,
    "serviceType" character varying(100) NOT NULL,
    "packageName" character varying(50),
    description text,
    requirements text,
    price integer NOT NULL,
    "platformFee" integer DEFAULT 0 NOT NULL,
    "netAmount" integer DEFAULT 0 NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    "deliveredAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    status marketplace."JobStatus" DEFAULT 'PENDING'::marketplace."JobStatus" NOT NULL,
    "cancellationReason" text,
    deliverables jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Job" OWNER TO ankr;

--
-- Name: JobMessage; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."JobMessage" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderType" marketplace."MessageSenderType" NOT NULL,
    "senderName" character varying(255) NOT NULL,
    message text NOT NULL,
    attachments text[] DEFAULT ARRAY[]::text[],
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE marketplace."JobMessage" OWNER TO ankr;

--
-- Name: Milestone; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Milestone" (
    id text NOT NULL,
    "escrowId" text NOT NULL,
    "jobId" text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "sequenceOrder" integer DEFAULT 1 NOT NULL,
    amount integer NOT NULL,
    percentage numeric(5,2) NOT NULL,
    status marketplace."MilestoneStatus" DEFAULT 'PENDING'::marketplace."MilestoneStatus" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "releasedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Milestone" OWNER TO ankr;

--
-- Name: Professional; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Professional" (
    id text NOT NULL,
    "userId" text,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(15),
    photo text,
    type marketplace."ProfessionalType" NOT NULL,
    "registrationNumber" character varying(50),
    specializations text[] DEFAULT ARRAY[]::text[],
    bio text,
    "addressLine1" character varying(255),
    city character varying(100),
    state character varying(100),
    pincode character varying(6),
    languages text[] DEFAULT ARRAY['English'::text, 'Hindi'::text],
    "experienceYears" integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "verificationStatus" marketplace."VerificationStatus" DEFAULT 'PENDING'::marketplace."VerificationStatus" NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verificationDocs" text[] DEFAULT ARRAY[]::text[],
    rating numeric(3,2) DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "completedJobs" integer DEFAULT 0 NOT NULL,
    "responseTimeHours" integer DEFAULT 24 NOT NULL,
    availability marketplace."AvailabilityStatus" DEFAULT 'AVAILABLE'::marketplace."AvailabilityStatus" NOT NULL,
    "bankAccountNumber" character varying(20),
    "bankIfsc" character varying(11),
    "bankAccountHolder" character varying(100),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Professional" OWNER TO ankr;

--
-- Name: RazorpayOrder; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."RazorpayOrder" (
    id text NOT NULL,
    "razorpayOrderId" character varying(100) NOT NULL,
    amount integer NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying NOT NULL,
    receipt character varying(100) NOT NULL,
    "jobId" text,
    "escrowId" text,
    status marketplace."RazorpayOrderStatus" DEFAULT 'CREATED'::marketplace."RazorpayOrderStatus" NOT NULL,
    "paymentId" character varying(100),
    signature text,
    "paidAt" timestamp(3) without time zone,
    "errorCode" character varying(50),
    "errorDescription" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."RazorpayOrder" OWNER TO ankr;

--
-- Name: Review; Type: TABLE; Schema: marketplace; Owner: ankr
--

CREATE TABLE marketplace."Review" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "professionalId" text NOT NULL,
    "reviewerId" text NOT NULL,
    "reviewerName" character varying(255) NOT NULL,
    rating integer NOT NULL,
    title character varying(255),
    content text,
    response text,
    "respondedAt" timestamp(3) without time zone,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketplace."Review" OWNER TO ankr;

--
-- Data for Name: hypertable; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.hypertable (id, schema_name, table_name, associated_schema_name, associated_table_prefix, num_dimensions, chunk_sizing_func_schema, chunk_sizing_func_name, chunk_target_size, compression_state, compressed_hypertable_id, status) FROM stdin;
\.


--
-- Data for Name: chunk; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.chunk (id, hypertable_id, schema_name, table_name, compressed_chunk_id, dropped, status, osm_chunk, creation_time) FROM stdin;
\.


--
-- Data for Name: chunk_column_stats; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.chunk_column_stats (id, hypertable_id, chunk_id, column_name, range_start, range_end, valid) FROM stdin;
\.


--
-- Data for Name: dimension; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.dimension (id, hypertable_id, column_name, column_type, aligned, num_slices, partitioning_func_schema, partitioning_func, interval_length, compress_interval_length, integer_now_func_schema, integer_now_func) FROM stdin;
\.


--
-- Data for Name: dimension_slice; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.dimension_slice (id, dimension_id, range_start, range_end) FROM stdin;
\.


--
-- Data for Name: chunk_constraint; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.chunk_constraint (chunk_id, dimension_slice_id, constraint_name, hypertable_constraint_name) FROM stdin;
\.


--
-- Data for Name: compression_chunk_size; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.compression_chunk_size (chunk_id, compressed_chunk_id, uncompressed_heap_size, uncompressed_toast_size, uncompressed_index_size, compressed_heap_size, compressed_toast_size, compressed_index_size, numrows_pre_compression, numrows_post_compression, numrows_frozen_immediately) FROM stdin;
\.


--
-- Data for Name: compression_settings; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.compression_settings (relid, compress_relid, segmentby, orderby, orderby_desc, orderby_nullsfirst, index) FROM stdin;
\.


--
-- Data for Name: continuous_agg; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_agg (mat_hypertable_id, raw_hypertable_id, parent_mat_hypertable_id, user_view_schema, user_view_name, partial_view_schema, partial_view_name, direct_view_schema, direct_view_name, materialized_only, finalized) FROM stdin;
\.


--
-- Data for Name: continuous_agg_migrate_plan; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_agg_migrate_plan (mat_hypertable_id, start_ts, end_ts, user_view_definition) FROM stdin;
\.


--
-- Data for Name: continuous_agg_migrate_plan_step; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_agg_migrate_plan_step (mat_hypertable_id, step_id, status, start_ts, end_ts, type, config) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_bucket_function; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_bucket_function (mat_hypertable_id, bucket_func, bucket_width, bucket_origin, bucket_offset, bucket_timezone, bucket_fixed_width) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_hypertable_invalidation_log; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_hypertable_invalidation_log (hypertable_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_invalidation_threshold; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_invalidation_threshold (hypertable_id, watermark) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_materialization_invalidation_log; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_materialization_invalidation_log (materialization_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_materialization_ranges; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_materialization_ranges (materialization_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_watermark; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.continuous_aggs_watermark (mat_hypertable_id, watermark) FROM stdin;
\.


--
-- Data for Name: metadata; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.metadata (key, value, include_in_telemetry) FROM stdin;
install_timestamp	2025-12-22 07:16:12.963121+00	t
timescaledb_version	2.24.0	f
exported_uuid	05e04899-f5b7-4d35-9b6e-dbd65a3545b5	t
\.


--
-- Data for Name: tablespace; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ankr
--

COPY _timescaledb_catalog.tablespace (id, hypertable_id, tablespace_name) FROM stdin;
\.


--
-- Data for Name: bgw_job; Type: TABLE DATA; Schema: _timescaledb_config; Owner: ankr
--

COPY _timescaledb_config.bgw_job (id, application_name, schedule_interval, max_runtime, max_retries, retry_period, proc_schema, proc_name, owner, scheduled, fixed_schedule, initial_start, hypertable_id, config, check_schema, check_name, timezone) FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."Company" (id, "legalName", "tradeName", "entityType", "dateOfIncorporation", cin, llpin, pan, tan, "primaryNicCode", "secondaryNicCodes", "industrySector", "businessActivity", "authorizedCapital", "paidUpCapital", "financialYearEnd", "totalEmployees", "permanentEmployees", "contractEmployees", "isMsme", "msmeCategory", "udyamRegistration", email, phone, website, status, "onboardingCompleted", "createdAt", "updatedAt", "createdBy") FROM stdin;
comp_001	Acme Technologies Pvt Ltd	Acme Tech	PRIVATE_LIMITED	\N	U72200DL2020PTC123456	\N	AABCA1234F	DELA12345E	\N	{}	\N	\N	\N	\N	03-31	50	0	0	t	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-22 09:17:38.514	2025-12-22 09:17:38.514	system
comp_002	Rocket Industries LLP	Rocket LLP	LLP	\N	AAA-1234	\N	AABFR5678G	\N	\N	{}	\N	\N	\N	\N	03-31	25	0	0	t	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-22 09:17:38.514	2025-12-22 09:17:38.514	system
comp_003	StarTech Solutions Pvt Ltd	StarTech	PRIVATE_LIMITED	\N	U74999MH2019PTC345678	\N	AABCS9012H	MUMS98765D	\N	{}	\N	\N	\N	\N	03-31	120	0	0	f	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-22 09:17:38.514	2025-12-22 09:17:38.514	system
comp_004	Digital Dreams OPC	\N	OPC	\N	U62099KA2021OPC456789	\N	AABCD3456J	\N	\N	{}	\N	\N	\N	\N	03-31	5	0	0	t	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-22 09:17:38.514	2025-12-22 09:17:38.514	system
cmjmeqrzt0000b23egb4cs2xt	WOWTRUCK TECHNOLOGIES PRIVATE LIMITED	\N	PRIVATE_LIMITED	\N	\N	\N	AAECE0871E	\N	\N	{}	\N	\N	\N	\N	03-31	0	0	0	f	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-26 05:04:54.329	2025-12-26 05:04:54.329	gstin_lookup
cmjmetecm0002grlupq54tikm	POWERP BOX IT SOLUTIONS PRIVATE LIMITED	POWERP BOX IT SOLUTIONS PVT LTD	PRIVATE_LIMITED	\N	\N	\N	AALCP1391B	\N	\N	{}	\N	\N	\N	\N	03-31	0	0	0	f	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-26 05:06:56.614	2025-12-26 05:06:56.614	gstin_lookup
cmjn5dvih0000yfma9obs0cbi	Demo Industries Private Limited	Demo Industries	PRIVATE_LIMITED	2020-01-15 00:00:00	U12345HR2020PTC123456	\N	AABCD1234E	DELA12345E	\N	{}	\N	\N	\N	\N	03-31	150	120	30	f	\N	\N	\N	\N	\N	ACTIVE	f	2025-12-26 17:30:41.994	2025-12-26 17:30:41.994	system-seed
\.


--
-- Data for Name: CompanyAddress; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."CompanyAddress" (id, "companyId", "addressType", "addressLine1", "addressLine2", landmark, city, district, "stateCode", pincode, "isPrimary", "contactPerson", "contactPhone", "contactEmail", "createdAt", "updatedAt") FROM stdin;
addr_001	comp_001	REGISTERED	123 Tech Park, Sector 62	\N	\N	Noida	\N	UP	201301	t	\N	\N	\N	2025-12-22 09:22:19.352	2025-12-22 09:22:19.352
addr_002	comp_002	REGISTERED	456 Industrial Area	\N	\N	Gurugram	\N	HR	122001	t	\N	\N	\N	2025-12-22 09:22:19.352	2025-12-22 09:22:19.352
addr_003	comp_003	REGISTERED	789 BKC Complex	\N	\N	Mumbai	\N	MH	400051	t	\N	\N	\N	2025-12-22 09:22:19.352	2025-12-22 09:22:19.352
addr_004	comp_004	REGISTERED	101 Startup Hub	\N	\N	Bangalore	\N	KA	560001	t	\N	\N	\N	2025-12-22 09:22:19.352	2025-12-22 09:22:19.352
\.


--
-- Data for Name: CompanyPersonnel; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."CompanyPersonnel" (id, "companyId", "personType", designation, din, dpin, pan, salutation, "firstName", "middleName", "lastName", "fatherName", "dateOfBirth", gender, nationality, email, mobile, "residentialAddress", city, "stateCode", pincode, "dateOfAppointment", "dateOfCessation", "cessationReason", "directorCategory", "isIndependentDirector", "kmpDesignation", "hasDsc", "dscClass", "dscExpiryDate", "dscProvider", "isAuthorizedSignatory", "authorizedFor", "shareholdingPercent", "numberOfShares", status, "createdAt", "updatedAt") FROM stdin;
per_001	comp_001	DIRECTOR	Managing Director	12345678	\N	\N	\N	Rajesh	\N	Kumar	\N	\N	\N	Indian	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	f	{}	\N	\N	ACTIVE	2025-12-22 09:21:33.271	2025-12-22 09:21:33.271
per_002	comp_001	DIRECTOR	Director	23456789	\N	\N	\N	Priya	\N	Sharma	\N	\N	\N	Indian	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	f	{}	\N	\N	ACTIVE	2025-12-22 09:21:33.271	2025-12-22 09:21:33.271
per_003	comp_002	DESIGNATED_PARTNER	Designated Partner	34567890	\N	\N	\N	Amit	\N	Singh	\N	\N	\N	Indian	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	f	{}	\N	\N	ACTIVE	2025-12-22 09:21:33.271	2025-12-22 09:21:33.271
per_004	comp_003	DIRECTOR	CEO & Director	45678901	\N	\N	\N	Sunita	\N	Patel	\N	\N	\N	Indian	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	f	{}	\N	\N	ACTIVE	2025-12-22 09:21:33.271	2025-12-22 09:21:33.271
\.


--
-- Data for Name: CompanyStateEmployees; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."CompanyStateEmployees" (id, "companyId", "stateCode", "employeeCount", "permanentCount", "contractCount", "asOfDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: CompanyTurnover; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."CompanyTurnover" (id, "companyId", "financialYear", "turnoverAmount", "isAudited", "isEstimated", "auditDate", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ComplianceCalendar; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."ComplianceCalendar" (id, "companyId", "ruleId", "filingPeriod", "periodStartDate", "periodEndDate", "originalDueDate", "extendedDueDate", "actualDueDate", status, "completedAt", "completedBy", "acknowledgementNumber", "filingDate", remarks, "assignedTo", "assignedProfessionalId", "createdAt", "updatedAt", "acknowledgementDate", "proofDocumentUrl", "lateFee", "interestAmount", "taxPaid", "penaltyAmount", priority, "reminderSent", escalated, "filingRecordId") FROM stdin;
cal_004	comp_001	GST_GSTR3B_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-20 00:00:00	\N	2026-01-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_010	comp_001	ESI_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-15 00:00:00	\N	2026-01-15 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_014	comp_002	GST_GSTR1_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-11 00:00:00	\N	2025-12-11 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_016	comp_002	GST_GSTR1_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-11 00:00:00	\N	2026-01-11 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_017	comp_002	GST_GSTR3B_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-20 00:00:00	\N	2026-01-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_022	comp_002	IT_ADVANCE_TAX_Q3	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_025	comp_003	GST_GSTR1_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-11 00:00:00	\N	2025-12-11 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_026	comp_003	GST_GSTR3B_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-20 00:00:00	\N	2025-12-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_027	comp_003	GST_GSTR1_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-11 00:00:00	\N	2026-01-11 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_028	comp_003	GST_GSTR3B_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-20 00:00:00	\N	2026-01-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_033	comp_003	ESI_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_034	comp_003	ESI_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-15 00:00:00	\N	2026-01-15 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_035	comp_003	IT_ADVANCE_TAX_Q3	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_036	comp_003	GST_GSTR9_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_039	comp_004	GST_GSTR1_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-11 00:00:00	\N	2025-12-11 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_041	comp_004	GST_GSTR1_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-11 00:00:00	\N	2026-01-11 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_042	comp_004	GST_GSTR3B_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-20 00:00:00	\N	2026-01-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_044	comp_004	IT_ADVANCE_TAX_Q3	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_045	comp_004	GST_GSTR9_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_049	comp_004	GST_GSTR1_MONTHLY	2026-01	2026-01-01 00:00:00	2026-01-31 00:00:00	2026-02-11 00:00:00	\N	2026-02-11 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_050	comp_004	GST_GSTR3B_MONTHLY	2026-01	2026-01-01 00:00:00	2026-01-31 00:00:00	2026-02-20 00:00:00	\N	2026-02-20 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_038	comp_003	MCA_MGT7_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-11-29 00:00:00	\N	2025-11-29 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_047	comp_004	MCA_MGT7_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-11-29 00:00:00	\N	2025-11-29 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_005	comp_001	TDS_24Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_018	comp_002	TDS_24Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_029	comp_003	TDS_24Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_006	comp_001	TDS_26Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_019	comp_002	TDS_26Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_030	comp_003	TDS_26Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_043	comp_004	TDS_26Q_QUARTERLY	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2026-01-31 00:00:00	\N	2026-01-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_013	comp_001	MCA_DIR3KYC_ANNUAL	2025-26	2025-04-01 00:00:00	2026-03-31 00:00:00	2025-09-30 00:00:00	\N	2025-09-30 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_024	comp_002	MCA_DIR3KYC_ANNUAL	2025-26	2025-04-01 00:00:00	2026-03-31 00:00:00	2025-09-30 00:00:00	\N	2025-09-30 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_048	comp_004	MCA_DIR3KYC_ANNUAL	2025-26	2025-04-01 00:00:00	2026-03-31 00:00:00	2025-09-30 00:00:00	\N	2025-09-30 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_008	comp_001	EPF_ECR_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-15 00:00:00	\N	2026-01-15 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_020	comp_002	EPF_ECR_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_021	comp_002	EPF_ECR_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-15 00:00:00	\N	2026-01-15 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_031	comp_003	EPF_ECR_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_037	comp_003	MCA_AOC4_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-10-30 00:00:00	\N	2025-10-30 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_046	comp_004	MCA_AOC4_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-10-30 00:00:00	\N	2025-10-30 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_040	comp_004	GST_GSTR3B_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-20 00:00:00	\N	2025-12-20 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-23 04:07:25.773	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_007	comp_001	EPF_ECR_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-24 10:33:02.499	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_a67f5c9261
cal_015	comp_002	GST_GSTR3B_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-20 00:00:00	\N	2025-12-20 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-24 10:34:48.701	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_8ddddd175c
cal_001	comp_001	GST_GSTR1_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-11 00:00:00	\N	2025-12-11 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-24 14:02:26.253	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_8bc4efdb4a
cal_002	comp_001	GST_GSTR3B_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-20 00:00:00	\N	2025-12-20 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-24 14:58:21.645	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_e1806de3d8
cal_011	comp_001	IT_ADVANCE_TAX_Q3	2025-Q3	2025-10-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-26 17:55:49.916	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_c4561baa33
cal_009	comp_001	ESI_MONTHLY	2025-11	2025-11-01 00:00:00	2025-11-30 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-26 17:59:27.257	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_1d8ab9971e
cal_023	comp_002	GST_GSTR9_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-26 19:06:04.12	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_6ec2953033
cal_003	comp_001	GST_GSTR1_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-11 00:00:00	\N	2026-01-11 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-26 19:08:10.295	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_8deb39108f
cal_012	comp_001	GST_GSTR9_ANNUAL	2024-25	2024-04-01 00:00:00	2025-03-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-26 19:13:05.285	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_51a791d671
cal_032	comp_003	EPF_ECR_MONTHLY	2025-12	2025-12-01 00:00:00	2025-12-31 00:00:00	2026-01-15 00:00:00	\N	2026-01-15 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-22 10:04:03.932	2025-12-22 10:04:03.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvj00004yfmaephgimfp	cmjn5dvih0000yfma9obs0cbi	gst-1	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-11 00:00:00	\N	2025-12-11 00:00:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.012	2025-12-26 17:30:42.012	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvj5000ayfmabn1cgosj	cmjn5dvih0000yfma9obs0cbi	esi-return	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.018	2025-12-26 17:30:42.018	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvjd000kyfmadfapbmlp	cmjn5dvih0000yfma9obs0cbi	lwf-contrib	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.025	2025-12-26 17:30:42.025	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvje000myfmaigdhw3o9	cmjn5dvih0000yfma9obs0cbi	itr-6	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.026	2025-12-26 17:30:42.026	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvjf000oyfmacetecibx	cmjn5dvih0000yfma9obs0cbi	tcs-27eq	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.028	2025-12-26 17:30:42.028	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvj7000cyfmaxjaplnkp	cmjn5dvih0000yfma9obs0cbi	mca-aoc4	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-30 00:00:00	\N	2025-12-30 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.019	2025-12-26 17:58:14.943	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_735c5bcce0
cmjn5dvja000gyfmaqiww959b	cmjn5dvih0000yfma9obs0cbi	fema-fcgpr	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-28 00:00:00	\N	2025-12-28 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.022	2025-12-26 18:49:02.177	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_77cc81219a
cmjn5dvix0002yfmar47af5n7	cmjn5dvih0000yfma9obs0cbi	gst-3b	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-20 00:00:00	\N	2025-12-20 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.009	2025-12-26 18:49:11.52	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_7895956e50
cmjn5dvj9000eyfma1y5hr0eg	cmjn5dvih0000yfma9obs0cbi	pt-return	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.021	2025-12-26 18:56:42.04	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_7ae101ae5d
cmjn5dvjb000iyfmaxkt330fc	cmjn5dvih0000yfma9obs0cbi	ehs-pcb	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.024	2025-12-26 19:01:50.58	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_71c7fbeba3
cmjn5dvj20006yfmaeym7bu01	cmjn5dvih0000yfma9obs0cbi	tds-24q	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-31 00:00:00	\N	2025-12-31 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.014	2025-12-26 19:06:39.994	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_58fb7e22d7
cal_apprentice-return_comp_001_1766822984850	comp_001	apprentice-return	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.852	2025-12-27 08:09:44.852	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_bocw-cess_comp_001_1766822984854	comp_001	bocw-cess	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.855	2025-12-27 08:09:44.855	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_bocw-registration_comp_001_1766822984856	comp_001	bocw-registration	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.857	2025-12-27 08:09:44.857	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_bocw-return_comp_001_1766822984858	comp_001	bocw-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.858	2025-12-27 08:09:44.858	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_clra-contractor_comp_001_1766822984859	comp_001	clra-contractor	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.86	2025-12-27 08:09:44.86	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_clra-half-yearly_comp_001_1766822984861	comp_001	clra-half-yearly	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.862	2025-12-27 08:09:44.862	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_clra-principal_comp_001_1766822984863	comp_001	clra-principal	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.864	2025-12-27 08:09:44.864	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_clra-return_comp_001_1766822984864	comp_001	clra-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.865	2025-12-27 08:09:44.865	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_display-abstract_comp_001_1766822984865	comp_001	display-abstract	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.866	2025-12-27 08:09:44.866	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_display-holidays_comp_001_1766822984867	comp_001	display-holidays	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.867	2025-12-27 08:09:44.867	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_display-minimum-wages_comp_001_1766822984868	comp_001	display-minimum-wages	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.868	2025-12-27 08:09:44.868	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_display-wage-period_comp_001_1766822984869	comp_001	display-wage-period	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.87	2025-12-27 08:09:44.87	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_display-working-hours_comp_001_1766822984870	comp_001	display-working-hours	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.871	2025-12-27 08:09:44.871	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pwd-reservation_comp_001_1766822984871	comp_001	pwd-reservation	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.872	2025-12-27 08:09:44.872	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_sc-st-report_comp_001_1766822984873	comp_001	sc-st-report	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.873	2025-12-27 08:09:44.873	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_e-waste_comp_001_1766822984874	comp_001	e-waste	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.874	2025-12-27 08:09:44.874	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hazardous-waste_comp_001_1766822984875	comp_001	hazardous-waste	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.876	2025-12-27 08:09:44.876	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_plastic-waste_comp_001_1766822984876	comp_001	plastic-waste	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.877	2025-12-27 08:09:44.877	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pollution-consent_comp_001_1766822984877	comp_001	pollution-consent	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.878	2025-12-27 08:09:44.878	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pollution-renewal_comp_001_1766822984878	comp_001	pollution-renewal	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.879	2025-12-27 08:09:44.879	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-advance_comp_001_1766822984883	comp_001	epf-advance	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.884	2025-12-27 08:09:44.884	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-annual-return_comp_001_1766822984884	comp_001	epf-annual-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.885	2025-12-27 08:09:44.885	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-ecr_comp_001_1766822984886	comp_001	epf-ecr	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.886	2025-12-27 08:09:44.886	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-edli_comp_001_1766822984887	comp_001	epf-edli	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.888	2025-12-27 08:09:44.888	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-kyc_comp_001_1766822984888	comp_001	epf-kyc	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.889	2025-12-27 08:09:44.889	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cmjn5dvj40008yfmatvdgqp8v	cmjn5dvih0000yfma9obs0cbi	epf-ecr	Dec-2025	2025-12-01 00:00:00	2025-12-31 00:00:00	2025-12-15 00:00:00	\N	2025-12-15 00:00:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:30:42.016	2025-12-27 08:30:49.447	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_ead5ac0a4d
cal_epf-nomination_comp_001_1766822984889	comp_001	epf-nomination	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.89	2025-12-27 08:09:44.89	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-pension-claim_comp_001_1766822984891	comp_001	epf-pension-claim	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.892	2025-12-27 08:09:44.892	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-registration_comp_001_1766822984892	comp_001	epf-registration	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.893	2025-12-27 08:09:44.893	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-transfer_comp_001_1766822984894	comp_001	epf-transfer	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.894	2025-12-27 08:09:44.894	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_epf-withdrawal_comp_001_1766822984895	comp_001	epf-withdrawal	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.896	2025-12-27 08:09:44.896	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-accident_comp_001_1766822984896	comp_001	esi-accident	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.897	2025-12-27 08:09:44.897	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-benefit-claim_comp_001_1766822984898	comp_001	esi-benefit-claim	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.898	2025-12-27 08:09:44.898	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-employee-reg_comp_001_1766822984899	comp_001	esi-employee-reg	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.9	2025-12-27 08:09:44.9	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-family-declaration_comp_001_1766822984900	comp_001	esi-family-declaration	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.901	2025-12-27 08:09:44.901	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-half-yearly_comp_001_1766822984901	comp_001	esi-half-yearly	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.902	2025-12-27 08:09:44.902	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-registration_comp_001_1766822984903	comp_001	esi-registration	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.903	2025-12-27 08:09:44.903	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_esi-return_comp_001_1766822984905	comp_001	esi-return	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.905	2025-12-27 08:09:44.905	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_factory-annual-return_comp_001_1766822984906	comp_001	factory-annual-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.907	2025-12-27 08:09:44.907	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_factory-half-yearly_comp_001_1766822984907	comp_001	factory-half-yearly	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.908	2025-12-27 08:09:44.908	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_factory-license_comp_001_1766822984908	comp_001	factory-license	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.909	2025-12-27 08:09:44.909	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_factory-renewal_comp_001_1766822984910	comp_001	factory-renewal	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.91	2025-12-27 08:09:44.91	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gratuity-claim_comp_001_1766822984911	comp_001	gratuity-claim	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.912	2025-12-27 08:09:44.912	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gratuity-insurance_comp_001_1766822984912	comp_001	gratuity-insurance	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.913	2025-12-27 08:09:44.913	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gratuity-nomination_comp_001_1766822984914	comp_001	gratuity-nomination	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.914	2025-12-27 08:09:44.914	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gratuity-registration_comp_001_1766822984915	comp_001	gratuity-registration	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.916	2025-12-27 08:09:44.916	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gratuity-return_comp_001_1766822984916	comp_001	gratuity-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.917	2025-12-27 08:09:44.917	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr1_comp_001_1766822984918	comp_001	gstr1	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.918	2025-12-27 08:09:44.918	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr1-qrmp_comp_001_1766822984919	comp_001	gstr1-qrmp	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.92	2025-12-27 08:09:44.92	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr10_comp_001_1766822984920	comp_001	gstr10	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.921	2025-12-27 08:09:44.921	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr11_comp_001_1766822984921	comp_001	gstr11	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.922	2025-12-27 08:09:44.922	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr2a_comp_001_1766822984922	comp_001	gstr2a	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.923	2025-12-27 08:09:44.923	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr2b_comp_001_1766822984923	comp_001	gstr2b	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.924	2025-12-27 08:09:44.924	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr3b_comp_001_1766822984925	comp_001	gstr3b	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.925	2025-12-27 08:09:44.925	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr3b-qrmp_comp_001_1766822984926	comp_001	gstr3b-qrmp	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.927	2025-12-27 08:09:44.927	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr4_comp_001_1766822984927	comp_001	gstr4	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.928	2025-12-27 08:09:44.928	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr5_comp_001_1766822984929	comp_001	gstr5	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.929	2025-12-27 08:09:44.929	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr6_comp_001_1766822984930	comp_001	gstr6	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.931	2025-12-27 08:09:44.931	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr7_comp_001_1766822984931	comp_001	gstr7	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.932	2025-12-27 08:09:44.932	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr8_comp_001_1766822984932	comp_001	gstr8	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.933	2025-12-27 08:09:44.933	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr9_comp_001_1766822984933	comp_001	gstr9	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.934	2025-12-27 08:09:44.934	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_gstr9c_comp_001_1766822984935	comp_001	gstr9c	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.936	2025-12-27 08:09:44.936	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_iff_comp_001_1766822984936	comp_001	iff	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.937	2025-12-27 08:09:44.937	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pmt06_comp_001_1766822984938	comp_001	pmt06	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.939	2025-12-27 08:09:44.939	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-accident-register_comp_001_1766822984940	comp_001	hr-accident-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.94	2025-12-27 08:09:44.94	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-advance-register_comp_001_1766822984941	comp_001	hr-advance-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.942	2025-12-27 08:09:44.942	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-employment-card_comp_001_1766822984942	comp_001	hr-employment-card	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.943	2025-12-27 08:09:44.943	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-fine-register_comp_001_1766822984943	comp_001	hr-fine-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.944	2025-12-27 08:09:44.944	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-leave-register_comp_001_1766822984945	comp_001	hr-leave-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.945	2025-12-27 08:09:44.945	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-muster-roll_comp_001_1766822984946	comp_001	hr-muster-roll	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.946	2025-12-27 08:09:44.946	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-overtime-register_comp_001_1766822984947	comp_001	hr-overtime-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.948	2025-12-27 08:09:44.948	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_hr-wage-register_comp_001_1766822984948	comp_001	hr-wage-register	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.949	2025-12-27 08:09:44.949	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_advance-tax_comp_001_1766822984949	comp_001	advance-tax	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.95	2025-12-27 08:09:44.95	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr1_comp_001_1766822984951	comp_001	itr1	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.951	2025-12-27 08:09:44.951	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr2_comp_001_1766822984952	comp_001	itr2	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.952	2025-12-27 08:09:44.952	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr3_comp_001_1766822984953	comp_001	itr3	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.953	2025-12-27 08:09:44.953	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr4_comp_001_1766822984954	comp_001	itr4	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.955	2025-12-27 08:09:44.955	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr5_comp_001_1766822984955	comp_001	itr5	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.956	2025-12-27 08:09:44.956	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr6_comp_001_1766822984956	comp_001	itr6	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.957	2025-12-27 08:09:44.957	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_itr7_comp_001_1766822984957	comp_001	itr7	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.958	2025-12-27 08:09:44.958	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tax-audit_comp_001_1766822984959	comp_001	tax-audit	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.959	2025-12-27 08:09:44.959	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_closure-notice_comp_001_1766822984960	comp_001	closure-notice	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.961	2025-12-27 08:09:44.961	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_layoff-notice_comp_001_1766822984961	comp_001	layoff-notice	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.962	2025-12-27 08:09:44.962	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_retrenchment-notice_comp_001_1766822984962	comp_001	retrenchment-notice	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.963	2025-12-27 08:09:44.963	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_strike-lockout-notice_comp_001_1766822984963	comp_001	strike-lockout-notice	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.964	2025-12-27 08:09:44.964	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_bonus-return_comp_001_1766822984966	comp_001	bonus-return	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.967	2025-12-27 08:09:44.967	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_equal-remuneration_comp_001_1766822984968	comp_001	equal-remuneration	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.968	2025-12-27 08:09:44.968	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_maternity-benefit_comp_001_1766822984969	comp_001	maternity-benefit	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.97	2025-12-27 08:09:44.97	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_minimum-wages_comp_001_1766822984970	comp_001	minimum-wages	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.971	2025-12-27 08:09:44.971	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_payment-wages_comp_001_1766822984971	comp_001	payment-wages	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.972	2025-12-27 08:09:44.972	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_property-tax_comp_001_1766822984972	comp_001	property-tax	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.973	2025-12-27 08:09:44.973	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_signage-license_comp_001_1766822984974	comp_001	signage-license	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.974	2025-12-27 08:09:44.974	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_trade-license_comp_001_1766822984975	comp_001	trade-license	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.976	2025-12-27 08:09:44.976	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_trade-renewal_comp_001_1766822984976	comp_001	trade-renewal	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.977	2025-12-27 08:09:44.977	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_lwf-dl_comp_001_1766822984978	comp_001	lwf-dl	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.978	2025-12-27 08:09:44.978	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_lwf-gj_comp_001_1766822984979	comp_001	lwf-gj	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.979	2025-12-27 08:09:44.979	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_lwf-ka_comp_001_1766822984980	comp_001	lwf-ka	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.981	2025-12-27 08:09:44.981	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_lwf-mh_comp_001_1766822984981	comp_001	lwf-mh	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.982	2025-12-27 08:09:44.982	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_lwf-tn_comp_001_1766822984982	comp_001	lwf-tn	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.983	2025-12-27 08:09:44.983	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_adt1_comp_001_1766822984984	comp_001	adt1	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.984	2025-12-27 08:09:44.984	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_aoc4_comp_001_1766822984985	comp_001	aoc4	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.986	2025-12-27 08:09:44.986	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_aoc4-xbrl_comp_001_1766822984986	comp_001	aoc4-xbrl	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.987	2025-12-27 08:09:44.987	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_dir12_comp_001_1766822984987	comp_001	dir12	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.988	2025-12-27 08:09:44.988	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_dir3-kyc_comp_001_1766822984989	comp_001	dir3-kyc	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.989	2025-12-27 08:09:44.989	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_dpt3_comp_001_1766822984990	comp_001	dpt3	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.991	2025-12-27 08:09:44.991	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_inc20a_comp_001_1766822984991	comp_001	inc20a	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.992	2025-12-27 08:09:44.992	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_inc22_comp_001_1766822984992	comp_001	inc22	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.993	2025-12-27 08:09:44.993	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_llp11_comp_001_1766822984994	comp_001	llp11	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.995	2025-12-27 08:09:44.995	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_llp8_comp_001_1766822984995	comp_001	llp8	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.996	2025-12-27 08:09:44.996	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_mgt14_comp_001_1766822984996	comp_001	mgt14	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.997	2025-12-27 08:09:44.997	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_mgt7_comp_001_1766822984997	comp_001	mgt7	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.998	2025-12-27 08:09:44.998	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_mgt7a_comp_001_1766822984999	comp_001	mgt7a	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:44.999	2025-12-27 08:09:44.999	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_msme1_comp_001_1766822985000	comp_001	msme1	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.001	2025-12-27 08:09:45.001	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_posh-awareness_comp_001_1766822985001	comp_001	posh-awareness	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.002	2025-12-27 08:09:45.002	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_posh-ic-formation_comp_001_1766822985002	comp_001	posh-ic-formation	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.003	2025-12-27 08:09:45.003	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_posh-policy_comp_001_1766822985003	comp_001	posh-policy	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.004	2025-12-27 08:09:45.004	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_posh-quarterly-report_comp_001_1766822985005	comp_001	posh-quarterly-report	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.006	2025-12-27 08:09:45.006	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_sexual-harassment_comp_001_1766822985006	comp_001	sexual-harassment	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.007	2025-12-27 08:09:45.007	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-ap_comp_001_1766822985007	comp_001	pt-ap	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.008	2025-12-27 08:09:45.008	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-gj_comp_001_1766822985008	comp_001	pt-gj	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.009	2025-12-27 08:09:45.009	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-mh_comp_001_1766822985011	comp_001	pt-mh	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.012	2025-12-27 08:09:45.012	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-mp_comp_001_1766822985012	comp_001	pt-mp	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.013	2025-12-27 08:09:45.013	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-tn_comp_001_1766822985014	comp_001	pt-tn	H2-2025	2025-06-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.014	2025-12-27 08:09:45.014	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-ts_comp_001_1766822985015	comp_001	pt-ts	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.015	2025-12-27 08:09:45.015	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-wb_comp_001_1766822985016	comp_001	pt-wb	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.017	2025-12-27 08:09:45.017	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_fire-noc_comp_001_1766822985017	comp_001	fire-noc	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.018	2025-12-27 08:09:45.018	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_fire-renewal_comp_001_1766822985019	comp_001	fire-renewal	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.019	2025-12-27 08:09:45.019	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_safety-audit_comp_001_1766822985020	comp_001	safety-audit	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.02	2025-12-27 08:09:45.02	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_safety-committee_comp_001_1766822985021	comp_001	safety-committee	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.022	2025-12-27 08:09:45.022	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_se-dl_comp_001_1766822985022	comp_001	se-dl	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.023	2025-12-27 08:09:45.023	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_se-ka_comp_001_1766822985023	comp_001	se-ka	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.024	2025-12-27 08:09:45.024	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_se-mh_comp_001_1766822985024	comp_001	se-mh	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.025	2025-12-27 08:09:45.025	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_se-renewal_comp_001_1766822985026	comp_001	se-renewal	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.026	2025-12-27 08:09:45.026	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_standing-orders_comp_001_1766822985027	comp_001	standing-orders	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.028	2025-12-27 08:09:45.028	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_standing-orders-amendment_comp_001_1766822985028	comp_001	standing-orders-amendment	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.029	2025-12-27 08:09:45.029	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_standing-orders-display_comp_001_1766822985029	comp_001	standing-orders-display	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.03	2025-12-27 08:09:45.03	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_form16_comp_001_1766822985030	comp_001	form16	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.031	2025-12-27 08:09:45.031	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_form16a_comp_001_1766822985032	comp_001	form16a	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.032	2025-12-27 08:09:45.032	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_form16b_comp_001_1766822985033	comp_001	form16b	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.033	2025-12-27 08:09:45.033	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_form26as_comp_001_1766822985034	comp_001	form26as	FY-2025-2026	2025-03-31 18:30:00	2026-03-30 18:30:00	2025-12-27 18:30:00	\N	2025-12-27 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.035	2025-12-27 08:09:45.035	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tds-challan_comp_001_1766822985035	comp_001	tds-challan	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.036	2025-12-27 08:09:45.036	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tds24q_comp_001_1766822985036	comp_001	tds24q	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.037	2025-12-27 08:09:45.037	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tds26q_comp_001_1766822985037	comp_001	tds26q	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	OVERDUE	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.038	2025-12-27 08:09:45.038	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tds27eq_comp_001_1766822985039	comp_001	tds27eq	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	PENDING	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.04	2025-12-27 08:09:45.04	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_tds27q_comp_001_1766822985040	comp_001	tds27q	Q4-2025	2025-09-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.041	2025-12-27 08:09:45.041	\N	\N	\N	\N	\N	\N	NORMAL	f	f	\N
cal_pt-ka_comp_001_1766822985010	comp_001	pt-ka	2025-12	2025-11-30 18:30:00	2025-12-30 18:30:00	2025-12-14 18:30:00	\N	2025-12-14 18:30:00	IN_PROGRESS	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:09:45.01	2025-12-27 08:30:03.524	\N	\N	\N	\N	\N	\N	NORMAL	f	f	fil_4ad0cf154b
\.


--
-- Data for Name: ComplianceRule; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."ComplianceRule" (id, name, category, "subCategory", jurisdiction, "stateCode", description, "filingType", frequency, portal, "formNumber", "createdAt", "updatedAt", "notificationRef", "circularRef", "officialPdfUrl", "sourceUrl", "lastAmendedDate", "verifiedByCount", "lastVerifiedAt", "lastVerifiedBy", "amendmentHistory", "penaltyDetails", "dueDay", "dueDayType", "gracePeriodDays") FROM stdin;
gstr2a	GSTR-2A	GST	Inward Supplies	CENTRAL	\N	Auto-populated inward supplies (view only)	VIEW	MONTHLY	https://gst.gov.in	GSTR-2A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr2b	GSTR-2B	GST	ITC Statement	CENTRAL	\N	Auto-generated ITC statement	VIEW	MONTHLY	https://gst.gov.in	GSTR-2B	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr3b-qrmp	GSTR-3B (QRMP)	GST	Summary Return	CENTRAL	\N	Quarterly summary return under QRMP	RETURN	QUARTERLY	https://gst.gov.in	GSTR-3B	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr4	GSTR-4	GST	Composition	CENTRAL	\N	Annual return for composition dealers	RETURN	ANNUAL	https://gst.gov.in	GSTR-4	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr5	GSTR-5	GST	Non-Resident	CENTRAL	\N	Return for non-resident taxable persons	RETURN	MONTHLY	https://gst.gov.in	GSTR-5	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr6	GSTR-6	GST	ISD	CENTRAL	\N	Return for Input Service Distributors	RETURN	MONTHLY	https://gst.gov.in	GSTR-6	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr7	GSTR-7	GST	TDS	CENTRAL	\N	Return for TDS deductors	RETURN	MONTHLY	https://gst.gov.in	GSTR-7	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr8	GSTR-8	GST	E-Commerce	CENTRAL	\N	Return for e-commerce operators	RETURN	MONTHLY	https://gst.gov.in	GSTR-8	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr9c	GSTR-9C	GST	Reconciliation	CENTRAL	\N	Reconciliation statement (audit)	RETURN	ANNUAL	https://gst.gov.in	GSTR-9C	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr10	GSTR-10	GST	Final Return	CENTRAL	\N	Final return on cancellation	RETURN	ONE_TIME	https://gst.gov.in	GSTR-10	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr11	GSTR-11	GST	UIN Holders	CENTRAL	\N	Return for UIN holders	RETURN	MONTHLY	https://gst.gov.in	GSTR-11	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
iff	Invoice Furnishing Facility	GST	QRMP Invoice	CENTRAL	\N	Optional invoice upload for QRMP	RETURN	MONTHLY	https://gst.gov.in	IFF	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pmt06	PMT-06	GST	Challan	CENTRAL	\N	Monthly tax payment challan	PAYMENT	MONTHLY	https://gst.gov.in	PMT-06	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
tds27eq	TCS Return 27EQ	TDS	TCS	CENTRAL	\N	Quarterly TCS return	RETURN	QUARTERLY	https://incometax.gov.in	27EQ	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
form16a	Form 16A	TDS	Certificate	CENTRAL	\N	Quarterly TDS certificate for non-salary	CERTIFICATE	QUARTERLY	https://incometax.gov.in	Form 16A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
form16b	Form 16B	TDS	Property	CENTRAL	\N	TDS certificate for property sale	CERTIFICATE	ONE_TIME	https://incometax.gov.in	Form 16B	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
form26as	Form 26AS	TDS	Tax Credit	CENTRAL	\N	Annual tax credit statement	VIEW	ANNUAL	https://incometax.gov.in	Form 26AS	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr1	ITR-1 (Sahaj)	INCOME_TAX	Individual	CENTRAL	\N	For resident individuals with salary/pension	RETURN	ANNUAL	https://incometax.gov.in	ITR-1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr2	ITR-2	INCOME_TAX	Individual	CENTRAL	\N	Individuals/HUF without business income	RETURN	ANNUAL	https://incometax.gov.in	ITR-2	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr3	ITR-3	INCOME_TAX	Business	CENTRAL	\N	Individuals/HUF with business income	RETURN	ANNUAL	https://incometax.gov.in	ITR-3	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr4	ITR-4 (Sugam)	INCOME_TAX	Presumptive	CENTRAL	\N	Presumptive taxation scheme	RETURN	ANNUAL	https://incometax.gov.in	ITR-4	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr5	ITR-5	INCOME_TAX	Firm/LLP	CENTRAL	\N	For firms, LLPs, AOPs, BOIs	RETURN	ANNUAL	https://incometax.gov.in	ITR-5	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr6	ITR-6	INCOME_TAX	Company	CENTRAL	\N	For companies not claiming exemption	RETURN	ANNUAL	https://incometax.gov.in	ITR-6	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
itr7	ITR-7	INCOME_TAX	Trust/NGO	CENTRAL	\N	For trusts, political parties, institutions	RETURN	ANNUAL	https://incometax.gov.in	ITR-7	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
advance-tax	Advance Tax	INCOME_TAX	Payment	CENTRAL	\N	Quarterly advance tax payment	PAYMENT	QUARTERLY	https://incometax.gov.in	Challan 280	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
tax-audit	Tax Audit Report	INCOME_TAX	Audit	CENTRAL	\N	Tax audit report u/s 44AB	AUDIT	ANNUAL	https://incometax.gov.in	Form 3CD	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
aoc4	AOC-4	MCA	Financial Statements	CENTRAL	\N	Filing of financial statements	FILING	ANNUAL	https://mca.gov.in	AOC-4	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
aoc4-xbrl	AOC-4 XBRL	MCA	Financial Statements	CENTRAL	\N	XBRL filing for specified companies	FILING	ANNUAL	https://mca.gov.in	AOC-4 XBRL	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
mgt7	MGT-7	MCA	Annual Return	CENTRAL	\N	Annual return of company	FILING	ANNUAL	https://mca.gov.in	MGT-7	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
mgt7a	MGT-7A	MCA	Annual Return	CENTRAL	\N	Annual return for small/OPC	FILING	ANNUAL	https://mca.gov.in	MGT-7A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
mgt14	MGT-14	MCA	Resolutions	CENTRAL	\N	Filing of resolutions	FILING	EVENT	https://mca.gov.in	MGT-14	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
adt1	ADT-1	MCA	Auditor	CENTRAL	\N	Appointment of auditor	FILING	ANNUAL	https://mca.gov.in	ADT-1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
dir3-kyc	DIR-3 KYC	MCA	Director KYC	CENTRAL	\N	Annual director KYC	FILING	ANNUAL	https://mca.gov.in	DIR-3 KYC	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
dir12	DIR-12	MCA	Director Change	CENTRAL	\N	Changes in directors	FILING	EVENT	https://mca.gov.in	DIR-12	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
inc20a	INC-20A	MCA	Business Commencement	CENTRAL	\N	Declaration for commencement	FILING	ONE_TIME	https://mca.gov.in	INC-20A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
inc22	INC-22	MCA	Registered Office	CENTRAL	\N	Change of registered office	FILING	EVENT	https://mca.gov.in	INC-22	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
msme1	MSME-1	MCA	MSME Return	CENTRAL	\N	Half-yearly MSME return	RETURN	HALF_YEARLY	https://mca.gov.in	MSME-1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
llp8	LLP Form 8	MCA	LLP Annual	CENTRAL	\N	LLP statement of accounts	FILING	ANNUAL	https://mca.gov.in	Form 8	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr3b	GSTR-3B	GST	Summary Return	CENTRAL	\N	Monthly summary return with tax payment	RETURN	MONTHLY	https://gst.gov.in	GSTR-3B	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	CGST Notification 32/2017	\N	\N	https://gst.gov.in/download/returns	2017-09-15	0	\N	\N	[]	{"maxLateFee": 10000, "interestRate": 18, "lateFeePer Day": 50}	20	DAY_OF_NEXT_MONTH	0
tds24q	TDS Return 24Q	TDS	Salary	CENTRAL	\N	Quarterly TDS return for salary	RETURN	QUARTERLY	https://incometax.gov.in	24Q	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	Income Tax Rule 31A	\N	\N	https://incometaxindia.gov.in/Pages/rules/income-tax-rules.aspx	\N	0	\N	\N	[]	{"maxLateFee": null, "lateFeePer Day": 200}	31	DAY_OF_MONTH_AFTER_QUARTER	0
form16	Form 16	TDS	Certificate	CENTRAL	\N	Annual TDS certificate for salary	CERTIFICATE	ANNUAL	https://incometax.gov.in	Form 16	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	Income Tax Rule 31	\N	\N	https://incometaxindia.gov.in	\N	0	\N	\N	[]	\N	15	DAY_OF_JUNE	0
llp11	LLP Form 11	MCA	LLP Return	CENTRAL	\N	LLP annual return	FILING	ANNUAL	https://mca.gov.in	Form 11	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
dpt3	DPT-3	MCA	Deposits	CENTRAL	\N	Return of deposits	RETURN	ANNUAL	https://mca.gov.in	DPT-3	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-ecr	EPF Monthly Return (ECR)	EPF	Contribution	CENTRAL	\N	Monthly ECR upload and payment	RETURN	MONTHLY	https://unifiedportal.epfindia.gov.in	ECR	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-kyc	EPF KYC Update	EPF	KYC	CENTRAL	\N	Employee KYC details update	FILING	EVENT	https://unifiedportal.epfindia.gov.in	KYC	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-transfer	EPF Transfer Claim	EPF	Transfer	CENTRAL	\N	Transfer of PF accumulations	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 13	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-annual-return	EPF Annual Return	EPF	Annual	CENTRAL	\N	Annual compliance return	RETURN	ANNUAL	https://unifiedportal.epfindia.gov.in	Form 3A/6A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-return	ESI Monthly Return	ESI	Contribution	CENTRAL	\N	Monthly ESI contribution	RETURN	MONTHLY	https://esic.gov.in	ESI Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-half-yearly	ESI Half-Yearly Return	ESI	Compliance	CENTRAL	\N	Half-yearly contribution return	RETURN	HALF_YEARLY	https://esic.gov.in	Form 5	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-accident	ESI Accident Report	ESI	Report	CENTRAL	\N	Accident reporting	FILING	EVENT	https://esic.gov.in	Form 12	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-mh	Professional Tax - Maharashtra	PT	State Tax	STATE	MH	Monthly PT payment Maharashtra	RETURN	MONTHLY	https://mahagst.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-ka	Professional Tax - Karnataka	PT	State Tax	STATE	KA	Monthly PT payment Karnataka	RETURN	MONTHLY	https://pt.kar.nic.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-gj	Professional Tax - Gujarat	PT	State Tax	STATE	GJ	Monthly PT payment Gujarat	RETURN	MONTHLY	https://commercialtax.gujarat.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-wb	Professional Tax - West Bengal	PT	State Tax	STATE	WB	Monthly PT payment West Bengal	RETURN	MONTHLY	https://wbcomtax.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-ap	Professional Tax - Andhra Pradesh	PT	State Tax	STATE	AP	Monthly PT payment AP	RETURN	MONTHLY	https://apct.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-ts	Professional Tax - Telangana	PT	State Tax	STATE	TS	Monthly PT payment Telangana	RETURN	MONTHLY	https://tgct.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-tn	Professional Tax - Tamil Nadu	PT	State Tax	STATE	TN	Half-yearly PT Tamil Nadu	RETURN	HALF_YEARLY	https://tnvat.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pt-mp	Professional Tax - Madhya Pradesh	PT	State Tax	STATE	MP	Monthly PT payment MP	RETURN	MONTHLY	https://mptax.mp.gov.in	PT Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
lwf-mh	Labour Welfare Fund - Maharashtra	LWF	Welfare	STATE	MH	Half-yearly LWF Maharashtra	RETURN	HALF_YEARLY	https://mahakamgar.gov.in	LWF Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
lwf-ka	Labour Welfare Fund - Karnataka	LWF	Welfare	STATE	KA	Annual LWF Karnataka	RETURN	ANNUAL	https://labour.karnataka.gov.in	LWF Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
lwf-gj	Labour Welfare Fund - Gujarat	LWF	Welfare	STATE	GJ	Half-yearly LWF Gujarat	RETURN	HALF_YEARLY	https://labour.gujarat.gov.in	LWF Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
lwf-dl	Labour Welfare Fund - Delhi	LWF	Welfare	STATE	DL	Half-yearly LWF Delhi	RETURN	HALF_YEARLY	https://labour.delhi.gov.in	LWF Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
lwf-tn	Labour Welfare Fund - Tamil Nadu	LWF	Welfare	STATE	TN	Half-yearly LWF Tamil Nadu	RETURN	HALF_YEARLY	https://labour.tn.gov.in	LWF Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
se-mh	Shops & Est Registration - Maharashtra	SHOPS_EST	Registration	STATE	MH	Registration under Shops Act	REGISTRATION	ONE_TIME	https://mahakamgar.gov.in	Form A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
se-dl	Shops & Est Registration - Delhi	SHOPS_EST	Registration	STATE	DL	Registration under Shops Act	REGISTRATION	ONE_TIME	https://labour.delhi.gov.in	Form A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
se-ka	Shops & Est Registration - Karnataka	SHOPS_EST	Registration	STATE	KA	Registration under Shops Act	REGISTRATION	ONE_TIME	https://labour.karnataka.gov.in	Form A	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
se-renewal	Shops & Est Annual Renewal	SHOPS_EST	Renewal	STATE	\N	Annual renewal of registration	RENEWAL	ANNUAL	\N	Renewal Form	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
factory-license	Factory License	FACTORY	License	STATE	\N	Factory license registration	REGISTRATION	ONE_TIME	\N	Form 1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
factory-renewal	Factory License Renewal	FACTORY	Renewal	STATE	\N	Annual factory license renewal	RENEWAL	ANNUAL	\N	Form 2	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
factory-annual-return	Factory Annual Return	FACTORY	Return	STATE	\N	Annual return under Factories Act	RETURN	ANNUAL	\N	Form 21	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
factory-half-yearly	Factory Half-Yearly Return	FACTORY	Return	STATE	\N	Half-yearly accident report	RETURN	HALF_YEARLY	\N	Form 23	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
clra-principal	CLRA Principal Employer Registration	CONTRACT_LABOUR	Registration	STATE	\N	Principal employer registration	REGISTRATION	ONE_TIME	\N	Form I	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
clra-contractor	CLRA Contractor License	CONTRACT_LABOUR	License	STATE	\N	Contractor license	REGISTRATION	ONE_TIME	\N	Form IV	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
clra-return	CLRA Annual Return	CONTRACT_LABOUR	Return	STATE	\N	Annual return under CLRA	RETURN	ANNUAL	\N	Form XXV	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
clra-half-yearly	CLRA Half-Yearly Return	CONTRACT_LABOUR	Return	STATE	\N	Half-yearly contractor return	RETURN	HALF_YEARLY	\N	Form XXIV	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gratuity-return	Gratuity Return	GRATUITY	Return	CENTRAL	\N	Annual return under Gratuity Act	RETURN	ANNUAL	\N	Form L	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
apprentice-return	Apprentice Return	APPRENTICE	Return	CENTRAL	\N	Quarterly apprentice return	RETURN	QUARTERLY	https://apprenticeshipindia.gov.in	Quarterly Return	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
sexual-harassment	IC Annual Report	POSH	Report	CENTRAL	\N	Annual POSH committee report	REPORT	ANNUAL	\N	Annual Report	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
equal-remuneration	Equal Remuneration Return	LABOUR	Return	CENTRAL	\N	Annual return under ER Act	RETURN	ANNUAL	\N	Form D	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
maternity-benefit	Maternity Benefit Return	LABOUR	Return	CENTRAL	\N	Annual return under MB Act	RETURN	ANNUAL	\N	Form L	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
minimum-wages	Minimum Wages Register	LABOUR	Register	STATE	\N	Wage register maintenance	REGISTER	ONGOING	\N	Form X	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
payment-wages	Payment of Wages Register	LABOUR	Register	CENTRAL	\N	Wages register maintenance	REGISTER	ONGOING	\N	Form IV	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
bonus-return	Payment of Bonus Return	LABOUR	Return	CENTRAL	\N	Annual bonus return	RETURN	ANNUAL	\N	Form D	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
posh-ic-formation	IC Committee Formation	POSH	Committee	CENTRAL	\N	Internal Committee constitution (mandatory 10+ employees)	COMPLIANCE	ONE_TIME	\N	IC Formation	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
posh-policy	POSH Policy Display	POSH	Policy	CENTRAL	\N	Display of anti-harassment policy at workplace	COMPLIANCE	ONGOING	\N	Policy Document	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
posh-awareness	POSH Awareness Training	POSH	Training	CENTRAL	\N	Annual awareness training for employees	TRAINING	ANNUAL	\N	Training Record	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
posh-quarterly-report	POSH Quarterly Report	POSH	Report	CENTRAL	\N	Quarterly IC meeting and complaint status	REPORT	QUARTERLY	\N	Quarterly Report	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-registration	EPF Registration	EPF	Registration	CENTRAL	\N	Establishment registration (20+ employees)	REGISTRATION	ONE_TIME	https://unifiedportal.epfindia.gov.in	Form 5A	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-nomination	EPF Nomination (Form 2)	EPF	Nomination	CENTRAL	\N	Employee nomination form	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 2	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-withdrawal	EPF Withdrawal Claim	EPF	Claim	CENTRAL	\N	PF withdrawal processing	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 19	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-pension-claim	EPS Pension Claim	EPF	Pension	CENTRAL	\N	Pension scheme withdrawal	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 10D	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-edli	EDLI Claim	EPF	Insurance	CENTRAL	\N	Employee deposit linked insurance claim	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 5IF	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
epf-advance	EPF Advance	EPF	Advance	CENTRAL	\N	Non-refundable advance from PF	FILING	EVENT	https://unifiedportal.epfindia.gov.in	Form 31	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-registration	ESI Registration	ESI	Registration	CENTRAL	\N	Establishment registration (10+ employees)	REGISTRATION	ONE_TIME	https://esic.gov.in	Form 01	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-employee-reg	ESI Employee Registration	ESI	Employee	CENTRAL	\N	New employee IP registration	FILING	EVENT	https://esic.gov.in	Form 1	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-family-declaration	ESI Family Declaration	ESI	Declaration	CENTRAL	\N	Family members declaration	FILING	EVENT	https://esic.gov.in	Form 1A	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
esi-benefit-claim	ESI Benefit Claim	ESI	Claim	CENTRAL	\N	Sickness/maternity benefit claim	FILING	EVENT	https://esic.gov.in	Form 9	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gratuity-registration	Gratuity Registration	GRATUITY	Registration	CENTRAL	\N	Registration under Payment of Gratuity Act	REGISTRATION	ONE_TIME	\N	Form A	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gratuity-nomination	Gratuity Nomination	GRATUITY	Nomination	CENTRAL	\N	Employee nomination form	FILING	EVENT	\N	Form F	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gratuity-claim	Gratuity Claim	GRATUITY	Claim	CENTRAL	\N	Gratuity payment claim	FILING	EVENT	\N	Form I	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gratuity-insurance	Gratuity Insurance	GRATUITY	Insurance	CENTRAL	\N	Gratuity liability insurance/fund	COMPLIANCE	ANNUAL	\N	Insurance Policy	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-muster-roll	Muster Roll	HR_RECORDS	Attendance	STATE	\N	Daily attendance register	REGISTER	ONGOING	\N	Form IV	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-wage-register	Wage Register	HR_RECORDS	Wages	STATE	\N	Monthly wage register	REGISTER	MONTHLY	\N	Form X	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-overtime-register	Overtime Register	HR_RECORDS	Overtime	STATE	\N	Overtime hours and payment record	REGISTER	ONGOING	\N	Form IV	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-leave-register	Leave Register	HR_RECORDS	Leave	STATE	\N	Leave with wages register	REGISTER	ONGOING	\N	Form 15	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-fine-register	Fine Register	HR_RECORDS	Deductions	STATE	\N	Register of fines and deductions	REGISTER	ONGOING	\N	Form 8	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-advance-register	Advance Register	HR_RECORDS	Advance	STATE	\N	Register of advances	REGISTER	ONGOING	\N	Form 11	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-accident-register	Accident Register	HR_RECORDS	Safety	STATE	\N	Workplace accident register	REGISTER	ONGOING	\N	Accident Register	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hr-employment-card	Employment Card	HR_RECORDS	ID	STATE	\N	Employee identity card	DOCUMENT	ONGOING	\N	ID Card	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
display-abstract	Abstract of Act Display	DISPLAY	Legal	STATE	\N	Display of relevant labor law abstracts	COMPLIANCE	ONGOING	\N	Abstract	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
display-holidays	Holiday List Display	DISPLAY	Calendar	STATE	\N	Annual holiday list display	COMPLIANCE	ANNUAL	\N	Holiday List	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
display-working-hours	Working Hours Notice	DISPLAY	Hours	STATE	\N	Notice of working hours display	COMPLIANCE	ONGOING	\N	Form V	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
display-wage-period	Wage Period Notice	DISPLAY	Wages	STATE	\N	Notice of wage payment dates	COMPLIANCE	ONGOING	\N	Form VI	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
display-minimum-wages	Minimum Wages Display	DISPLAY	Wages	STATE	\N	Display of minimum wages rates	COMPLIANCE	ONGOING	\N	MW Notice	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pwd-reservation	PwD Employment Report	DIVERSITY	Disability	CENTRAL	\N	Report on PwD employment (100+ employees)	REPORT	ANNUAL	\N	PwD Report	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
sc-st-report	SC/ST Employment Report	DIVERSITY	Reservation	CENTRAL	\N	Scheduled caste/tribe employment details	REPORT	ANNUAL	\N	Reservation Report	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
standing-orders	Certified Standing Orders	STANDING_ORDERS	Rules	STATE	\N	Certification of standing orders (100+ employees)	REGISTRATION	ONE_TIME	\N	Standing Orders	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
standing-orders-display	Standing Orders Display	STANDING_ORDERS	Display	STATE	\N	Display of certified standing orders	COMPLIANCE	ONGOING	\N	Display	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
standing-orders-amendment	Standing Orders Amendment	STANDING_ORDERS	Amendment	STATE	\N	Amendment to standing orders	FILING	EVENT	\N	Amendment Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
layoff-notice	Layoff Notice	INDUSTRIAL	Notice	STATE	\N	Notice of intended layoff (100+ employees)	FILING	EVENT	\N	Form O	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
retrenchment-notice	Retrenchment Notice	INDUSTRIAL	Notice	STATE	\N	Notice of intended retrenchment	FILING	EVENT	\N	Form P	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
closure-notice	Closure Notice	INDUSTRIAL	Notice	STATE	\N	Notice of intended closure	FILING	EVENT	\N	Form Q	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
strike-lockout-notice	Strike/Lockout Notice	INDUSTRIAL	Notice	STATE	\N	Notice of strike or lockout	FILING	EVENT	\N	Form L/M	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
bocw-registration	BOCW Registration	BOCW	Registration	STATE	\N	Building workers welfare registration	REGISTRATION	ONE_TIME	\N	Form I	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
bocw-cess	BOCW Cess Payment	BOCW	Cess	STATE	\N	Construction cess (1% of construction cost)	PAYMENT	EVENT	\N	Cess Challan	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
bocw-return	BOCW Annual Return	BOCW	Return	STATE	\N	Annual return under BOCW	RETURN	ANNUAL	\N	Form VI	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
fire-noc	Fire NOC	SAFETY	License	STATE	\N	Fire department NOC	REGISTRATION	ONE_TIME	\N	NOC Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
fire-renewal	Fire NOC Renewal	SAFETY	Renewal	STATE	\N	Annual fire safety renewal	RENEWAL	ANNUAL	\N	Renewal Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
safety-audit	Safety Audit	SAFETY	Audit	STATE	\N	Annual workplace safety audit	AUDIT	ANNUAL	\N	Audit Report	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
safety-committee	Safety Committee Meeting	SAFETY	Committee	STATE	\N	Monthly safety committee meeting (50+ employees)	MEETING	MONTHLY	\N	Minutes	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
trade-license	Trade License	LOCAL	License	LOCAL	\N	Municipal trade license	REGISTRATION	ONE_TIME	\N	Trade License	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
trade-renewal	Trade License Renewal	LOCAL	Renewal	LOCAL	\N	Annual trade license renewal	RENEWAL	ANNUAL	\N	Renewal Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
signage-license	Signage License	LOCAL	License	LOCAL	\N	Advertisement/signage permission	REGISTRATION	ONE_TIME	\N	Signage Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
property-tax	Property Tax	LOCAL	Tax	LOCAL	\N	Annual property tax payment	PAYMENT	ANNUAL	\N	Property Tax	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pollution-consent	Pollution Control Consent	ENVIRONMENT	Consent	STATE	\N	Consent to establish/operate	REGISTRATION	ONE_TIME	\N	CTE/CTO Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
pollution-renewal	Pollution Consent Renewal	ENVIRONMENT	Renewal	STATE	\N	Annual consent renewal	RENEWAL	ANNUAL	\N	Renewal Form	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
hazardous-waste	Hazardous Waste Return	ENVIRONMENT	Waste	STATE	\N	Annual hazardous waste return	RETURN	ANNUAL	\N	Form 4	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
e-waste	E-Waste Return	ENVIRONMENT	Waste	CENTRAL	\N	Annual e-waste return (bulk consumers)	RETURN	ANNUAL	\N	Form 2	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
plastic-waste	Plastic Waste Return	ENVIRONMENT	Waste	STATE	\N	Annual plastic waste return	RETURN	ANNUAL	\N	Form III	2025-12-24 09:27:28.340509	2025-12-24 09:27:28.340509	\N	\N	\N	\N	\N	0	\N	\N	[]	\N	\N	DAY_OF_MONTH	0
gstr1	GSTR-1	GST	Outward Supplies	CENTRAL	\N	Monthly/Quarterly return for outward supplies	RETURN	MONTHLY	https://gst.gov.in	GSTR-1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	CGST Notification 83/2020	\N	\N	https://gst.gov.in/download/returns	2020-11-10	0	\N	\N	[]	{"maxLateFee": 10000, "interestRate": 18, "lateFeePer Day": 50}	11	DAY_OF_NEXT_MONTH	0
gstr1-qrmp	GSTR-1 (QRMP)	GST	Outward Supplies	CENTRAL	\N	Quarterly return under QRMP scheme	RETURN	QUARTERLY	https://gst.gov.in	GSTR-1	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	CGST Notification 84/2020	\N	\N	https://gst.gov.in/download/returns	\N	0	\N	\N	[]	\N	13	DAY_OF_MONTH_AFTER_QUARTER	0
gstr9	GSTR-9	GST	Annual Return	CENTRAL	\N	Annual return for regular taxpayers	RETURN	ANNUAL	https://gst.gov.in	GSTR-9	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	CGST Notification 94/2020	\N	\N	https://gst.gov.in/download/returns	\N	0	\N	\N	[]	{"maxLateFee": 0.5, "lateFeePer Day": 200, "maxLateFeeType": "PERCENT_OF_TURNOVER"}	31	DAY_OF_DECEMBER	0
tds-challan	TDS Challan 281	TDS	Payment	CENTRAL	\N	Monthly TDS payment challan	PAYMENT	MONTHLY	https://incometax.gov.in	Challan 281	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	Income Tax Rule 30	\N	\N	https://incometaxindia.gov.in/Pages/rules/income-tax-rules.aspx	\N	0	\N	\N	[]	{"interestRate": 1.5, "interestType": "PER_MONTH"}	7	DAY_OF_NEXT_MONTH	0
tds26q	TDS Return 26Q	TDS	Non-Salary	CENTRAL	\N	Quarterly TDS return for non-salary	RETURN	QUARTERLY	https://incometax.gov.in	26Q	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	Income Tax Rule 31A	\N	\N	https://incometaxindia.gov.in/Pages/rules/income-tax-rules.aspx	\N	0	\N	\N	[]	{"maxLateFee": null, "lateFeePer Day": 200}	31	DAY_OF_MONTH_AFTER_QUARTER	0
tds27q	TDS Return 27Q	TDS	Non-Resident	CENTRAL	\N	Quarterly TDS for non-resident payments	RETURN	QUARTERLY	https://incometax.gov.in	27Q	2025-12-24 09:25:04.57222	2025-12-24 09:25:04.57222	Income Tax Rule 31A	\N	\N	https://incometaxindia.gov.in/Pages/rules/income-tax-rules.aspx	\N	0	\N	\N	[]	{"maxLateFee": null, "lateFeePer Day": 200}	31	DAY_OF_MONTH_AFTER_QUARTER	0
\.


--
-- Data for Name: EHSCompliance; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."EHSCompliance" (id, "companyId", "facilityId", "complianceType", category, "subCategory", "issuingAuthority", "authorityState", "authorityDistrict", "registrationNo", "applicationNo", "issueDate", "validFrom", "expiryDate", "renewalDueDate", "renewalStatus", "lastRenewalDate", "filingFrequency", "nextFilingDue", "lastFiledDate", conditions, remarks, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EHSProfile; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."EHSProfile" (id, "companyId", "isManufacturing", "isFactory", "hasEnvironmentalImpact", "requiresFireNOC", "factoryLicenseRequired", "pcbConsentRequired", "handlesHazardous", "fireNOCRequired", "factoryLicenseState", "pcbState", "pollutionCategory", "totalFacilities", "manufacturingUnits", warehouses, offices, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EHSTestingRecord; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."EHSTestingRecord" (id, "facilityId", "testType", "testingAgency", "testingAgencyAccreditation", "scheduledDate", "actualDate", "nextDueDate", "reportNumber", "reportDate", "overallResult", parameters, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EpfRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."EpfRegistration" (id, "companyId", "establishmentCode", "establishmentName", "registrationDate", "coveredEmployees", "isExempted", "exemptionCategory", "exemptionDate", "wageLimit", "employerContributionRate", "employeeContributionRate", "adminChargesRate", "isEdliApplicable", username, status, "dscHolderName", "dscExpiryDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EsiRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."EsiRegistration" (id, "companyId", "esiCode", "stateCode", "registrationDate", "coveredEmployees", "wageLimit", "employerContributionRate", "employeeContributionRate", "dispensaryName", "dispensaryAddress", "dispensaryCode", username, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FEMAFiling; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."FEMAFiling" (id, "companyId", "formType", "filingPeriod", "dueDate", "filedDate", status, "acknowledgementNo", "rbiReferenceNo", "adBankName", "adBankCode", "isLate", "daysLate", "lateSubmissionFee", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FEMAProfile; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."FEMAProfile" (id, "companyId", "hasForeignShareholders", "hasNRIShareholders", "hasOverseasSubsidiary", "hasJointVenture", "hasECB", "hasESOPToNonResidents", "hasConvertibleNotes", "entityMasterCreated", "entityMasterDate", "firmsUserId", sector, "nicCode", "fdiRoute", "sectoralFDICap", "totalForeignEquity", "foreignHoldingPercent", "totalODI", "primaryADBankName", "primaryADBankIFSC", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FEMATransaction; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."FEMATransaction" (id, "companyId", "transactionType", "transactionDate", amount, currency, "exchangeRate", "amountInINR", "foreignPartyName", "foreignPartyCountry", "foreignPartyType", "foreignPartyAddress", "foreignPartyPAN", "foreignPartyLEI", "instrumentType", "numberOfInstruments", "faceValue", "issuePrice", premium, "adBankName", "adBankIFSC", "fircNumber", "fircDate", "valuationDate", "valuationMethod", "valuerName", "fairMarketValue", "filingId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Facility; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."Facility" (id, "companyId", name, type, code, "addressLine1", "addressLine2", city, district, state, pincode, latitude, longitude, "builtUpArea", "plotArea", "numberOfFloors", "isHighRise", "isManufacturing", "manufacturingProcess", "productsManufactured", "annualProduction", "hasBoiler", "boilerCapacity", "hasDGSet", "dgSetCapacity", "hasETP", "etpCapacity", "hasSTP", "stpCapacity", "generatesHazWaste", "hazWasteCategories", "generatesEWaste", "generatesBioMedWaste", "hasAirEmissions", "emissionSources", "hasEffluentDischarge", "effluentQuantity", "employeeCount", "contractLabourCount", "womenEmployees", "operatingShifts", "operatingDaysPerWeek", "isActive", "operationalSince", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FactoryRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."FactoryRegistration" (id, "companyId", "stateCode", "registrationNumber", "licenseNumber", "registrationDate", "licenseExpiryDate", "factoryName", "factoryAddress", "natureOfManufacturing", "productsManufactured", "installedPowerHP", "connectedLoadKW", "employeeCount", "maleWorkers", "femaleWorkers", "contractWorkers", "coveredAreaSqFt", "openAreaSqFt", "isHazardous", "hazardousProcesses", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FilingRecord; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."FilingRecord" (id, "calendarItemId", "companyId", "filingType", "filingPeriod", status, "jsonData", "generatedFile", "generatedFilename", "validationResult", "acknowledgementNumber", "acknowledgementDate", "filedAt", "filedBy", "portalResponse", "createdAt", "updatedAt") FROM stdin;
fil_557832391d	cal_001	comp_001	GSTR1	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 10:31:48.031	2025-12-24 10:31:48.031
fil_a67f5c9261	cal_007	comp_001	OTHER	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 10:33:02.497	2025-12-24 10:33:02.497
fil_8ddddd175c	cal_015	comp_002	OTHER	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 10:34:48.699	2025-12-24 10:34:48.699
fil_8bc4efdb4a	cal_001	comp_001	EPF_ECR	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 14:02:26.248	2025-12-24 14:02:26.248
fil_e1806de3d8	cal_002	comp_001	EPF_ECR	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 14:58:21.639	2025-12-24 14:58:21.639
fil_c4561baa33	cal_011	comp_001	OTHER	2025-Q3	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:55:49.912	2025-12-26 17:55:49.912
fil_735c5bcce0	cmjn5dvj7000cyfmaxjaplnkp	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:58:14.94	2025-12-26 17:58:14.94
fil_1d8ab9971e	cal_009	comp_001	OTHER	2025-11	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 17:59:27.252	2025-12-26 17:59:27.252
fil_77cc81219a	cmjn5dvja000gyfmaqiww959b	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:49:02.173	2025-12-26 18:49:02.173
fil_7895956e50	cmjn5dvix0002yfmar47af5n7	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:49:11.519	2025-12-26 18:49:11.519
fil_7ae101ae5d	cmjn5dvj9000eyfma1y5hr0eg	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:56:42.037	2025-12-26 18:56:42.037
fil_71c7fbeba3	cmjn5dvjb000iyfmaxkt330fc	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:01:50.577	2025-12-26 19:01:50.577
fil_6ec2953033	cal_023	comp_002	OTHER	2024-25	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:06:04.118	2025-12-26 19:06:04.118
fil_58fb7e22d7	cmjn5dvj20006yfmaeym7bu01	cmjn5dvih0000yfma9obs0cbi	OTHER	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:06:39.99	2025-12-26 19:06:39.99
fil_8deb39108f	cal_003	comp_001	OTHER	2025-12	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:08:10.292	2025-12-26 19:08:10.292
fil_51a791d671	cal_012	comp_001	OTHER	2024-25	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:13:05.282	2025-12-26 19:13:05.282
fil_4ad0cf154b	cal_pt-ka_comp_001_1766822985010	comp_001	PT	2025-12	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:30:03.521	2025-12-27 08:30:03.521
fil_ead5ac0a4d	cmjn5dvj40008yfmatvdgqp8v	cmjn5dvih0000yfma9obs0cbi	EPF	Dec-2025	DATA_ENTRY	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 08:30:49.445	2025-12-27 08:30:49.445
\.


--
-- Data for Name: GstRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."GstRegistration" (id, "companyId", gstin, "stateCode", "registrationType", "registrationDate", "filingFrequency", "isEinvoiceApplicable", "einvoiceFromDate", "isEwayBillApplicable", "isCompositionScheme", "compositionCategory", username, "isPrimary", status, "legalName", "tradeName", "authorizedSignatoryName", "authorizedSignatoryDesignation", "createdAt", "updatedAt") FROM stdin;
gst_001	comp_001	09AABCA1234F1ZP	UP	REGULAR	\N	MONTHLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	\N	\N	\N	2025-12-22 09:21:33.183	2025-12-22 09:21:33.183
gst_002	comp_002	06AABFR5678G1ZQ	HR	REGULAR	\N	MONTHLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	\N	\N	\N	2025-12-22 09:21:33.183	2025-12-22 09:21:33.183
gst_003	comp_003	27AABCS9012H1ZR	MH	REGULAR	\N	MONTHLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	\N	\N	\N	2025-12-22 09:21:33.183	2025-12-22 09:21:33.183
gst_004	comp_004	29AABCD3456J1ZS	KA	REGULAR	\N	QUARTERLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	\N	\N	\N	2025-12-22 09:21:33.183	2025-12-22 09:21:33.183
cmjmes2np0001grluq1bfkxzr	cmjmeqrzt0000b23egb4cs2xt	27AAECE0871E1ZV	27	REGULAR	\N	MONTHLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	\N	\N	\N	2025-12-26 05:05:54.805	2025-12-26 05:05:54.805
cmjmetecq0004grlurtrermo2	cmjmetecm0002grlupq54tikm	06AALCP1391B1ZM	06	REGULAR	\N	MONTHLY	f	\N	t	f	\N	\N	f	ACTIVE	\N	POWERP BOX IT SOLUTIONS PVT LTD	\N	\N	2025-12-26 05:06:56.619	2025-12-26 05:06:56.619
\.


--
-- Data for Name: LwfRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."LwfRegistration" (id, "companyId", "stateCode", "registrationNumber", "registrationDate", "filingFrequency", "employerContribution", "employeeContribution", username, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PtRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."PtRegistration" (id, "companyId", "stateCode", "ptecNumber", "ptrcNumber", "registrationDate", "filingFrequency", "taxSlabApplicable", "enrolledEmployees", username, status, "wardCircle", "assessmentYear", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RuleUpdateLog; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."RuleUpdateLog" (id, "ruleId", "changedBy", "changeType", "oldValue", "newValue", source, "createdAt") FROM stdin;
e7b36c32-29a0-4b08-9abe-45e4b51fd0c4	gstr1	crawler_gst_notifications	CRAWLER_NOTIFICATION	\N	{"url": "https://gst.gov.in/notification-1766733744270", "date": "2025-12-26", "title": "New GST Notification - December 2025", "affectedRuleIds": [], "notificationNumber": "GST/2025/123"}	https://gst.gov.in/notification-1766733744270	2025-12-26 07:22:24.329
\.


--
-- Data for Name: RuleVerification; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."RuleVerification" (id, "ruleId", "userId", "isAccurate", comments, "suggestedChange", "sourceProvided", "verifiedAt") FROM stdin;
\.


--
-- Data for Name: ShopEstRegistration; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."ShopEstRegistration" (id, "companyId", "stateCode", "registrationNumber", "registrationDate", "expiryDate", "shopName", "shopAddress", "natureOfBusiness", "employeeCount", "maleEmployees", "femaleEmployees", "openingTime", "closingTime", "weeklyOff", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Suggestion; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."Suggestion" (id, type, status, "userId", "userName", "userEmail", "userPhone", "isProfessional", title, description, category, "ruleId", "fieldToCorrect", "currentValue", "suggestedValue", "newRuleName", "newRuleCategory", "newRuleFrequency", "newRuleSource", "sourceUrl", "sourceDocument", upvotes, downvotes, "reviewedBy", "reviewedAt", "reviewNotes", "createdAt", "updatedAt") FROM stdin;
3a89dacb-30f4-4788-b6b3-ff09385caa10	FEATURE_REQUEST	PENDING	\N	Test User	test@example.com	\N	f	Add GDPR Compliance Module	Would love to see GDPR compliance tracking for EU customers	GDPR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	2025-12-26 07:43:11.553	2025-12-26 07:43:11.553
7db223b9-719c-423e-ae3a-972e55751357	NEW_RULE	PENDING	\N	CA Rupinder	\N	\N	t	Add ISO 27001 Audit Checklist	Annual ISO 27001 certification audit requirements	\N	\N	\N	\N	\N	ISO 27001 Annual Audit	ISO27001	ANNUAL	https://www.iso.org/standard/27001	\N	\N	0	0	\N	\N	\N	2025-12-26 07:43:11.61	2025-12-26 07:43:11.61
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."User" (id, phone, email, name, "avatarUrl", "isProfessional", "professionalType", "professionalId", "isPhoneVerified", "isEmailVerified", "isKycVerified", status, "lastLoginAt", "createdAt", "updatedAt", "googleId", "authProvider") FROM stdin;
user_anil	+919876543210	anil@powerpbox.com	Anil Kumar Sharma	\N	f	\N	\N	f	f	f	ACTIVE	\N	2025-12-26 05:44:03.684	2025-12-26 05:44:03.684	\N	EMAIL
user_bani	+919876543211	bani@powerpbox.com	Bani Sharma	\N	f	\N	\N	f	f	f	ACTIVE	\N	2025-12-26 05:44:03.684	2025-12-26 05:44:03.684	\N	EMAIL
user_rupinder	+919876543212	rupinder@caassociates.com	Rupinder Singh	\N	t	\N	\N	f	f	f	ACTIVE	\N	2025-12-26 05:44:03.684	2025-12-26 05:44:03.684	\N	EMAIL
user_google_116102818784247873228		powerpbox@gmail.com	Capt Anil Sharma	https://lh3.googleusercontent.com/a/ACg8ocIqtQftbchs2Q1jlhVKuUAfZooj7xFKCGAkTEmgI5u5Pe4kel0=s96-c	f	\N	\N	f	t	f	ACTIVE	\N	2025-12-26 13:19:47.724	2025-12-26 13:19:47.723	116102818784247873228	GOOGLE
\.


--
-- Data for Name: UserCompanyAccess; Type: TABLE DATA; Schema: compliance; Owner: ankr
--

COPY compliance."UserCompanyAccess" (id, "userId", "companyId", role, "grantedBy", "grantedAt") FROM stdin;
uca_6fa39569-9594-497e-919e-58365766ca8f	user_anil	cmjmetecm0002grlupq54tikm	OWNER	system	2025-12-26 05:44:03.695
uca_39795e6b-d246-4ff7-9c14-b0c9e06991d7	user_bani	cmjmetecm0002grlupq54tikm	DIRECTOR	user_anil	2025-12-26 05:44:03.702
uca_5a79eba8-e44e-4fff-ab6d-ead1bdb6d8c2	user_rupinder	cmjmetecm0002grlupq54tikm	CA	user_anil	2025-12-26 05:44:03.703
uca_5d58e07b-d29c-4d2e-bf37-4a11be2d6da9	user_anil	cmjmeqrzt0000b23egb4cs2xt	OWNER	system	2025-12-26 05:44:03.704
\.


--
-- Data for Name: Dispute; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Dispute" (id, "escrowId", "raisedBy", "raisedByUserId", reason, description, evidence, status, resolution, "resolvedBy", "resolvedAt", "refundAmount", "releaseAmount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Escrow; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Escrow" (id, "jobId", "clientId", "professionalId", amount, "platformFee", "netAmount", status, "paymentMethod", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "fundedAt", "releasedAt", "refundedAt", "createdAt", "updatedAt") FROM stdin;
cmjiu9t0p0005tiam8ibfw16e	cmjiu9t0k0002tiamamqc5qza	demo-client	cmjipmqwk000025oi94mz5d74	199900	29985	169915	FUNDED	Razorpay	order_demo_123	pay_demo_456	\N	2025-12-23 17:08:31.656	\N	\N	2025-12-23 17:08:31.657	2025-12-23 17:08:31.657
\.


--
-- Data for Name: Gig; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Gig" (id, "professionalId", title, category, description, tags, packages, "isActive", views, orders, rating, "createdAt", "updatedAt") FROM stdin;
gig-cmjipmqwk000025oi94mz5d74	cmjipmqwk000025oi94mz5d74	GST Return Filing	GST	Professional GST Return Filing services	{GST}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.397	2025-12-23 14:58:37.397
gig-cmjipmqx4000125oiyw7ifafl	cmjipmqx4000125oiyw7ifafl	GST Return Filing	GST	Professional GST Return Filing services	{GST}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.402	2025-12-23 14:58:37.402
gig-cmjipmqx6000225oi16lyozg9	cmjipmqx6000225oi16lyozg9	ROC Compliance	Company Law	Professional ROC Compliance services	{"Company Law"}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.405	2025-12-23 14:58:37.405
gig-cmjipmqx8000325ointt8quy7	cmjipmqx8000325ointt8quy7	Legal Notice	Legal	Professional Legal Notice services	{Legal}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.407	2025-12-23 14:58:37.407
gig-cmjipmqxa000425oijkqk15hl	cmjipmqxa000425oijkqk15hl	GST Return Filing	GST	Professional GST Return Filing services	{GST}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.41	2025-12-23 14:58:37.41
gig-cmjipmqxc000525oihxh889h4	cmjipmqxc000525oihxh889h4	GST Return Filing	GST	Professional GST Return Filing services	{GST}	"[{\\"name\\":\\"basic\\",\\"price\\":999,\\"deliveryDays\\":3,\\"revisions\\":1,\\"features\\":[\\"Basic service\\"],\\"isActive\\":true},{\\"name\\":\\"standard\\",\\"price\\":1999,\\"deliveryDays\\":2,\\"revisions\\":2,\\"features\\":[\\"Standard service\\"],\\"isActive\\":true},{\\"name\\":\\"premium\\",\\"price\\":3999,\\"deliveryDays\\":1,\\"revisions\\":3,\\"features\\":[\\"Premium service\\"],\\"isActive\\":true}]"	t	500	20	4.50	2025-12-23 14:58:37.412	2025-12-23 14:58:37.412
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Job" (id, "orderNumber", "gigId", "clientId", "clientName", "clientCompany", "clientEmail", "clientPhone", "professionalId", "serviceType", "packageName", description, requirements, price, "platformFee", "netAmount", deadline, "deliveredAt", "completedAt", "cancelledAt", status, "cancellationReason", deliverables, "createdAt", "updatedAt") FROM stdin;
cmjiu9t0k0002tiamamqc5qza	cmjiu9t0k0003tiaml1vcwc1j	\N	demo-client	Demo Company	Demo Enterprises Pvt Ltd	demo@example.com	\N	cmjipmqwk000025oi94mz5d74	GST Filing	standard	Monthly GSTR-3B filing for December 2025	\N	199900	29985	169915	2025-12-28 00:00:00	\N	\N	\N	ACCEPTED	\N	[]	2025-12-23 17:08:31.652	2025-12-23 17:08:31.652
\.


--
-- Data for Name: JobMessage; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."JobMessage" (id, "jobId", "senderId", "senderType", "senderName", message, attachments, "isRead", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Milestone; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Milestone" (id, "escrowId", "jobId", name, description, "sequenceOrder", amount, percentage, status, "dueDate", "completedAt", "releasedAt", "createdAt", "updatedAt") FROM stdin;
cmjiu9t0s0006tiamwz36jram	cmjiu9t0p0005tiam8ibfw16e	cmjiu9t0k0002tiamamqc5qza	Data Collection	\N	1	50000	25.00	COMPLETED	\N	2025-12-23 17:08:31.659	\N	2025-12-23 17:08:31.66	2025-12-23 17:08:31.66
cmjiu9t0s0007tiamrd6ysjkj	cmjiu9t0p0005tiam8ibfw16e	cmjiu9t0k0002tiamamqc5qza	Return Preparation	\N	2	75000	37.50	IN_PROGRESS	\N	\N	\N	2025-12-23 17:08:31.66	2025-12-23 17:08:31.66
cmjiu9t0s0008tiam0dfnj4fq	cmjiu9t0p0005tiam8ibfw16e	cmjiu9t0k0002tiamamqc5qza	Filing & ARN	\N	3	74915	37.50	PENDING	\N	\N	\N	2025-12-23 17:08:31.66	2025-12-23 17:08:31.66
\.


--
-- Data for Name: Professional; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Professional" (id, "userId", name, email, phone, photo, type, "registrationNumber", specializations, bio, "addressLine1", city, state, pincode, languages, "experienceYears", verified, "verificationStatus", "verifiedAt", "verificationDocs", rating, "reviewCount", "completedJobs", "responseTimeHours", availability, "bankAccountNumber", "bankIfsc", "bankAccountHolder", "createdAt", "updatedAt") FROM stdin;
cmjipmqwk000025oi94mz5d74	\N	CA Rajesh Sharma	rajesh@example.com	\N	\N	CA	\N	{GST,"Income Tax"}	\N	\N	Gurugram	Haryana	\N	{English,Hindi}	15	t	VERIFIED	\N	{}	4.90	156	423	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.363	2025-12-23 14:58:37.363
cmjipmqx4000125oiyw7ifafl	\N	CA Priya Mehta	priya@example.com	\N	\N	CA	\N	{"GST Audit"}	\N	\N	Delhi	Delhi	\N	{English,Hindi}	10	t	VERIFIED	\N	{}	4.80	98	267	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.384	2025-12-23 14:58:37.384
cmjipmqx6000225oi16lyozg9	\N	CS Amit Kumar	amit@example.com	\N	\N	CS	\N	{ROC,"Company Law"}	\N	\N	Delhi	Delhi	\N	{English,Hindi}	8	t	VERIFIED	\N	{}	4.70	76	189	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.386	2025-12-23 14:58:37.386
cmjipmqx8000325ointt8quy7	\N	Adv. Neha Gupta	neha@example.com	\N	\N	LAWYER	\N	{"Civil Law","Legal Drafting"}	\N	\N	Chandigarh	Punjab	\N	{English,Hindi}	12	t	VERIFIED	\N	{}	4.90	134	312	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.389	2025-12-23 14:58:37.389
cmjipmqxa000425oijkqk15hl	\N	CA Suresh Iyer	suresh@example.com	\N	\N	CA	\N	{TDS,"Direct Tax"}	\N	\N	Mumbai	Maharashtra	\N	{English,Hindi}	20	t	VERIFIED	\N	{}	4.60	201	567	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.391	2025-12-23 14:58:37.391
cmjipmqxc000525oihxh889h4	\N	CA Deepak Verma	deepak@example.com	\N	\N	CA	\N	{Audit}	\N	\N	Faridabad	Haryana	\N	{English,Hindi}	6	t	VERIFIED	\N	{}	4.50	45	89	24	AVAILABLE	\N	\N	\N	2025-12-23 14:58:37.393	2025-12-23 14:58:37.393
\.


--
-- Data for Name: RazorpayOrder; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."RazorpayOrder" (id, "razorpayOrderId", amount, currency, receipt, "jobId", "escrowId", status, "paymentId", signature, "paidAt", "errorCode", "errorDescription", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: marketplace; Owner: ankr
--

COPY marketplace."Review" (id, "jobId", "professionalId", "reviewerId", "reviewerName", rating, title, content, response, "respondedAt", "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: chunk_column_stats_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_column_stats_id_seq', 1, false);


--
-- Name: chunk_constraint_name; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_constraint_name', 1, false);


--
-- Name: chunk_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_id_seq', 1, false);


--
-- Name: continuous_agg_migrate_plan_step_step_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.continuous_agg_migrate_plan_step_step_id_seq', 1, false);


--
-- Name: dimension_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.dimension_id_seq', 1, false);


--
-- Name: dimension_slice_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.dimension_slice_id_seq', 1, false);


--
-- Name: hypertable_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_catalog.hypertable_id_seq', 1, false);


--
-- Name: bgw_job_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_config; Owner: ankr
--

SELECT pg_catalog.setval('_timescaledb_config.bgw_job_id_seq', 1000, false);


--
-- Name: CompanyAddress CompanyAddress_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyAddress"
    ADD CONSTRAINT "CompanyAddress_pkey" PRIMARY KEY (id);


--
-- Name: CompanyPersonnel CompanyPersonnel_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyPersonnel"
    ADD CONSTRAINT "CompanyPersonnel_pkey" PRIMARY KEY (id);


--
-- Name: CompanyStateEmployees CompanyStateEmployees_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyStateEmployees"
    ADD CONSTRAINT "CompanyStateEmployees_pkey" PRIMARY KEY (id);


--
-- Name: CompanyTurnover CompanyTurnover_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyTurnover"
    ADD CONSTRAINT "CompanyTurnover_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: ComplianceCalendar ComplianceCalendar_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."ComplianceCalendar"
    ADD CONSTRAINT "ComplianceCalendar_pkey" PRIMARY KEY (id);


--
-- Name: ComplianceRule ComplianceRule_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."ComplianceRule"
    ADD CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY (id);


--
-- Name: EHSCompliance EHSCompliance_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSCompliance"
    ADD CONSTRAINT "EHSCompliance_pkey" PRIMARY KEY (id);


--
-- Name: EHSProfile EHSProfile_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSProfile"
    ADD CONSTRAINT "EHSProfile_pkey" PRIMARY KEY (id);


--
-- Name: EHSTestingRecord EHSTestingRecord_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSTestingRecord"
    ADD CONSTRAINT "EHSTestingRecord_pkey" PRIMARY KEY (id);


--
-- Name: EpfRegistration EpfRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EpfRegistration"
    ADD CONSTRAINT "EpfRegistration_pkey" PRIMARY KEY (id);


--
-- Name: EsiRegistration EsiRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EsiRegistration"
    ADD CONSTRAINT "EsiRegistration_pkey" PRIMARY KEY (id);


--
-- Name: FEMAFiling FEMAFiling_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMAFiling"
    ADD CONSTRAINT "FEMAFiling_pkey" PRIMARY KEY (id);


--
-- Name: FEMAProfile FEMAProfile_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMAProfile"
    ADD CONSTRAINT "FEMAProfile_pkey" PRIMARY KEY (id);


--
-- Name: FEMATransaction FEMATransaction_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMATransaction"
    ADD CONSTRAINT "FEMATransaction_pkey" PRIMARY KEY (id);


--
-- Name: Facility Facility_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."Facility"
    ADD CONSTRAINT "Facility_pkey" PRIMARY KEY (id);


--
-- Name: FactoryRegistration FactoryRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FactoryRegistration"
    ADD CONSTRAINT "FactoryRegistration_pkey" PRIMARY KEY (id);


--
-- Name: FilingRecord FilingRecord_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FilingRecord"
    ADD CONSTRAINT "FilingRecord_pkey" PRIMARY KEY (id);


--
-- Name: GstRegistration GstRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."GstRegistration"
    ADD CONSTRAINT "GstRegistration_pkey" PRIMARY KEY (id);


--
-- Name: LwfRegistration LwfRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."LwfRegistration"
    ADD CONSTRAINT "LwfRegistration_pkey" PRIMARY KEY (id);


--
-- Name: PtRegistration PtRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."PtRegistration"
    ADD CONSTRAINT "PtRegistration_pkey" PRIMARY KEY (id);


--
-- Name: RuleUpdateLog RuleUpdateLog_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleUpdateLog"
    ADD CONSTRAINT "RuleUpdateLog_pkey" PRIMARY KEY (id);


--
-- Name: RuleVerification RuleVerification_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleVerification"
    ADD CONSTRAINT "RuleVerification_pkey" PRIMARY KEY (id);


--
-- Name: RuleVerification RuleVerification_ruleId_userId_key; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleVerification"
    ADD CONSTRAINT "RuleVerification_ruleId_userId_key" UNIQUE ("ruleId", "userId");


--
-- Name: ShopEstRegistration ShopEstRegistration_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."ShopEstRegistration"
    ADD CONSTRAINT "ShopEstRegistration_pkey" PRIMARY KEY (id);


--
-- Name: Suggestion Suggestion_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."Suggestion"
    ADD CONSTRAINT "Suggestion_pkey" PRIMARY KEY (id);


--
-- Name: UserCompanyAccess UserCompanyAccess_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."UserCompanyAccess"
    ADD CONSTRAINT "UserCompanyAccess_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Dispute Dispute_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Dispute"
    ADD CONSTRAINT "Dispute_pkey" PRIMARY KEY (id);


--
-- Name: Escrow Escrow_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Escrow"
    ADD CONSTRAINT "Escrow_pkey" PRIMARY KEY (id);


--
-- Name: Gig Gig_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Gig"
    ADD CONSTRAINT "Gig_pkey" PRIMARY KEY (id);


--
-- Name: JobMessage JobMessage_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."JobMessage"
    ADD CONSTRAINT "JobMessage_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: Milestone Milestone_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Milestone"
    ADD CONSTRAINT "Milestone_pkey" PRIMARY KEY (id);


--
-- Name: Professional Professional_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Professional"
    ADD CONSTRAINT "Professional_pkey" PRIMARY KEY (id);


--
-- Name: RazorpayOrder RazorpayOrder_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."RazorpayOrder"
    ADD CONSTRAINT "RazorpayOrder_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: CompanyAddress_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyAddress_companyId_idx" ON compliance."CompanyAddress" USING btree ("companyId");


--
-- Name: CompanyAddress_stateCode_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyAddress_stateCode_idx" ON compliance."CompanyAddress" USING btree ("stateCode");


--
-- Name: CompanyPersonnel_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyPersonnel_companyId_idx" ON compliance."CompanyPersonnel" USING btree ("companyId");


--
-- Name: CompanyPersonnel_din_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyPersonnel_din_idx" ON compliance."CompanyPersonnel" USING btree (din);


--
-- Name: CompanyPersonnel_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyPersonnel_status_idx" ON compliance."CompanyPersonnel" USING btree (status);


--
-- Name: CompanyStateEmployees_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "CompanyStateEmployees_companyId_idx" ON compliance."CompanyStateEmployees" USING btree ("companyId");


--
-- Name: CompanyStateEmployees_companyId_stateCode_asOfDate_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "CompanyStateEmployees_companyId_stateCode_asOfDate_key" ON compliance."CompanyStateEmployees" USING btree ("companyId", "stateCode", "asOfDate");


--
-- Name: CompanyTurnover_companyId_financialYear_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "CompanyTurnover_companyId_financialYear_key" ON compliance."CompanyTurnover" USING btree ("companyId", "financialYear");


--
-- Name: Company_cin_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Company_cin_idx" ON compliance."Company" USING btree (cin);


--
-- Name: Company_cin_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "Company_cin_key" ON compliance."Company" USING btree (cin);


--
-- Name: Company_createdAt_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Company_createdAt_idx" ON compliance."Company" USING btree ("createdAt");


--
-- Name: Company_entityType_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Company_entityType_idx" ON compliance."Company" USING btree ("entityType");


--
-- Name: Company_llpin_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "Company_llpin_key" ON compliance."Company" USING btree (llpin);


--
-- Name: Company_pan_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Company_pan_idx" ON compliance."Company" USING btree (pan);


--
-- Name: Company_pan_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "Company_pan_key" ON compliance."Company" USING btree (pan);


--
-- Name: Company_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Company_status_idx" ON compliance."Company" USING btree (status);


--
-- Name: ComplianceCalendar_actualDueDate_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "ComplianceCalendar_actualDueDate_idx" ON compliance."ComplianceCalendar" USING btree ("actualDueDate");


--
-- Name: ComplianceCalendar_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "ComplianceCalendar_companyId_idx" ON compliance."ComplianceCalendar" USING btree ("companyId");


--
-- Name: ComplianceCalendar_companyId_ruleId_filingPeriod_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "ComplianceCalendar_companyId_ruleId_filingPeriod_key" ON compliance."ComplianceCalendar" USING btree ("companyId", "ruleId", "filingPeriod");


--
-- Name: ComplianceCalendar_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "ComplianceCalendar_status_idx" ON compliance."ComplianceCalendar" USING btree (status);


--
-- Name: EHSCompliance_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSCompliance_companyId_idx" ON compliance."EHSCompliance" USING btree ("companyId");


--
-- Name: EHSCompliance_complianceType_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSCompliance_complianceType_idx" ON compliance."EHSCompliance" USING btree ("complianceType");


--
-- Name: EHSCompliance_expiryDate_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSCompliance_expiryDate_idx" ON compliance."EHSCompliance" USING btree ("expiryDate");


--
-- Name: EHSCompliance_facilityId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSCompliance_facilityId_idx" ON compliance."EHSCompliance" USING btree ("facilityId");


--
-- Name: EHSProfile_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSProfile_companyId_idx" ON compliance."EHSProfile" USING btree ("companyId");


--
-- Name: EHSProfile_companyId_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "EHSProfile_companyId_key" ON compliance."EHSProfile" USING btree ("companyId");


--
-- Name: EHSTestingRecord_facilityId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSTestingRecord_facilityId_idx" ON compliance."EHSTestingRecord" USING btree ("facilityId");


--
-- Name: EHSTestingRecord_scheduledDate_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSTestingRecord_scheduledDate_idx" ON compliance."EHSTestingRecord" USING btree ("scheduledDate");


--
-- Name: EHSTestingRecord_testType_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EHSTestingRecord_testType_idx" ON compliance."EHSTestingRecord" USING btree ("testType");


--
-- Name: EpfRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EpfRegistration_companyId_idx" ON compliance."EpfRegistration" USING btree ("companyId");


--
-- Name: EpfRegistration_establishmentCode_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "EpfRegistration_establishmentCode_key" ON compliance."EpfRegistration" USING btree ("establishmentCode");


--
-- Name: EsiRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EsiRegistration_companyId_idx" ON compliance."EsiRegistration" USING btree ("companyId");


--
-- Name: EsiRegistration_esiCode_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "EsiRegistration_esiCode_key" ON compliance."EsiRegistration" USING btree ("esiCode");


--
-- Name: EsiRegistration_stateCode_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "EsiRegistration_stateCode_idx" ON compliance."EsiRegistration" USING btree ("stateCode");


--
-- Name: FEMAFiling_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMAFiling_companyId_idx" ON compliance."FEMAFiling" USING btree ("companyId");


--
-- Name: FEMAFiling_dueDate_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMAFiling_dueDate_idx" ON compliance."FEMAFiling" USING btree ("dueDate");


--
-- Name: FEMAFiling_formType_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMAFiling_formType_idx" ON compliance."FEMAFiling" USING btree ("formType");


--
-- Name: FEMAProfile_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMAProfile_companyId_idx" ON compliance."FEMAProfile" USING btree ("companyId");


--
-- Name: FEMAProfile_companyId_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "FEMAProfile_companyId_key" ON compliance."FEMAProfile" USING btree ("companyId");


--
-- Name: FEMATransaction_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMATransaction_companyId_idx" ON compliance."FEMATransaction" USING btree ("companyId");


--
-- Name: FEMATransaction_transactionDate_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMATransaction_transactionDate_idx" ON compliance."FEMATransaction" USING btree ("transactionDate");


--
-- Name: FEMATransaction_transactionType_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FEMATransaction_transactionType_idx" ON compliance."FEMATransaction" USING btree ("transactionType");


--
-- Name: Facility_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Facility_companyId_idx" ON compliance."Facility" USING btree ("companyId");


--
-- Name: Facility_state_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Facility_state_idx" ON compliance."Facility" USING btree (state);


--
-- Name: Facility_type_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Facility_type_idx" ON compliance."Facility" USING btree (type);


--
-- Name: FactoryRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FactoryRegistration_companyId_idx" ON compliance."FactoryRegistration" USING btree ("companyId");


--
-- Name: FactoryRegistration_companyId_stateCode_registrationNumber_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "FactoryRegistration_companyId_stateCode_registrationNumber_key" ON compliance."FactoryRegistration" USING btree ("companyId", "stateCode", "registrationNumber");


--
-- Name: FilingRecord_calendarItemId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FilingRecord_calendarItemId_idx" ON compliance."FilingRecord" USING btree ("calendarItemId");


--
-- Name: FilingRecord_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FilingRecord_companyId_idx" ON compliance."FilingRecord" USING btree ("companyId");


--
-- Name: FilingRecord_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "FilingRecord_status_idx" ON compliance."FilingRecord" USING btree (status);


--
-- Name: GstRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "GstRegistration_companyId_idx" ON compliance."GstRegistration" USING btree ("companyId");


--
-- Name: GstRegistration_gstin_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "GstRegistration_gstin_key" ON compliance."GstRegistration" USING btree (gstin);


--
-- Name: GstRegistration_stateCode_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "GstRegistration_stateCode_idx" ON compliance."GstRegistration" USING btree ("stateCode");


--
-- Name: GstRegistration_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "GstRegistration_status_idx" ON compliance."GstRegistration" USING btree (status);


--
-- Name: LwfRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "LwfRegistration_companyId_idx" ON compliance."LwfRegistration" USING btree ("companyId");


--
-- Name: LwfRegistration_companyId_stateCode_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "LwfRegistration_companyId_stateCode_key" ON compliance."LwfRegistration" USING btree ("companyId", "stateCode");


--
-- Name: PtRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "PtRegistration_companyId_idx" ON compliance."PtRegistration" USING btree ("companyId");


--
-- Name: PtRegistration_companyId_stateCode_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "PtRegistration_companyId_stateCode_key" ON compliance."PtRegistration" USING btree ("companyId", "stateCode");


--
-- Name: RuleVerification_ruleId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "RuleVerification_ruleId_idx" ON compliance."RuleVerification" USING btree ("ruleId");


--
-- Name: RuleVerification_userId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "RuleVerification_userId_idx" ON compliance."RuleVerification" USING btree ("userId");


--
-- Name: ShopEstRegistration_companyId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "ShopEstRegistration_companyId_idx" ON compliance."ShopEstRegistration" USING btree ("companyId");


--
-- Name: ShopEstRegistration_companyId_stateCode_registrationNumber_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "ShopEstRegistration_companyId_stateCode_registrationNumber_key" ON compliance."ShopEstRegistration" USING btree ("companyId", "stateCode", "registrationNumber");


--
-- Name: Suggestion_category_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Suggestion_category_idx" ON compliance."Suggestion" USING btree (category);


--
-- Name: Suggestion_status_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Suggestion_status_idx" ON compliance."Suggestion" USING btree (status);


--
-- Name: Suggestion_type_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "Suggestion_type_idx" ON compliance."Suggestion" USING btree (type);


--
-- Name: UserCompanyAccess_userId_companyId_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "UserCompanyAccess_userId_companyId_key" ON compliance."UserCompanyAccess" USING btree ("userId", "companyId");


--
-- Name: UserCompanyAccess_userId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "UserCompanyAccess_userId_idx" ON compliance."UserCompanyAccess" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "User_email_idx" ON compliance."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "User_email_key" ON compliance."User" USING btree (email);


--
-- Name: User_googleId_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "User_googleId_idx" ON compliance."User" USING btree ("googleId");


--
-- Name: User_phone_idx; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE INDEX "User_phone_idx" ON compliance."User" USING btree (phone);


--
-- Name: User_phone_key; Type: INDEX; Schema: compliance; Owner: ankr
--

CREATE UNIQUE INDEX "User_phone_key" ON compliance."User" USING btree (phone);


--
-- Name: Dispute_escrowId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Dispute_escrowId_idx" ON marketplace."Dispute" USING btree ("escrowId");


--
-- Name: Dispute_status_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Dispute_status_idx" ON marketplace."Dispute" USING btree (status);


--
-- Name: Escrow_clientId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Escrow_clientId_idx" ON marketplace."Escrow" USING btree ("clientId");


--
-- Name: Escrow_jobId_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "Escrow_jobId_key" ON marketplace."Escrow" USING btree ("jobId");


--
-- Name: Escrow_professionalId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Escrow_professionalId_idx" ON marketplace."Escrow" USING btree ("professionalId");


--
-- Name: Escrow_status_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Escrow_status_idx" ON marketplace."Escrow" USING btree (status);


--
-- Name: Gig_category_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Gig_category_idx" ON marketplace."Gig" USING btree (category);


--
-- Name: Gig_isActive_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Gig_isActive_idx" ON marketplace."Gig" USING btree ("isActive");


--
-- Name: Gig_professionalId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Gig_professionalId_idx" ON marketplace."Gig" USING btree ("professionalId");


--
-- Name: JobMessage_jobId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "JobMessage_jobId_idx" ON marketplace."JobMessage" USING btree ("jobId");


--
-- Name: JobMessage_senderId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "JobMessage_senderId_idx" ON marketplace."JobMessage" USING btree ("senderId");


--
-- Name: Job_clientId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Job_clientId_idx" ON marketplace."Job" USING btree ("clientId");


--
-- Name: Job_createdAt_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Job_createdAt_idx" ON marketplace."Job" USING btree ("createdAt");


--
-- Name: Job_orderNumber_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "Job_orderNumber_key" ON marketplace."Job" USING btree ("orderNumber");


--
-- Name: Job_professionalId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Job_professionalId_idx" ON marketplace."Job" USING btree ("professionalId");


--
-- Name: Job_status_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Job_status_idx" ON marketplace."Job" USING btree (status);


--
-- Name: Milestone_escrowId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Milestone_escrowId_idx" ON marketplace."Milestone" USING btree ("escrowId");


--
-- Name: Milestone_jobId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Milestone_jobId_idx" ON marketplace."Milestone" USING btree ("jobId");


--
-- Name: Professional_city_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Professional_city_idx" ON marketplace."Professional" USING btree (city);


--
-- Name: Professional_email_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "Professional_email_key" ON marketplace."Professional" USING btree (email);


--
-- Name: Professional_rating_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Professional_rating_idx" ON marketplace."Professional" USING btree (rating);


--
-- Name: Professional_type_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Professional_type_idx" ON marketplace."Professional" USING btree (type);


--
-- Name: Professional_userId_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "Professional_userId_key" ON marketplace."Professional" USING btree ("userId");


--
-- Name: Professional_verified_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Professional_verified_idx" ON marketplace."Professional" USING btree (verified);


--
-- Name: RazorpayOrder_jobId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "RazorpayOrder_jobId_idx" ON marketplace."RazorpayOrder" USING btree ("jobId");


--
-- Name: RazorpayOrder_razorpayOrderId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "RazorpayOrder_razorpayOrderId_idx" ON marketplace."RazorpayOrder" USING btree ("razorpayOrderId");


--
-- Name: RazorpayOrder_razorpayOrderId_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "RazorpayOrder_razorpayOrderId_key" ON marketplace."RazorpayOrder" USING btree ("razorpayOrderId");


--
-- Name: Review_jobId_reviewerId_key; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE UNIQUE INDEX "Review_jobId_reviewerId_key" ON marketplace."Review" USING btree ("jobId", "reviewerId");


--
-- Name: Review_professionalId_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Review_professionalId_idx" ON marketplace."Review" USING btree ("professionalId");


--
-- Name: Review_rating_idx; Type: INDEX; Schema: marketplace; Owner: ankr
--

CREATE INDEX "Review_rating_idx" ON marketplace."Review" USING btree (rating);


--
-- Name: CompanyAddress CompanyAddress_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyAddress"
    ADD CONSTRAINT "CompanyAddress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CompanyPersonnel CompanyPersonnel_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyPersonnel"
    ADD CONSTRAINT "CompanyPersonnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CompanyStateEmployees CompanyStateEmployees_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyStateEmployees"
    ADD CONSTRAINT "CompanyStateEmployees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CompanyTurnover CompanyTurnover_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."CompanyTurnover"
    ADD CONSTRAINT "CompanyTurnover_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplianceCalendar ComplianceCalendar_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."ComplianceCalendar"
    ADD CONSTRAINT "ComplianceCalendar_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EHSCompliance EHSCompliance_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSCompliance"
    ADD CONSTRAINT "EHSCompliance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EHSCompliance EHSCompliance_facilityId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSCompliance"
    ADD CONSTRAINT "EHSCompliance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES compliance."Facility"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EHSProfile EHSProfile_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSProfile"
    ADD CONSTRAINT "EHSProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EHSTestingRecord EHSTestingRecord_facilityId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EHSTestingRecord"
    ADD CONSTRAINT "EHSTestingRecord_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES compliance."Facility"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpfRegistration EpfRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EpfRegistration"
    ADD CONSTRAINT "EpfRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EsiRegistration EsiRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."EsiRegistration"
    ADD CONSTRAINT "EsiRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FEMAFiling FEMAFiling_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMAFiling"
    ADD CONSTRAINT "FEMAFiling_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FEMAProfile FEMAProfile_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMAProfile"
    ADD CONSTRAINT "FEMAProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FEMATransaction FEMATransaction_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMATransaction"
    ADD CONSTRAINT "FEMATransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FEMATransaction FEMATransaction_filingId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FEMATransaction"
    ADD CONSTRAINT "FEMATransaction_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES compliance."FEMAFiling"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Facility Facility_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."Facility"
    ADD CONSTRAINT "Facility_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FactoryRegistration FactoryRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FactoryRegistration"
    ADD CONSTRAINT "FactoryRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FilingRecord FilingRecord_calendarItemId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FilingRecord"
    ADD CONSTRAINT "FilingRecord_calendarItemId_fkey" FOREIGN KEY ("calendarItemId") REFERENCES compliance."ComplianceCalendar"(id);


--
-- Name: FilingRecord FilingRecord_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."FilingRecord"
    ADD CONSTRAINT "FilingRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id);


--
-- Name: GstRegistration GstRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."GstRegistration"
    ADD CONSTRAINT "GstRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LwfRegistration LwfRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."LwfRegistration"
    ADD CONSTRAINT "LwfRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PtRegistration PtRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."PtRegistration"
    ADD CONSTRAINT "PtRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RuleUpdateLog RuleUpdateLog_ruleId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleUpdateLog"
    ADD CONSTRAINT "RuleUpdateLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES compliance."ComplianceRule"(id);


--
-- Name: RuleVerification RuleVerification_ruleId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleVerification"
    ADD CONSTRAINT "RuleVerification_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES compliance."ComplianceRule"(id);


--
-- Name: RuleVerification RuleVerification_userId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."RuleVerification"
    ADD CONSTRAINT "RuleVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES compliance."User"(id);


--
-- Name: ShopEstRegistration ShopEstRegistration_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."ShopEstRegistration"
    ADD CONSTRAINT "ShopEstRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Suggestion Suggestion_userId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."Suggestion"
    ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES compliance."User"(id);


--
-- Name: UserCompanyAccess UserCompanyAccess_companyId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."UserCompanyAccess"
    ADD CONSTRAINT "UserCompanyAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES compliance."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserCompanyAccess UserCompanyAccess_userId_fkey; Type: FK CONSTRAINT; Schema: compliance; Owner: ankr
--

ALTER TABLE ONLY compliance."UserCompanyAccess"
    ADD CONSTRAINT "UserCompanyAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES compliance."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dispute Dispute_escrowId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Dispute"
    ADD CONSTRAINT "Dispute_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES marketplace."Escrow"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Escrow Escrow_jobId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Escrow"
    ADD CONSTRAINT "Escrow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES marketplace."Job"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Escrow Escrow_professionalId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Escrow"
    ADD CONSTRAINT "Escrow_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES marketplace."Professional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Gig Gig_professionalId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Gig"
    ADD CONSTRAINT "Gig_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES marketplace."Professional"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobMessage JobMessage_jobId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."JobMessage"
    ADD CONSTRAINT "JobMessage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES marketplace."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Job Job_gigId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Job"
    ADD CONSTRAINT "Job_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES marketplace."Gig"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Job Job_professionalId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Job"
    ADD CONSTRAINT "Job_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES marketplace."Professional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Milestone Milestone_escrowId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Milestone"
    ADD CONSTRAINT "Milestone_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES marketplace."Escrow"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Milestone Milestone_jobId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Milestone"
    ADD CONSTRAINT "Milestone_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES marketplace."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_jobId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Review"
    ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES marketplace."Job"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_professionalId_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: ankr
--

ALTER TABLE ONLY marketplace."Review"
    ADD CONSTRAINT "Review_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES marketplace."Professional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict XgZhwHs51F8IfbANqe4Qji7IO3JHcYQhbUCQIF2SJ80IihmXNc6MDXV8a5Qk4Uy

