# 🌍 OSRM Public Access Guide

## Can Anyone See These Routes?

**YES!** OSRM routes can be visualized by anyone. Here's how:

---

## 1. Direct API Access (REST)

Anyone with access to your OSRM server can query routes:

```bash
# Basic route query
curl "http://your-server:5000/route/v1/driving/8.38,58.25;10.43,57.59"

# With full geometry (for polylines)
curl "http://your-server:5000/route/v1/driving/8.38,58.25;10.43,57.59?overview=full&geometries=geojson"
```

### Output Formats

| Format | Use Case | Query Parameter |
|--------|----------|-----------------|
| **GeoJSON** | Leaflet, Mapbox, most maps | `geometries=geojson` |
| **Polyline** | Google Maps | `geometries=polyline` |
| **Polyline6** | High precision | `geometries=polyline6` |

---

## 2. Web Visualization (HTML/JS)

**Anyone can embed OSRM routes on a webpage:**

### Simple Example (Leaflet)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: 600px; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([58.5, 8.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Fetch route from OSRM
    fetch('http://localhost:5000/route/v1/driving/8.38,58.25;10.43,57.59?overview=full&geometries=geojson')
      .then(res => res.json())
      .then(data => {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        // Draw polyline
        L.polyline(coords, {
          color: '#00d4ff',
          weight: 4
        }).addTo(map);

        // Add markers
        L.marker([58.25, 8.38]).addTo(map).bindPopup('Start');
        L.marker([57.59, 10.43]).addTo(map).bindPopup('End');
      });
  </script>
</body>
</html>
```

---

## 3. React/Vue/Angular Components

### React Example

```tsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';

