-- Seed a few reports around New Delhi
INSERT INTO reports (title, description, category, status, auto_categorized, image_url, lat, lng, geom)
VALUES
('Pothole near Connaught Place', 'Large pothole causing traffic slowdown.', 'pothole', 'open', TRUE, NULL, 28.6315, 77.2167, ST_SetSRID(ST_MakePoint(77.2167, 28.6315), 4326)),
('Overflowing garbage bin', 'Needs immediate cleanup.', 'garbage', 'in_progress', TRUE, NULL, 28.6448, 77.2167, ST_SetSRID(ST_MakePoint(77.2167, 28.6448), 4326));