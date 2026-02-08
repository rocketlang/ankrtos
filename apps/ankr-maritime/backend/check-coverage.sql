-- Check overall coverage
SELECT 
  COUNT(*) as total_positions,
  COUNT(DISTINCT vessel_id) as unique_vessels,
  ROUND(MIN(latitude)::numeric, 2) as min_lat,
  ROUND(MAX(latitude)::numeric, 2) as max_lat,
  ROUND(MIN(longitude)::numeric, 2) as min_lon,
  ROUND(MAX(longitude)::numeric, 2) as max_lon,
  MAX(timestamp) as latest_update
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Check Arabian Sea
SELECT 'Arabian Sea' as region, COUNT(*) as positions, COUNT(DISTINCT vessel_id) as vessels
FROM vessel_positions  
WHERE latitude BETWEEN 5 AND 25
  AND longitude BETWEEN 50 AND 75
  AND timestamp > NOW() - INTERVAL '24 hours';
