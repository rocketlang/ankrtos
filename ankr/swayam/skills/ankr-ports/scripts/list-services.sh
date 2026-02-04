#!/bin/bash
set -e

# List all ANKR services

cat << 'EOF'
SERVICE         PORT    URL                         PURPOSE
---------------------------------------------------------------------------
freightbox      4003    http://localhost:4003       NVOCC platform
wowtruck        4000    http://localhost:4000       TMS platform
eon             4005    http://localhost:4005       Knowledge graph
ai-proxy        4444    http://localhost:4444       LLM gateway
database        5432    localhost:5432              PostgreSQL
EOF
