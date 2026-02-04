-- Port Agency Portal Database Schema
-- Priority 1: Strategic Feature
-- Created: February 2, 2026
-- Purpose: PDA/FDA automation, service requests, multi-currency

-- ============================================================================
-- 1. Agent Appointments
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_appointments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  vessel_id TEXT NOT NULL,
  port_code TEXT NOT NULL,  -- UNLOCODE (SGSIN, INMUN, etc.)
  eta TIMESTAMP NOT NULL,
  etb TIMESTAMP,
  etd TIMESTAMP,
  service_type TEXT NOT NULL,  -- husbandry, cargo, crew_change, bunker
  status TEXT NOT NULL DEFAULT 'nominated',  -- nominated, confirmed, services_requested, completed
  nominated_by TEXT,
  nominated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE,
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_appointments_port_eta ON agent_appointments(port_code, eta);
CREATE INDEX idx_agent_appointments_vessel_status ON agent_appointments(vessel_id, status);

-- ============================================================================
-- 2. PDA (Proforma Disbursement Account)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pdas (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,  -- PDA-SGSIN-2026-001
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, sent, approved, revised, cancelled

  -- Port Details
  port_code TEXT NOT NULL,
  port_name TEXT NOT NULL,
  arrival_date TIMESTAMP NOT NULL,
  departure_date TIMESTAMP,
  stay_duration DOUBLE PRECISION,  -- hours

  -- Vessel Details
  vessel_id TEXT NOT NULL,
  vessel_name TEXT NOT NULL,
  imo TEXT NOT NULL,
  flag TEXT,
  grt DOUBLE PRECISION,
  nrt DOUBLE PRECISION,
  loa DOUBLE PRECISION,
  beam DOUBLE PRECISION,
  draft DOUBLE PRECISION,

  -- Financial
  base_currency TEXT DEFAULT 'USD',
  total_amount DOUBLE PRECISION NOT NULL,
  total_amount_local DOUBLE PRECISION,
  local_currency TEXT,
  fx_rate DOUBLE PRECISION DEFAULT 1.0,

  -- Metadata
  generated_by TEXT,  -- user_id or "AUTO"
  generated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by TEXT,

  -- ML Prediction
  confidence_score DOUBLE PRECISION,  -- 0.0-1.0
  prediction_model TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES agent_appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE
);

CREATE INDEX idx_pdas_port_arrival ON pdas(port_code, arrival_date);
CREATE INDEX idx_pdas_vessel_status ON pdas(vessel_id, status);
CREATE INDEX idx_pdas_reference ON pdas(reference);

