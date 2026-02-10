-- Create all NCERT courses (Classes 6-12)

INSERT INTO ankr_learning.courses (id, title, description, subject, board, grade_level, duration, metadata) VALUES

-- Class 11
('class-11-mathematics', 'Mathematics for Class 11', 'NCERT Mathematics textbook for Class 11', 'Mathematics', 'CBSE', '11', 90, '{"source": "NCERT", "language": "English"}'),
('class-11-physics', 'Physics for Class 11', 'NCERT Physics textbook for Class 11', 'Physics', 'CBSE', '11', 90, '{"source": "NCERT", "language": "English"}'),
('class-11-chemistry', 'Chemistry for Class 11', 'NCERT Chemistry textbook for Class 11', 'Chemistry', 'CBSE', '11', 90, '{"source": "NCERT", "language": "English"}'),
('class-11-biology', 'Biology for Class 11', 'NCERT Biology textbook for Class 11', 'Biology', 'CBSE', '11', 90, '{"source": "NCERT", "language": "English"}'),

-- Class 12
('class-12-mathematics', 'Mathematics for Class 12', 'NCERT Mathematics textbook for Class 12', 'Mathematics', 'CBSE', '12', 90, '{"source": "NCERT", "language": "English"}'),
('class-12-physics', 'Physics for Class 12', 'NCERT Physics textbook for Class 12', 'Physics', 'CBSE', '12', 90, '{"source": "NCERT", "language": "English"}'),
('class-12-chemistry', 'Chemistry for Class 12', 'NCERT Chemistry textbook for Class 12', 'Chemistry', 'CBSE', '12', 90, '{"source": "NCERT", "language": "English"}'),
('class-12-biology', 'Biology for Class 12', 'NCERT Biology textbook for Class 12', 'Biology', 'CBSE', '12', 90, '{"source": "NCERT", "language": "English"}'),

-- Class 8
('class-8-mathematics', 'Mathematics for Class 8', 'NCERT Mathematics textbook for Class 8', 'Mathematics', 'CBSE', '8', 90, '{"source": "NCERT", "language": "English"}'),
('class-8-science', 'Science for Class 8', 'NCERT Science textbook for Class 8', 'Science', 'CBSE', '8', 90, '{"source": "NCERT", "language": "English"}')

ON CONFLICT (id) DO NOTHING;

SELECT COUNT(*) as total_ncert_courses FROM ankr_learning.courses WHERE id LIKE 'class-%';
