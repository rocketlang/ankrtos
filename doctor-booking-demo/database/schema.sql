-- Doctor Booking AI Voice Agent - Database Schema

-- Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  hospital VARCHAR(255),
  specialization VARCHAR(100),
  appointment_date DATE,
  appointment_time TIME,
  symptoms TEXT,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Sample data for testing
INSERT INTO appointments (
  patient_name, patient_phone, hospital, specialization,
  appointment_date, appointment_time, symptoms, status
) VALUES
  ('Amit Kumar', '9876543210', 'Apollo Hospital', 'dermatologist', CURRENT_DATE + INTERVAL '1 day', '10:00', 'skin rash, itching', 'confirmed'),
  ('Priya Sharma', '9876543211', 'Fortis Hospital', 'general physician', CURRENT_DATE + INTERVAL '2 days', '14:00', 'fever, cough', 'confirmed'),
  ('Rajesh Gupta', '9876543212', 'Max Hospital', 'dermatologist', CURRENT_DATE + INTERVAL '3 days', '11:00', 'acne, redness', 'confirmed')
ON CONFLICT DO NOTHING;

-- View for recent appointments
CREATE OR REPLACE VIEW recent_appointments AS
SELECT
  id,
  patient_name,
  patient_phone,
  hospital,
  specialization,
  appointment_date,
  appointment_time,
  symptoms,
  status,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 100;

COMMENT ON TABLE appointments IS 'Stores doctor appointments booked via AI voice agent';
