#!/bin/bash
# DevBrain Quick Start

cd /root/ankr-labs-nx

case "$1" in
  test)
    echo "🧪 Running DevBrain tests..."
    cd packages/ankr-devbrain && npx tsx src/test.ts
    ;;
  memory)
    echo "🧠 Testing Package Memory..."
    cd packages/ankr-package-memory && npx tsx src/test.ts
    ;;
  sandbox)
    echo "🔒 Testing Sandbox..."
    cd packages/ankr-sandbox && npx tsx src/test.ts
    ;;
  stats)
    echo "📊 DevBrain Stats..."
    PGPASSWORD='indrA@0612' psql -h localhost -p 5432 -U ankr -d ankr_eon -c "
      SELECT 
        (SELECT COUNT(*) FROM devbrain.packages) as packages,
        (SELECT COUNT(*) FROM devbrain.usage_log) as usage_logs,
        (SELECT COALESCE(AVG(success_rate), 0) FROM devbrain.packages) as avg_success
    "
    ;;
  *)
    echo "DevBrain Commands:"
    echo "  devbrain test    - Run DevBrain tests"
    echo "  devbrain memory  - Test Package Memory"
    echo "  devbrain sandbox - Test Sandbox"
    echo "  devbrain stats   - Show stats"
    ;;
esac
