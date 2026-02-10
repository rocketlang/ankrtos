-- Add remaining chapters for Class 10 Mathematics (chapters 4-15)

INSERT INTO ankr_learning.modules (id, course_id, title, description, "order", duration) VALUES
('ch4-quadratic-equations', 'class-10-mathematics', 'Quadratic Equations', 'Standard form, solutions, and applications of quadratic equations', 4, 45),
('ch5-arithmetic-progressions', 'class-10-mathematics', 'Arithmetic Progressions', 'AP sequences, nth term, sum of n terms', 5, 40),
('ch6-triangles', 'class-10-mathematics', 'Triangles', 'Similarity, Pythagoras theorem, and triangle properties', 6, 50),
('ch7-coordinate-geometry', 'class-10-mathematics', 'Coordinate Geometry', 'Distance formula, section formula, area of triangle', 7, 45),
('ch8-trigonometry', 'class-10-mathematics', 'Introduction to Trigonometry', 'Trigonometric ratios and identities', 8, 55),
('ch9-applications-trigonometry', 'class-10-mathematics', 'Some Applications of Trigonometry', 'Heights and distances problems', 9, 35),
('ch10-circles', 'class-10-mathematics', 'Circles', 'Tangent to a circle and related theorems', 10, 40),
('ch11-constructions', 'class-10-mathematics', 'Constructions', 'Division of line segment and tangent construction', 11, 30),
('ch12-area-related-circles', 'class-10-mathematics', 'Areas Related to Circles', 'Area and perimeter of circle sectors and segments', 12, 40),
('ch13-surface-areas-volumes', 'class-10-mathematics', 'Surface Areas and Volumes', 'Volume and surface area of combined solids', 13, 45),
('ch14-statistics', 'class-10-mathematics', 'Statistics', 'Mean, median, mode of grouped data', 14, 40),
('ch15-probability', 'class-10-mathematics', 'Probability', 'Theoretical probability and simple problems', 15, 35)
ON CONFLICT (id) DO NOTHING;

SELECT COUNT(*) as total_chapters FROM ankr_learning.modules WHERE course_id = 'class-10-mathematics';
