-- Pratham TeleHub POC Database Schema
-- Quick setup for demonstration

-- Drop existing tables if they exist
DROP TABLE IF EXISTS call_analytics CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Users (Telecallers and Managers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'telecaller', 'manager', 'admin'
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'on_call', 'break', 'offline'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255), -- Laravel CRM ID
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'interested', 'converted', 'lost'
  lead_score INTEGER DEFAULT 50, -- 0-100
  company VARCHAR(255),
  designation VARCHAR(255),
  location VARCHAR(255),
  notes TEXT,
  last_call_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  script_template TEXT,
  target_audience JSONB,
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calls
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  telecaller_id UUID REFERENCES users(id),
  campaign_id UUID REFERENCES campaigns(id),
  direction VARCHAR(20) DEFAULT 'outbound', -- 'inbound', 'outbound'
  status VARCHAR(50) DEFAULT 'initiated', -- 'initiated', 'ringing', 'in_progress', 'completed', 'missed', 'failed'
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  outcome VARCHAR(50), -- 'no_answer', 'busy', 'interested', 'not_interested', 'callback', 'converted'
  recording_url TEXT,
  transcript TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Analytics (Real-time AI analysis)
CREATE TABLE call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  sentiment_label VARCHAR(50), -- 'positive', 'neutral', 'negative'
  talk_ratio DECIMAL(3,2), -- telecaller talk time / total time
  keywords JSONB DEFAULT '[]',
  objections JSONB DEFAULT '[]',
  ai_suggestions JSONB DEFAULT '[]',
  quality_score INTEGER, -- 1-10
  detected_topics JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance tracking view
CREATE OR REPLACE VIEW telecaller_performance AS
SELECT
  u.id as telecaller_id,
  u.name as telecaller_name,
  DATE(c.created_at) as date,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE c.status = 'completed') as completed_calls,
  COUNT(*) FILTER (WHERE c.outcome = 'converted') as conversions,
  AVG(c.duration_seconds)::INTEGER as avg_duration,
  AVG(ca.sentiment_score) as avg_sentiment,
  AVG(ca.quality_score) as avg_quality
FROM users u
LEFT JOIN calls c ON c.telecaller_id = u.id
LEFT JOIN call_analytics ca ON ca.call_id = c.id
WHERE u.role = 'telecaller'
GROUP BY u.id, u.name, DATE(c.created_at);

-- Indexes for performance
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_calls_telecaller_id ON calls(telecaller_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
