-- Quick Upload: GENCON 2022 Sample Charter Party
-- Run this to add sample document for testing

-- Insert sample charter party document (using existing organization)
INSERT INTO documents (
  id,
  title,
  category,
  "fileName",
  "fileSize",
  "mimeType",
  notes,
  status,
  "organizationId",
  "uploadedBy",
  tags,
  "createdAt",
  "updatedAt"
)
SELECT
  'doc-gencon-2022-sample',
  'GENCON 2022 - Sample Voyage Charter Party',
  'charter_party',
  'GENCON-2022-Sample.pdf',
  145523,
  'application/pdf',
  E'GENCON 2022 Charter Party\n\nThis is the standard BIMCO voyage charter party form used worldwide for dry cargo shipments.\n\nKey clauses:\n- Freight payment terms\n- Laytime and demurrage (SHINC basis)\n- Loading and discharge ports\n- Vessel description and specifications  \n- General cargo terms and conditions\n\nSample Vessel Details:\nM/V Ocean Star\nIMO: 1234567\nDWT: 75,000 MT all told\nFlag: Panama\nClass: Lloyd\'s Register\n\nVoyage Details:\nLoad Port: SGSIN (Singapore)\nDischarge Port: USNYC (New York)\nCargo: 50,000 MT general cargo / steel coils\nLaycan: 10-15 March 2026\nLaytime: 72 hours SHINC (Sundays and Holidays Included)\nDemurrage: USD 15,000 per day pro rata\nDespatch: USD 7,500 per day saved\n\nFreight Terms:\nFreight: USD 50.00 per metric ton\nPayment: 95% on signing B/L, 5% on right delivery\nCommission: 2.5% address commission\n\nKey Clauses:\n- Clause 1: Loading/Discharging Ports\n- Clause 2: Cargo Description\n- Clause 4: Dangerous Cargo Exclusion  \n- Clause 6: Laytime WWDSHEX (Weather Working Days Sundays and Holidays Excepted)\n- Clause 8: Demurrage and Despatch\n- Clause 13: Freight Payment\n- Clause 18: General Average\n- Clause 19: Law and Arbitration (English Law, London Arbitration)',
  'active',
  o.id,
  u.id,
  ARRAY['gencon', 'charter_party', 'sample', 'voyage_charter', 'bimco', 'dry_cargo', 'steel_coils'],
  NOW(),
  NOW()
FROM organizations o
CROSS JOIN users u
WHERE o.id = (SELECT id FROM organizations ORDER BY "createdAt" DESC LIMIT 1)
  AND u.id = (SELECT id FROM users WHERE role = 'admin' ORDER BY "createdAt" DESC LIMIT 1)
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  "updatedAt" = NOW();

-- Show the inserted document
SELECT
  id,
  title,
  category,
  "fileSize",
  array_length(tags, 1) as tag_count,
  "createdAt"
FROM documents
WHERE id = 'doc-gencon-2022-sample';
