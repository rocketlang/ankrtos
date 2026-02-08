#!/bin/bash
# OSRM Waypoint Capabilities Demo

echo "🗺️  OSRM Waypoint Capabilities"
echo "=============================="
echo ""

# Test 1: Route with arbitrary lat/long (not exact port locations)
echo "Test 1: Arbitrary Coordinates (Ocean points near route)"
echo "--------------------------------------------------------"
echo "From: 58.5°N, 8.0°E (North Sea)"
echo "To:   57.8°N, 9.5°E (Skagerrak)"
echo ""

RESULT1=$(curl -s "http://localhost:5000/route/v1/driving/8.0,58.5;9.5,57.8?overview=false")
CODE1=$(echo $RESULT1 | jq -r '.code')

if [ "$CODE1" = "Ok" ]; then
  DISTANCE=$(echo $RESULT1 | jq -r '.routes[0].distance')
  SNAPPED_START=$(echo $RESULT1 | jq -r '.waypoints[0].location')
  SNAPPED_END=$(echo $RESULT1 | jq -r '.waypoints[1].location')

  echo "✅ OSRM snapped to nearest graph edges!"
  echo "   Your point 8.0,58.5 → Snapped to: $SNAPPED_START"
  echo "   Your point 9.5,57.8 → Snapped to: $SNAPPED_END"
  echo "   Distance: $(echo "scale=1; $DISTANCE / 1852" | bc)nm"
else
  echo "❌ No route: $CODE1"
  echo "   (Points too far from ferry routes)"
fi
echo ""

# Test 2: Multiple waypoints (A → B → C)
echo "Test 2: Multi-Waypoint Route (3 points)"
echo "----------------------------------------"
echo "Path: Lillesand → Waypoint → Kristiansand"
echo ""

RESULT2=$(curl -s "http://localhost:5000/route/v1/driving/8.38,58.25;8.06,58.12;9.0,58.5?overview=false")
CODE2=$(echo $RESULT2 | jq -r '.code')
LEGS=$(echo $RESULT2 | jq -r '.routes[0].legs | length')

if [ "$CODE2" = "Ok" ]; then
  echo "✅ Multi-waypoint routing works!"
  echo "   Segments: $LEGS legs"

  for i in $(seq 0 $((LEGS - 1))); do
    LEG_DIST=$(echo $RESULT2 | jq -r ".routes[0].legs[$i].distance")
    LEG_DIST_NM=$(echo "scale=1; $LEG_DIST / 1852" | bc)
    echo "   Leg $((i+1)): ${LEG_DIST_NM}nm"
  done
else
  echo "❌ No route: $CODE2"
fi
echo ""

# Test 3: Get intermediate waypoints (geometry)
echo "Test 3: Generate Intermediate Waypoints (Geometry)"
echo "---------------------------------------------------"
echo "Request full path with all intermediate points"
echo ""

RESULT3=$(curl -s "http://localhost:5000/route/v1/driving/8.38,58.25;10.43,57.59?overview=full&geometries=geojson")
CODE3=$(echo $RESULT3 | jq -r '.code')
WAYPOINT_COUNT=$(echo $RESULT3 | jq -r '.routes[0].geometry.coordinates | length')

if [ "$CODE3" = "Ok" ]; then
  echo "✅ Full geometry returned!"
  echo "   Waypoints: $WAYPOINT_COUNT coordinates"
  echo ""
  echo "   First 5 waypoints:"
  echo $RESULT3 | jq -r '.routes[0].geometry.coordinates[0:5] | .[] | "   → [\(.[0]), \(.[1])]"'
  echo "   ..."
  echo "   Last waypoint:"
  echo $RESULT3 | jq -r '.routes[0].geometry.coordinates[-1] | "   → [\(.[0]), \(.[1])]"'
else
  echo "❌ No route: $CODE3"
fi
echo ""

# Test 4: Nearest point query
echo "Test 4: Nearest Graph Point (Snapping)"
echo "---------------------------------------"
echo "Find nearest ferry route to: 60.0°N, 5.5°E (Bergen area)"
echo ""

RESULT4=$(curl -s "http://localhost:5000/nearest/v1/driving/5.5,60.0?number=3")
CODE4=$(echo $RESULT4 | jq -r '.code')

if [ "$CODE4" = "Ok" ]; then
  echo "✅ Found nearest points on ferry graph:"
  echo $RESULT4 | jq -r '.waypoints[] | "   → [\(.location[0]), \(.location[1])] - \(.distance)m away"'
else
  echo "❌ No nearby routes"
fi
echo ""

# Test 5: 5 waypoint journey
echo "Test 5: Complex Journey (5 waypoints)"
echo "--------------------------------------"
echo "Multi-stop ferry route simulation"
echo ""

RESULT5=$(curl -s "http://localhost:5000/route/v1/driving/8.38,58.25;8.5,58.3;9.0,58.0;9.5,57.8;10.43,57.59?overview=false")
CODE5=$(echo $RESULT5 | jq -r '.code')
LEGS5=$(echo $RESULT5 | jq -r '.routes[0].legs | length')
TOTAL_DIST=$(echo $RESULT5 | jq -r '.routes[0].distance')
TOTAL_DUR=$(echo $RESULT5 | jq -r '.routes[0].duration')

if [ "$CODE5" = "Ok" ]; then
  echo "✅ 5-waypoint route calculated!"
  echo "   Total segments: $LEGS5"
  echo "   Total distance: $(echo "scale=1; $TOTAL_DIST / 1852" | bc)nm"
  echo "   Total duration: $(echo "scale=1; $TOTAL_DUR / 3600" | bc)hrs"
else
  echo "❌ No route: $CODE5"
  echo "   (Graph may not be fully connected)"
fi
echo ""

# Summary
echo "=============================="
echo "🎯 Waypoint Capabilities"
echo "=============================="
echo ""
echo "✅ Arbitrary lat/long inputs (OSRM snaps to graph)"
echo "✅ Multiple waypoints (A → B → C → D → E)"
echo "✅ Full geometry (all intermediate points)"
echo "✅ Nearest point queries (find closest route)"
echo ""
echo "⚠️  Limitations:"
echo "   - Points must be within ~100nm of a ferry route"
echo "   - Graph must be connected for multi-waypoint routing"
echo "   - Current graph: 15 routes (small coverage)"
echo ""
echo "💡 To expand coverage:"
echo "   1. Add more ferry observations (time)"
echo "   2. Extract container ship routes"
echo "   3. Extract tanker routes"
echo "   4. Target: 500+ routes globally"
