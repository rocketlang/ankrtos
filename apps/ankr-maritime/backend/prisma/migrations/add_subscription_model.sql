-- Add Subscription Model for Enterprise IP Protection
-- Date: February 2, 2026
-- Purpose: Implement subscription tiers + access control for port tariff and AIS routing features

-- ========================================
-- SUBSCRIPTION TIERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  features JSONB,
  api_quota INTEGER NOT NULL DEFAULT 0,
  api_used INTEGER NOT NULL DEFAULT 0,
  last_quota_reset TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT chk_tier CHECK (tier IN ('free', 'agent', 'operator', 'enterprise')),
  CONSTRAINT chk_status CHECK (status IN ('active', 'past_due', 'cancelled', 'suspended', 'trialing')),
  CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('monthly', 'annual'))
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date) WHERE end_date IS NOT NULL;

-- ========================================
-- SUBSCRIPTION PLANS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(255) PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL,
  price_annual_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  features JSONB NOT NULL,
  api_quota_monthly INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  stripe_product_id VARCHAR(255),
  stripe_price_monthly_id VARCHAR(255),
  stripe_price_annual_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_plan_tier CHECK (tier IN ('free', 'agent', 'operator', 'enterprise'))
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, tier, name, description, price_monthly_cents, price_annual_cents, features, api_quota_monthly, max_users) VALUES
('plan_free', 'free', 'Free', 'Basic access with no enterprise features', 0, 0,
 '{"port_tariff_view": false, "port_tariff_export": false, "pda_generation": false, "ais_routing": false, "market_intelligence": false, "api_access": false}'::jsonb,
 0, 1),

('plan_agent', 'agent', 'Port Agent', 'Read-only port tariff access + limited PDA generation', 29900, 299000,
 '{"port_tariff_view": true, "port_tariff_export": false, "pda_generation": true, "pda_quota_monthly": 50, "ais_routing": false, "market_intelligence": false, "api_access": false}'::jsonb,
 0, 5),

('plan_operator', 'operator', 'Ship Operator', 'Full port tariff + real-time AIS routing + basic market intel', 99900, 999000,
 '{"port_tariff_view": true, "port_tariff_export": true, "pda_generation": true, "pda_quota_monthly": 500, "ais_routing": true, "market_intelligence": true, "market_intel_level": "basic", "api_access": false}'::jsonb,
 1000, 20),

('plan_enterprise', 'enterprise', 'Enterprise', 'All features + unlimited API access + white-label options', 499900, 4999000,
 '{"port_tariff_view": true, "port_tariff_export": true, "pda_generation": true, "pda_quota_monthly": -1, "ais_routing": true, "market_intelligence": true, "market_intel_level": "advanced", "api_access": true, "white_label": true, "dedicated_support": true}'::jsonb,
 100000, -1);

-- ========================================
-- FEATURE ACCESS AUDIT LOG
-- ========================================
CREATE TABLE IF NOT EXISTS feature_access_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  feature VARCHAR(255) NOT NULL,
  action VARCHAR(255),
  resource_id VARCHAR(255),
  subscription_tier VARCHAR(50),
  access_granted BOOLEAN NOT NULL DEFAULT TRUE,
  denial_reason TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_feature_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_feature_access_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_feature_access_user ON feature_access_logs(user_id);
CREATE INDEX idx_feature_access_organization ON feature_access_logs(organization_id);
CREATE INDEX idx_feature_access_feature ON feature_access_logs(feature);
CREATE INDEX idx_feature_access_time ON feature_access_logs(accessed_at);
CREATE INDEX idx_feature_access_granted ON feature_access_logs(access_granted);

-- ========================================
-- API USAGE TRACKING
-- ========================================
CREATE TABLE IF NOT EXISTS api_usage (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  quota_used INTEGER NOT NULL DEFAULT 1,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_api_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_api_usage_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_api_usage_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_organization ON api_usage(organization_id);
CREATE INDEX idx_api_usage_subscription ON api_usage(subscription_id);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_time ON api_usage(request_at);

-- ========================================
-- SUBSCRIPTION INVOICES
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id VARCHAR(255) PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(255) UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  invoice_pdf_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'))
);

CREATE INDEX idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_invoices_organization ON subscription_invoices(organization_id);
CREATE INDEX idx_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_invoices_due_date ON subscription_invoices(due_date);

-- ========================================
-- SUBSCRIPTION EVENTS (Audit Trail)
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_events (
  id VARCHAR(255) PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_subscription_event FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_time ON subscription_events(created_at);

-- ========================================
-- FEATURE FLAGS (Per Organization)
-- ========================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(255) PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMP,
  disabled_at TIMESTAMP,
  enabled_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_feature_flag_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT uq_feature_flag_org_feature UNIQUE(organization_id, feature_name)
);

CREATE INDEX idx_feature_flags_organization ON feature_flags(organization_id);
CREATE INDEX idx_feature_flags_feature ON feature_flags(feature_name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);

-- ========================================
-- UPDATE USERS TABLE (add subscription relation)
-- ========================================
-- Note: subscriptions table already references users, so no changes needed to users table

COMMENT ON TABLE subscriptions IS 'Enterprise subscription management - controls access to IP features';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with pricing and features';
COMMENT ON TABLE feature_access_logs IS 'Audit log for all enterprise feature access attempts';
COMMENT ON TABLE api_usage IS 'Track API usage for quota enforcement';
COMMENT ON TABLE subscription_invoices IS 'Billing invoices for subscriptions';
COMMENT ON TABLE subscription_events IS 'Audit trail for subscription lifecycle events';
COMMENT ON TABLE feature_flags IS 'Organization-specific feature toggles';
