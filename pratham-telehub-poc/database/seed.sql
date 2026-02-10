-- Pratham TeleHub POC - Sample Data
-- This creates realistic demo data for the POC

-- Insert sample users (telecallers and managers)
INSERT INTO users (id, name, email, role, phone, status, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Priya Sharma', 'priya.sharma@pratham.org', 'telecaller', '+91-9876543210', 'on_call', 'https://i.pravatar.cc/150?img=5'),
  ('22222222-2222-2222-2222-222222222222', 'Rahul Kumar', 'rahul.kumar@pratham.org', 'telecaller', '+91-9876543211', 'available', 'https://i.pravatar.cc/150?img=12'),
  ('33333333-3333-3333-3333-333333333333', 'Anjali Mehta', 'anjali.mehta@pratham.org', 'telecaller', '+91-9876543212', 'available', 'https://i.pravatar.cc/150?img=9'),
  ('44444444-4444-4444-4444-444444444444', 'Rohan Singh', 'rohan.singh@pratham.org', 'telecaller', '+91-9876543213', 'break', 'https://i.pravatar.cc/150?img=15'),
  ('55555555-5555-5555-5555-555555555555', 'Sneha Patel', 'sneha.patel@pratham.org', 'telecaller', 'available', '+91-9876543214', 'https://i.pravatar.cc/150?img=20'),
  ('66666666-6666-6666-6666-666666666666', 'Vikram Desai', 'vikram.desai@pratham.org', 'manager', '+91-9876543215', 'available', 'https://i.pravatar.cc/150?img=33'),
  ('77777777-7777-7777-7777-777777777777', 'Ankit Kapoor', 'ankit.kapoor@pratham.org', 'admin', '+91-9876543216', 'available', 'https://i.pravatar.cc/150?img=60');

-- Insert sample campaigns
INSERT INTO campaigns (id, name, description, script_template, active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'School Enrollment Drive 2026', 'Reach out to schools for Pratham program enrollment',
   'Hello, I am calling from Pratham Education Foundation. We have helped over 3 million children improve their learning outcomes. Would you be interested in learning about our programs for your school?',
   true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Teacher Training Outreach', 'Contact teachers for professional development programs',
   'Namaste, I am from Pratham. We offer free teacher training workshops that have shown 40% improvement in student outcomes. Can I share more details?',
   true);

-- Insert sample leads
INSERT INTO leads (id, name, phone, email, status, lead_score, company, designation, location, assigned_to, notes) VALUES
  ('l1111111-1111-1111-1111-111111111111', 'Ramesh Kumar', '+91-9988776655', 'ramesh.k@dpsschool.edu.in', 'new', 85, 'Delhi Public School', 'Principal', 'Delhi', '11111111-1111-1111-1111-111111111111', 'Interested in math program'),
  ('l2222222-2222-2222-2222-222222222222', 'Sunita Rao', '+91-9988776656', 'sunita.rao@kendriya.edu.in', 'contacted', 72, 'Kendriya Vidyalaya', 'Vice Principal', 'Mumbai', '11111111-1111-1111-1111-111111111111', 'Called once, requested callback'),
  ('l3333333-3333-3333-3333-333333333333', 'Arjun Verma', '+91-9988776657', 'arjun.v@modernschool.in', 'interested', 90, 'Modern School', 'Academic Coordinator', 'Bangalore', '22222222-2222-2222-2222-222222222222', 'Very interested, asked for proposal'),
  ('l4444444-4444-4444-4444-444444444444', 'Meera Iyer', '+91-9988776658', 'meera@navoday.edu.in', 'new', 65, 'Navodaya Vidyalaya', 'Teacher', 'Chennai', '22222222-2222-2222-2222-222222222222', NULL),
  ('l5555555-5555-5555-5555-555555555555', 'Sanjay Gupta', '+91-9988776659', 'sanjay.gupta@dav.edu.in', 'contacted', 78, 'DAV Public School', 'Principal', 'Pune', '33333333-3333-3333-3333-333333333333', 'Interested in teacher training'),
  ('l6666666-6666-6666-6666-666666666666', 'Lakshmi Nair', '+91-9988776660', 'lakshmi@stmary.edu.in', 'converted', 95, 'St. Mary''s School', 'Principal', 'Kochi', '33333333-3333-3333-3333-333333333333', 'Signed up for pilot program!'),
  ('l7777777-7777-7777-7777-777777777777', 'Aditya Sharma', '+91-9988776661', 'aditya@ryanschool.in', 'lost', 45, 'Ryan International', 'Coordinator', 'Hyderabad', '44444444-4444-4444-4444-444444444444', 'Not interested at this time'),
  ('l8888888-8888-8888-8888-888888888888', 'Kavita Deshmukh', '+91-9988776662', 'kavita@zpschool.gov.in', 'new', 80, 'Zilla Parishad School', 'Headmistress', 'Nagpur', '55555555-5555-5555-5555-555555555555', 'Government school, budget constrained'),
  ('l9999999-9999-9999-9999-999999999999', 'Rajesh Malhotra', '+91-9988776663', 'rajesh@epm.edu.in', 'interested', 88, 'Euro Pearl Montessori', 'Director', 'Jaipur', '11111111-1111-1111-1111-111111111111', 'Wants to schedule demo'),
  ('laaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Deepa Krishnan', '+91-9988776664', 'deepa@vidya.edu.in', 'contacted', 70, 'Vidya Bhavan', 'Principal', 'Ahmedabad', '22222222-2222-2222-2222-222222222222', 'Asked for references');

-- Insert sample calls (today's activity)
INSERT INTO calls (id, lead_id, telecaller_id, campaign_id, status, started_at, answered_at, ended_at, duration_seconds, outcome, notes) VALUES
  -- Priya's calls
  ('c1111111-1111-1111-1111-111111111111', 'l1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes', 300, 'interested', 'Principal very interested in math program'),
  ('c2222222-2222-2222-2222-222222222222', 'l2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 25 minutes', 280, 'callback', 'Will call back tomorrow at 11 AM'),
  ('c3333333-3333-3333-3333-333333333333', 'l9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'in_progress', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NULL, NULL, NULL, 'Currently on call'),

  -- Rahul's calls
  ('c4444444-4444-4444-4444-444444444444', 'l3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 52 minutes', 480, 'converted', 'Scheduled demo for next week!'),
  ('c5555555-5555-5555-5555-555555555555', 'l4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', 180, 'no_answer', 'No pickup'),

  -- Anjali's calls
  ('c6666666-6666-6666-6666-666666666666', 'l5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'completed', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 50 minutes', 600, 'interested', 'Very interested in teacher training'),
  ('c7777777-7777-7777-7777-777777777777', 'l6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'completed', NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 20 minutes', 600, 'converted', 'Signed agreement for pilot!');

-- Insert call analytics
INSERT INTO call_analytics (call_id, sentiment_score, sentiment_label, talk_ratio, keywords, objections, ai_suggestions, quality_score, detected_topics) VALUES
  ('c1111111-1111-1111-1111-111111111111', 0.75, 'positive', 0.45,
   '["math program", "learning outcomes", "improvement", "interested"]',
   '["budget constraints"]',
   '["Emphasize ROI", "Share case studies", "Offer pilot program"]',
   8, '["program_interest", "budget_discussion", "follow_up_needed"]'),

  ('c2222222-2222-2222-2222-222222222222', 0.60, 'neutral', 0.50,
   '["callback", "schedule", "tomorrow"]',
   '["time constraints"]',
   '["Send email summary", "Confirm callback time", "Prepare materials"]',
   7, '["callback_scheduled", "time_management"]'),

  ('c4444444-4444-4444-4444-444444444444', 0.90, 'positive', 0.42,
   '["demo", "excited", "results", "conversion"]',
   '[]',
   '["Schedule demo immediately", "Send confirmation", "Prepare customized presentation"]',
   9, '["strong_interest", "conversion", "demo_scheduled"]'),

  ('c6666666-6666-6666-6666-666666666666', 0.80, 'positive', 0.48,
   '["teacher training", "professional development", "capacity building"]',
   '["logistics", "timing"]',
   '["Offer flexible scheduling", "Highlight online options", "Share testimonials"]',
   8, '["training_interest", "logistics_discussion"]'),

  ('c7777777-7777-7777-7777-777777777777', 0.95, 'positive', 0.40,
   '["pilot program", "signed", "agreement", "excited"]',
   '[]',
   '["Send contract", "Celebrate win", "Schedule kickoff"]',
   10, '["conversion", "contract_signed", "pilot_program"]');

-- Update lead statuses and last call times
UPDATE leads SET last_call_at = NOW() - INTERVAL '2 hours', status = 'contacted'
WHERE id = 'l1111111-1111-1111-1111-111111111111';

UPDATE leads SET last_call_at = NOW() - INTERVAL '1 hour 30 minutes', status = 'contacted'
WHERE id = 'l2222222-2222-2222-2222-222222222222';

UPDATE leads SET last_call_at = NOW() - INTERVAL '3 hours', status = 'interested'
WHERE id = 'l3333333-3333-3333-3333-333333333333';

UPDATE leads SET last_call_at = NOW() - INTERVAL '4 hours', status = 'contacted'
WHERE id = 'l5555555-5555-5555-5555-555555555555';

UPDATE leads SET last_call_at = NOW() - INTERVAL '5 minutes', status = 'interested'
WHERE id = 'l9999999-9999-9999-9999-999999999999';
