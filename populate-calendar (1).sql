-- =============================================================================
-- Ankr Compliance Platform - Test Data Population Script
-- Jai GuruJi! Shree Ganesh!
-- Generated: December 22, 2025
-- =============================================================================

-- This script populates the ComplianceCalendar table with 50 realistic events
-- for the 4 test companies across GST, TDS, MCA, EPF, ESI categories

-- First, let's add the compliance rules to the database
INSERT INTO compliance."ComplianceRule" (id, name, category, "subCategory", jurisdiction, "filingType", frequency, portal, "formNumber", "applicabilityRules", "dueDateRules", "isActive", "createdAt", "updatedAt")
VALUES
-- GST Rules
('GST_GSTR1_MONTHLY', 'GSTR-1 Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-1', '{}', '{"dayOfMonth": 11}', true, NOW(), NOW()),
('GST_GSTR3B_MONTHLY', 'GSTR-3B Monthly Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://www.gst.gov.in', 'GSTR-3B', '{}', '{"dayOfMonth": 20}', true, NOW(), NOW()),
('GST_GSTR9_ANNUAL', 'GSTR-9 Annual Return', 'GST', 'RETURNS', 'CENTRAL', 'RETURN', 'ANNUAL', 'https://www.gst.gov.in', 'GSTR-9', '{}', '{"month": 12, "dayOfMonth": 31}', true, NOW(), NOW()),
-- TDS Rules
('TDS_24Q', 'TDS Return - Salary (24Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '24Q', '{}', '{"offsetDays": 31}', true, NOW(), NOW()),
('TDS_26Q', 'TDS Return - Non-Salary (26Q)', 'TDS', 'RETURNS', 'CENTRAL', 'RETURN', 'QUARTERLY', 'https://www.incometax.gov.in', '26Q', '{}', '{"offsetDays": 31}', true, NOW(), NOW()),
-- MCA Rules
('MCA_AOC4', 'AOC-4 Annual Filing', 'MCA', 'ANNUAL', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'AOC-4', '{}', '{"month": 10, "dayOfMonth": 30}', true, NOW(), NOW()),
('MCA_MGT7', 'MGT-7 Annual Return', 'MCA', 'ANNUAL', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'MGT-7', '{}', '{"month": 11, "dayOfMonth": 29}', true, NOW(), NOW()),
('MCA_DIR3KYC', 'DIR-3 KYC', 'MCA', 'KYC', 'CENTRAL', 'FORM', 'ANNUAL', 'https://www.mca.gov.in', 'DIR-3 KYC', '{}', '{"month": 9, "dayOfMonth": 30}', true, NOW(), NOW()),
-- EPF Rules
('EPF_ECR', 'EPF ECR Monthly', 'EPF', 'CONTRIBUTION', 'CENTRAL', 'RETURN', 'MONTHLY', 'https://unifiedportal.epfindia.gov.in', 'ECR', '{}', '{"dayOfMonth": 15}', true, NOW(), NOW()),
-- ESI Rules
('ESI_MONTHLY', 'ESI Contribution Monthly', 'ESI', 'CONTRIBUTION', 'CENTRAL', 'PAYMENT', 'MONTHLY', 'https://www.esic.gov.in', 'ESI', '{}', '{"dayOfMonth": 15}', true, NOW(), NOW()),
-- Income Tax Rules
('IT_ADVANCE_TAX_Q3', 'Advance Tax - Q3', 'INCOME_TAX', 'ADVANCE_TAX', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Advance Tax', '{}', '{"month": 12, "dayOfMonth": 15}', true, NOW(), NOW()),
('IT_ADVANCE_TAX_Q4', 'Advance Tax - Q4', 'INCOME_TAX', 'ADVANCE_TAX', 'CENTRAL', 'PAYMENT', 'QUARTERLY', 'https://www.incometax.gov.in', 'Advance Tax', '{}', '{"month": 3, "dayOfMonth": 15}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now populate the ComplianceCalendar with 50 events
-- December 2025 and January 2026 deadlines

INSERT INTO compliance."ComplianceCalendar" (
  id, "companyId", "ruleId", "filingPeriod", 
  "periodStartDate", "periodEndDate", 
  "originalDueDate", "actualDueDate",
  status, "createdAt", "updatedAt"
)
VALUES
-- Company 1: Acme Technologies (comp_001) - 15 events
('cal_001', 'comp_001', 'GST_GSTR1_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-11', '2025-12-11', 'COMPLETED', NOW(), NOW()),
('cal_002', 'comp_001', 'GST_GSTR3B_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-20', '2025-12-20', 'PENDING', NOW(), NOW()),
('cal_003', 'comp_001', 'GST_GSTR1_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-11', '2026-01-11', 'PENDING', NOW(), NOW()),
('cal_004', 'comp_001', 'GST_GSTR3B_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-20', '2026-01-20', 'PENDING', NOW(), NOW()),
('cal_005', 'comp_001', 'TDS_24Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_006', 'comp_001', 'TDS_26Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_007', 'comp_001', 'EPF_ECR', '2025-11', '2025-11-01', '2025-11-30', '2025-12-15', '2025-12-15', 'OVERDUE', NOW(), NOW()),
('cal_008', 'comp_001', 'EPF_ECR', '2025-12', '2025-12-01', '2025-12-31', '2026-01-15', '2026-01-15', 'PENDING', NOW(), NOW()),
('cal_009', 'comp_001', 'ESI_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-15', '2025-12-15', 'OVERDUE', NOW(), NOW()),
('cal_010', 'comp_001', 'ESI_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-15', '2026-01-15', 'PENDING', NOW(), NOW()),
('cal_011', 'comp_001', 'IT_ADVANCE_TAX_Q3', '2025-Q3', '2025-10-01', '2025-12-31', '2025-12-15', '2025-12-15', 'OVERDUE', NOW(), NOW()),
('cal_012', 'comp_001', 'GST_GSTR9_ANNUAL', '2024-25', '2024-04-01', '2025-03-31', '2025-12-31', '2025-12-31', 'PENDING', NOW(), NOW()),
('cal_013', 'comp_001', 'MCA_DIR3KYC', '2025-26', '2025-04-01', '2026-03-31', '2025-09-30', '2025-09-30', 'COMPLETED', NOW(), NOW()),

-- Company 2: Rocket Industries LLP (comp_002) - 12 events
('cal_014', 'comp_002', 'GST_GSTR1_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-11', '2025-12-11', 'COMPLETED', NOW(), NOW()),
('cal_015', 'comp_002', 'GST_GSTR3B_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-20', '2025-12-20', 'PENDING', NOW(), NOW()),
('cal_016', 'comp_002', 'GST_GSTR1_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-11', '2026-01-11', 'PENDING', NOW(), NOW()),
('cal_017', 'comp_002', 'GST_GSTR3B_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-20', '2026-01-20', 'PENDING', NOW(), NOW()),
('cal_018', 'comp_002', 'TDS_24Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_019', 'comp_002', 'TDS_26Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_020', 'comp_002', 'EPF_ECR', '2025-11', '2025-11-01', '2025-11-30', '2025-12-15', '2025-12-15', 'COMPLETED', NOW(), NOW()),
('cal_021', 'comp_002', 'EPF_ECR', '2025-12', '2025-12-01', '2025-12-31', '2026-01-15', '2026-01-15', 'PENDING', NOW(), NOW()),
('cal_022', 'comp_002', 'IT_ADVANCE_TAX_Q3', '2025-Q3', '2025-10-01', '2025-12-31', '2025-12-15', '2025-12-15', 'COMPLETED', NOW(), NOW()),
('cal_023', 'comp_002', 'GST_GSTR9_ANNUAL', '2024-25', '2024-04-01', '2025-03-31', '2025-12-31', '2025-12-31', 'PENDING', NOW(), NOW()),
('cal_024', 'comp_002', 'MCA_DIR3KYC', '2025-26', '2025-04-01', '2026-03-31', '2025-09-30', '2025-09-30', 'COMPLETED', NOW(), NOW()),

-- Company 3: StarTech Solutions (comp_003) - 13 events
('cal_025', 'comp_003', 'GST_GSTR1_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-11', '2025-12-11', 'COMPLETED', NOW(), NOW()),
('cal_026', 'comp_003', 'GST_GSTR3B_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-20', '2025-12-20', 'PENDING', NOW(), NOW()),
('cal_027', 'comp_003', 'GST_GSTR1_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-11', '2026-01-11', 'PENDING', NOW(), NOW()),
('cal_028', 'comp_003', 'GST_GSTR3B_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-20', '2026-01-20', 'PENDING', NOW(), NOW()),
('cal_029', 'comp_003', 'TDS_24Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_030', 'comp_003', 'TDS_26Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_031', 'comp_003', 'EPF_ECR', '2025-11', '2025-11-01', '2025-11-30', '2025-12-15', '2025-12-15', 'COMPLETED', NOW(), NOW()),
('cal_032', 'comp_003', 'EPF_ECR', '2025-12', '2025-12-01', '2025-12-31', '2026-01-15', '2026-01-15', 'PENDING', NOW(), NOW()),
('cal_033', 'comp_003', 'ESI_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-15', '2025-12-15', 'COMPLETED', NOW(), NOW()),
('cal_034', 'comp_003', 'ESI_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-15', '2026-01-15', 'PENDING', NOW(), NOW()),
('cal_035', 'comp_003', 'IT_ADVANCE_TAX_Q3', '2025-Q3', '2025-10-01', '2025-12-31', '2025-12-15', '2025-12-15', 'COMPLETED', NOW(), NOW()),
('cal_036', 'comp_003', 'GST_GSTR9_ANNUAL', '2024-25', '2024-04-01', '2025-03-31', '2025-12-31', '2025-12-31', 'PENDING', NOW(), NOW()),
('cal_037', 'comp_003', 'MCA_AOC4', '2024-25', '2024-04-01', '2025-03-31', '2025-10-30', '2025-10-30', 'COMPLETED', NOW(), NOW()),
('cal_038', 'comp_003', 'MCA_MGT7', '2024-25', '2024-04-01', '2025-03-31', '2025-11-29', '2025-11-29', 'COMPLETED', NOW(), NOW()),

-- Company 4: Digital Dreams OPC (comp_004) - 12 events
('cal_039', 'comp_004', 'GST_GSTR1_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-11', '2025-12-11', 'COMPLETED', NOW(), NOW()),
('cal_040', 'comp_004', 'GST_GSTR3B_MONTHLY', '2025-11', '2025-11-01', '2025-11-30', '2025-12-20', '2025-12-20', 'PENDING', NOW(), NOW()),
('cal_041', 'comp_004', 'GST_GSTR1_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-11', '2026-01-11', 'PENDING', NOW(), NOW()),
('cal_042', 'comp_004', 'GST_GSTR3B_MONTHLY', '2025-12', '2025-12-01', '2025-12-31', '2026-01-20', '2026-01-20', 'PENDING', NOW(), NOW()),
('cal_043', 'comp_004', 'TDS_26Q', '2025-Q3', '2025-10-01', '2025-12-31', '2026-01-31', '2026-01-31', 'PENDING', NOW(), NOW()),
('cal_044', 'comp_004', 'IT_ADVANCE_TAX_Q3', '2025-Q3', '2025-10-01', '2025-12-31', '2025-12-15', '2025-12-15', 'OVERDUE', NOW(), NOW()),
('cal_045', 'comp_004', 'GST_GSTR9_ANNUAL', '2024-25', '2024-04-01', '2025-03-31', '2025-12-31', '2025-12-31', 'PENDING', NOW(), NOW()),
('cal_046', 'comp_004', 'MCA_AOC4', '2024-25', '2024-04-01', '2025-03-31', '2025-10-30', '2025-10-30', 'COMPLETED', NOW(), NOW()),
('cal_047', 'comp_004', 'MCA_MGT7', '2024-25', '2024-04-01', '2025-03-31', '2025-11-29', '2025-11-29', 'COMPLETED', NOW(), NOW()),
('cal_048', 'comp_004', 'MCA_DIR3KYC', '2025-26', '2025-04-01', '2026-03-31', '2025-09-30', '2025-09-30', 'COMPLETED', NOW(), NOW()),
('cal_049', 'comp_004', 'GST_GSTR1_MONTHLY', '2026-01', '2026-01-01', '2026-01-31', '2026-02-11', '2026-02-11', 'PENDING', NOW(), NOW()),
('cal_050', 'comp_004', 'GST_GSTR3B_MONTHLY', '2026-01', '2026-01-01', '2026-01-31', '2026-02-20', '2026-02-20', 'PENDING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify counts
SELECT 'ComplianceRule' as table_name, COUNT(*) as count FROM compliance."ComplianceRule"
UNION ALL
SELECT 'ComplianceCalendar', COUNT(*) FROM compliance."ComplianceCalendar";

-- Show calendar by status
SELECT status, COUNT(*) as count 
FROM compliance."ComplianceCalendar" 
GROUP BY status;

-- Show upcoming deadlines
SELECT 
  cc.id,
  c."legalName" as company,
  cr.name as compliance,
  cr.category,
  cc.status,
  cc."actualDueDate"::date as due_date
FROM compliance."ComplianceCalendar" cc
JOIN compliance."Company" c ON cc."companyId" = c.id
JOIN compliance."ComplianceRule" cr ON cc."ruleId" = cr.id
WHERE cc."actualDueDate" >= '2025-12-20'
ORDER BY cc."actualDueDate"
LIMIT 20;
