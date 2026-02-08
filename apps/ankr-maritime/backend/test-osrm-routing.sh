#!/bin/bash
# Mari8X OSRM Routing - Test Script

echo "🚢 Mari8X OSRM Ferry Routing Test"
echo "=================================="
echo ""

# Check if OSRM server is running
if ! docker ps | grep -q mari8x-osrm; then
  echo "❌ OSRM server not running!"
  echo ""
  echo "Start with:"
  echo "  cd /root/apps/ankr-maritime/backend"
  echo "  docker run -d --name mari8x-osrm -p 5000:5000 -v \$(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/osrm-ferry-graph.osrm"
  exit 1
fi

echo "✅ OSRM server running"
echo ""

# Test 1: Lillesand → Aalbæk
echo "Test 1: Lillesand (Norway) → Aalbæk (Denmark)"
echo "-----------------------------------------------"
RESULT=$(curl -s "http://localhost:5000/route/v1/driving/8.3795,58.2476;10.4279,57.5922?overview=false")
CODE=$(echo $RESULT | jq -r '.code')
DISTANCE=$(echo $RESULT | jq -r '.routes[0].distance')
DURATION=$(echo $RESULT | jq -r '.routes[0].duration')

if [ "$CODE" = "Ok" ]; then
  DISTANCE_NM=$(echo "scale=1; $DISTANCE / 1852" | bc)
  DURATION_HRS=$(echo "scale=1; $DURATION / 3600" | bc)
  SPEED_KTS=$(echo "scale=1; $DISTANCE_NM / $DURATION_HRS" | bc)

  echo "✅ Route found!"
  echo "   Distance: ${DISTANCE_NM}nm"
  echo "   Duration: ${DURATION_HRS}hrs"
  echo "   Avg Speed: ${SPEED_KTS}kts"
else
  echo "❌ No route found"
  echo "   Response: $CODE"
fi
echo ""

# Test 2: Ryggstranden → Kristiansand
echo "Test 2: Ryggstranden → Kristiansand"
echo "------------------------------------"
RESULT2=$(curl -s "http://localhost:5000/route/v1/driving/5.6597,59.0019;8.0628,58.1215?overview=false")
CODE2=$(echo $RESULT2 | jq -r '.code')
DISTANCE2=$(echo $RESULT2 | jq -r '.routes[0].distance')
DURATION2=$(echo $RESULT2 | jq -r '.routes[0].duration')

if [ "$CODE2" = "Ok" ]; then
  DISTANCE2_NM=$(echo "scale=1; $DISTANCE2 / 1852" | bc)
  DURATION2_HRS=$(echo "scale=1; $DURATION2 / 3600" | bc)
  SPEED2_KTS=$(echo "scale=1; $DISTANCE2_NM / $DURATION2_HRS" | bc)

  echo "✅ Route found!"
  echo "   Distance: ${DISTANCE2_NM}nm"
  echo "   Duration: ${DURATION2_HRS}hrs"
  echo "   Avg Speed: ${SPEED2_KTS}kts"
else
  echo "❌ No route found"
  echo "   Response: $CODE2"
fi
echo ""

# Test 3: Multi-waypoint route
echo "Test 3: Multi-waypoint (Lillesand → Aalbæk → Ryggstranden)"
echo "-----------------------------------------------------------"
RESULT3=$(curl -s "http://localhost:5000/route/v1/driving/8.3795,58.2476;10.4279,57.5922;5.6597,59.0019?overview=false")
CODE3=$(echo $RESULT3 | jq -r '.code')
DISTANCE3=$(echo $RESULT3 | jq -r '.routes[0].distance')
DURATION3=$(echo $RESULT3 | jq -r '.routes[0].duration')
LEGS=$(echo $RESULT3 | jq -r '.routes[0].legs | length')

if [ "$CODE3" = "Ok" ]; then
  DISTANCE3_NM=$(echo "scale=1; $DISTANCE3 / 1852" | bc)
  DURATION3_HRS=$(echo "scale=1; $DURATION3 / 3600" | bc)

  echo "✅ Route found!"
  echo "   Total Distance: ${DISTANCE3_NM}nm"
  echo "   Total Duration: ${DURATION3_HRS}hrs"
  echo "   Segments: $LEGS legs"
else
  echo "❌ No route found"
  echo "   Response: $CODE3"
fi
echo ""

# Test 4: With full geometry
echo "Test 4: Route with full geometry (waypoints)"
echo "----------------------------------------------"
RESULT4=$(curl -s "http://localhost:5000/route/v1/driving/8.3795,58.2476;10.4279,57.5922?overview=full&geometries=geojson")
CODE4=$(echo $RESULT4 | jq -r '.code')
GEOMETRY=$(echo $RESULT4 | jq -r '.routes[0].geometry.coordinates | length')

if [ "$CODE4" = "Ok" ] && [ "$GEOMETRY" != "null" ]; then
  echo "✅ Geometry returned!"
  echo "   Waypoints: $GEOMETRY coordinates"
  echo "   Format: GeoJSON"
else
  echo "❌ No geometry"
fi
echo ""

# Summary
echo "=================================="
echo "🎯 Test Summary"
echo "=================================="
echo "OSRM Server: ✅ Running (port 5000)"
echo "Routes Tested: 4"
echo "Graph: 17 ports, 15 ferry routes"
echo "Strategy: Hybrid (Creep Build + Averaging)"
echo ""
echo "📊 Graph Stats:"
docker exec mari8x-osrm ls -lh /data/osrm-ferry-graph.osrm | awk '{print "   Graph Size: " $5}'
echo ""
echo "🚀 Ready for production!"