-- ============================================================================
-- 3. PDA Line Items
-- ============================================================================
CREATE TABLE IF NOT EXISTS pda_line_items (
  id TEXT PRIMARY KEY,
  pda_id TEXT NOT NULL,

  category TEXT NOT NULL,  -- port_dues, pilotage, towage, mooring, agency_fee, etc.
  description TEXT NOT NULL,
  quantity DOUBLE PRECISION,
  unit TEXT,  -- per_grt, per_hour, lumpsum
  unit_price DOUBLE PRECISION,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Tariff Reference
  tariff_id TEXT,
  tariff_source TEXT,  -- port_authority, vendor_quote, historical, ml_prediction

  -- Vendor Quote
  vendor_id TEXT,
  vendor_quote_id TEXT,
  quote_valid_until TIMESTAMP,

  -- Prediction
  is_predicted BOOLEAN DEFAULT FALSE,
  confidence DOUBLE PRECISION,  -- 0.0-1.0

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_pda FOREIGN KEY (pda_id) REFERENCES pdas(id) ON DELETE CASCADE,
  CONSTRAINT fk_tariff FOREIGN KEY (tariff_id) REFERENCES port_tariffs(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX idx_pda_line_items_pda_category ON pda_line_items(pda_id, category);

-- ============================================================================
-- 4. FDA (Final Disbursement Account)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fdas (
  id TEXT PRIMARY KEY,
  pda_id TEXT NOT NULL UNIQUE,
  appointment_id TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,  -- FDA-SGSIN-2026-001

  -- Financial
  base_currency TEXT DEFAULT 'USD',
  total_amount DOUBLE PRECISION NOT NULL,
  total_amount_local DOUBLE PRECISION,
  local_currency TEXT,
  fx_rate DOUBLE PRECISION DEFAULT 1.0,

  -- Variance Analysis
  pda_total DOUBLE PRECISION NOT NULL,
  variance DOUBLE PRECISION NOT NULL,  -- FDA - PDA
  variance_percent DOUBLE PRECISION NOT NULL,  -- (variance / PDA) * 100

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, submitted, approved, settled
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  settled_at TIMESTAMP,

  -- Payment
  payment_method TEXT,  -- wire_transfer, check, account_credit
  payment_reference TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_pda FOREIGN KEY (pda_id) REFERENCES pdas(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES agent_appointments(id) ON DELETE CASCADE
);

CREATE INDEX idx_fdas_appointment ON fdas(appointment_id);
CREATE INDEX idx_fdas_reference ON fdas(reference);

-- ============================================================================
-- 5. FDA Line Items
-- ============================================================================
CREATE TABLE IF NOT EXISTS fda_line_items (
  id TEXT PRIMARY KEY,
  fda_id TEXT NOT NULL,

  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DOUBLE PRECISION,
  unit TEXT,
  unit_price DOUBLE PRECISION,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Actual Invoice Reference
  invoice_id TEXT,
  invoice_number TEXT,
  invoice_date TIMESTAMP,
  vendor_id TEXT,

  -- Variance from PDA
  pda_line_item_id TEXT,
  pda_amount DOUBLE PRECISION,
  variance DOUBLE PRECISION,  -- Actual - Estimated

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_fda FOREIGN KEY (fda_id) REFERENCES fdas(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE INDEX idx_fda_line_items_fda_category ON fda_line_items(fda_id, category);

-- ============================================================================
-- 6. FDA Variance Analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS fda_variances (
  id TEXT PRIMARY KEY,
  fda_id TEXT NOT NULL,

  category TEXT NOT NULL,
  pda_amount DOUBLE PRECISION NOT NULL,
  fda_amount DOUBLE PRECISION NOT NULL,
  variance DOUBLE PRECISION NOT NULL,  -- FDA - PDA
  variance_percent DOUBLE PRECISION NOT NULL,  -- (variance / PDA) * 100
  reason TEXT,  -- rate_change, additional_services, currency_fluctuation, etc.
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_fda FOREIGN KEY (fda_id) REFERENCES fdas(id) ON DELETE CASCADE
);

CREATE INDEX idx_fda_variances_fda ON fda_variances(fda_id);

-- ============================================================================
-- 7. Service Requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,

  service_type TEXT NOT NULL,  -- pilotage, towage, mooring, garbage, freshwater, provisions
  description TEXT NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  required_by TIMESTAMP,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, quoted, confirmed, completed, cancelled

  -- Selected Quote
  selected_quote_id TEXT,

  -- Completion
  completed_at TIMESTAMP,
  actual_cost DOUBLE PRECISION,
  currency TEXT,
  rating INTEGER,  -- 1-5 stars
  review TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES agent_appointments(id) ON DELETE CASCADE
);

CREATE INDEX idx_service_requests_appointment_status ON service_requests(appointment_id, status);

-- ============================================================================
-- 8. Vendor Quotes
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_quotes (
  id TEXT PRIMARY KEY,
  service_request_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,

  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'USD',
  valid_until TIMESTAMP NOT NULL,
  description TEXT,
  terms TEXT,  -- Payment terms, conditions

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, accepted, rejected, expired
  responded_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendor_quotes_service_request_status ON vendor_quotes(service_request_id, status);

-- ============================================================================
-- 9. Port Services (Master Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS port_services (
  id TEXT PRIMARY KEY,
  port_code TEXT NOT NULL,  -- UNLOCODE
  service_type TEXT NOT NULL,  -- pilotage, towage, mooring, etc.
  vendor_id TEXT NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,  -- 1 = preferred vendor

  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Pricing (optional, for reference)
  base_rate DOUBLE PRECISION,
  currency TEXT,
  unit TEXT,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT unique_port_service UNIQUE (port_code, service_type, vendor_id)
);

CREATE INDEX idx_port_services_port_type_active ON port_services(port_code, service_type, is_active);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE agent_appointments IS 'Port call appointments for agents';
COMMENT ON TABLE pdas IS 'Proforma Disbursement Accounts (estimates)';
COMMENT ON TABLE pda_line_items IS 'Individual charges in PDA';
COMMENT ON TABLE fdas IS 'Final Disbursement Accounts (actuals)';
COMMENT ON TABLE fda_line_items IS 'Individual charges in FDA with variance';
COMMENT ON TABLE fda_variances IS 'Variance analysis between PDA and FDA';
COMMENT ON TABLE service_requests IS 'Service booking requests (pilots, tugs, etc.)';
COMMENT ON TABLE vendor_quotes IS 'Vendor quotes for service requests';
COMMENT ON TABLE port_services IS 'Master data of available services at ports';