function OSRMRoute({ start, end }) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoute(coords);
      });
  }, [start, end]);

  return (
    <MapContainer center={[58.5, 8.5]} zoom={6} style={{ height: '600px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {route && <Polyline positions={route} color="#00d4ff" weight={4} />}
      <Marker position={[start.lat, start.lng]} />
      <Marker position={[end.lat, end.lng]} />
    </MapContainer>
  );
}
```

---

## 4. Mobile Apps (iOS/Android)

### React Native (Expo)

```javascript
import MapView, { Polyline, Marker } from 'react-native-maps';

function FerryRouteMap() {
  const [route, setRoute] = useState([]);

  useEffect(() => {
    fetch('http://your-server:5000/route/v1/driving/8.38,58.25;10.43,57.59?overview=full&geometries=geojson')
      .then(res => res.json())
      .then(data => {
        const coords = data.routes[0].geometry.coordinates.map(c => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRoute(coords);
      });
  }, []);

  return (
    <MapView initialRegion={{ latitude: 58.5, longitude: 8.5, latitudeDelta: 5, longitudeDelta: 5 }}>
      <Polyline coordinates={route} strokeColor="#00d4ff" strokeWidth={4} />
      <Marker coordinate={{ latitude: 58.25, longitude: 8.38 }} title="Start" />
      <Marker coordinate={{ latitude: 57.59, longitude: 10.43 }} title="End" />
    </MapView>
  );
}
```

---

## 5. Making Your OSRM Server Public

### Current Setup (Local Only)
```
OSRM Server: localhost:5000
Accessible: Only from your machine
```

### Option A: Nginx Reverse Proxy (Recommended)

```nginx
# /etc/nginx/sites-enabled/osrm.mari8x.com
server {
  listen 80;
  server_name osrm.mari8x.com;

  location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;

    # CORS headers (allow any website to use your OSRM)
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
  }
}
```

**Then anyone can access:**
```bash
curl "https://osrm.mari8x.com/route/v1/driving/8.38,58.25;10.43,57.59"
```

### Option B: Docker with Port Mapping

```bash
# Make OSRM accessible from outside
docker run -d --name mari8x-osrm \
  -p 0.0.0.0:5000:5000 \
  -v $(pwd):/data \
  osrm/osrm-backend osrm-routed --algorithm mld /data/osrm-ferry-graph.osrm
```

### Option C: Cloudflare Tunnel

```bash
# Expose OSRM securely via Cloudflare
cloudflared tunnel --url http://localhost:5000
```

---

## 6. GraphQL API (Mari8X Integration)

**Embed OSRM in your existing Mari8X GraphQL API:**

```graphql
# Query from frontend
query {
  calculateMaritimeRoute(waypoints: [
    { lat: 58.25, lng: 8.38 },
    { lat: 57.59, lng: 10.43 }
  ]) {
    distance  # nautical miles
    duration  # hours
    polyline  # GeoJSON coordinates
  }
}
```

**Anyone using your Mari8X API can get routes!**

---

## 7. Embedding in Mari8X Pages

### Add to Mari8xLanding.tsx

```tsx
import OSRMRouteMap from '../components/OSRMRouteMap';

function Mari8xLanding() {
  return (
    <div>
      {/* Existing content */}

      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-6">🗺️ Live Ferry Routes</h2>

        <OSRMRouteMap
          waypoints={[
            { lat: 58.25, lng: 8.38, label: 'Lillesand' },
            { lat: 57.59, lng: 10.43, label: 'Aalbæk' }
          ]}
          autoFetch={true}
        />
      </div>
    </div>
  );
}
```

---

## 8. Security Considerations

### Rate Limiting
```nginx
# Limit requests to prevent abuse
limit_req_zone $binary_remote_addr zone=osrm:10m rate=10r/s;

location / {
  limit_req zone=osrm burst=20;
  proxy_pass http://localhost:5000;
}
```

### API Key Protection
```typescript
// Require API key for OSRM access
app.use('/osrm/*', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.OSRM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## 9. Real-World Examples

### Example 1: Public Ferry Tracker
```
https://mari8x.com/ferry-routes
- Shows all active ferry routes
- Users can click to see polylines
- Live positions + OSRM planned routes
```

### Example 2: Route Planner Widget
```html
<iframe
  src="https://mari8x.com/route-planner?from=58.25,8.38&to=57.59,10.43"
  width="800"
  height="600">
</iframe>
```

### Example 3: Mobile App
```
Mari8X Mobile App
- Users enter origin/destination
- App queries OSRM API
- Displays route on map with ETA
```

---

## 10. Current Demo Access

**✅ Working Now:**
- Local demo: http://localhost:8080/public/osrm-demo.html
- OSRM API: http://localhost:5000/route/v1/driving/{coords}

**🚀 Next Steps to Make Public:**
1. Set up nginx reverse proxy
2. Add domain: osrm.mari8x.com
3. Enable CORS for web access
4. Add to Mari8X frontend
5. Document API for developers

---

## Summary

| Access Method | Public? | Setup Required |
|---------------|---------|----------------|
| **Direct API** | ✅ (with proxy) | Nginx/Cloudflare |
| **HTML/JS** | ✅ | Just fetch() |
| **React Component** | ✅ | Import component |
| **Mobile App** | ✅ | API calls |
| **GraphQL** | ✅ | Add resolver |
| **Iframe Embed** | ✅ | Host page |

**YES - Anyone can visualize OSRM routes as polylines on any map platform!**

The routes are just coordinate arrays - compatible with:
- Leaflet ✅
- Google Maps ✅
- Mapbox ✅
- OpenStreetMap ✅
- React Leaflet ✅
- React Native Maps ✅

---

**Demo Files:**
- `/root/apps/ankr-maritime/backend/public/osrm-demo.html` - Live demo
- `/root/apps/ankr-maritime/frontend/src/components/OSRMRouteMap.tsx` - React component
- `/root/apps/ankr-maritime/backend/test-osrm-waypoints.sh` - API examples

🚢 **Your OSRM routes are ready to be shared with the world!**
