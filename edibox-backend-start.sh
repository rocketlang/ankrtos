#!/bin/bash
cd /root/ankr-labs-nx/apps/edibox/backend
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/edibox" \
PORT=4080 \
npx tsx src/main.ts
