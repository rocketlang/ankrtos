#!/bin/bash
# Create service-specific users with granular permissions

cat > /root/.ankr/config/users.json << 'EOF'
{
  "admin": {
    "username": "admin",
    "password": "9cbba1c54637a5d56b9f936a532bbb953932d5d49c32ae84c040d71242cde7dc",
    "role": "admin",
    "name": "ANKR Administrator",
    "permissions": ["*"],
    "created": "2026-02-16T07:35:18.247Z"
  },
  "captain@ankr.in": {
    "username": "captain@ankr.in",
    "password": "072fc677a9c903078d0c9fa96116659430bb3b60f95dfa8a2a4bc0713a92af75",
    "role": "admin",
    "name": "Captain",
    "permissions": ["*"],
    "created": "2026-02-16T13:08:45.000Z"
  },
  "pratham@ankr.in": {
    "username": "pratham@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "Pratham User",
    "permissions": ["pratham", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "ankrtms@ankr.in": {
    "username": "ankrtms@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "ANKR TMS User",
    "permissions": ["ankrtms", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "complymitra@ankr.in": {
    "username": "complymitra@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "ComplyMitra User",
    "permissions": ["complymitra", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "ankrwms@ankr.in": {
    "username": "ankrwms@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "ANKR WMS User",
    "permissions": ["ankrwms", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "freightbox@ankr.in": {
    "username": "freightbox@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "FreightBox User",
    "permissions": ["freightbox", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "mari8x@ankr.in": {
    "username": "mari8x@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "Mari8X User",
    "permissions": ["mari8x", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "edibox@ankr.in": {
    "username": "edibox@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "EDIBox User",
    "permissions": ["edibox", "admin"],
    "created": "2026-02-16T13:10:00.000Z"
  },
  "viewer@ankr.in": {
    "username": "viewer@ankr.in",
    "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "role": "user",
    "name": "General Viewer",
    "permissions": ["interact", "view", "project", "viewer", "ncert"],
    "created": "2026-02-16T13:10:00.000Z"
  }
}
EOF

echo "✅ Service users created!"
echo ""
echo "Default password for all service users: password"
echo ""
echo "Users created:"
echo "  • pratham@ankr.in      → Access: /pratham/, /admin/"
echo "  • ankrtms@ankr.in      → Access: /ankrtms/, /admin/"
echo "  • complymitra@ankr.in  → Access: /complymitra/, /admin/"
echo "  • ankrwms@ankr.in      → Access: /ankrwms/, /admin/"
echo "  • freightbox@ankr.in   → Access: /freightbox/, /admin/"
echo "  • mari8x@ankr.in       → Access: /mari8x/, /admin/"
echo "  • edibox@ankr.in       → Access: /edibox/, /admin/"
echo "  • viewer@ankr.in       → Access: viewers only (/interact, /view, /ncert)"
echo ""
echo "Note: All service users can access /admin/ dashboard"
