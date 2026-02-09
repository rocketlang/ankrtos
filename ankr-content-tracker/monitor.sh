#!/bin/bash
# ANKR Content Tracking - Quick Access Script

TRACKER_DIR="/root/ankr-content-tracker"

case "${1:-dashboard}" in
  dashboard|live)
    echo "🎯 Starting Live Dashboard (updates every 5 seconds)"
    echo "Press Ctrl+C to exit"
    echo ""
    python3 "$TRACKER_DIR/tracker.py"
    ;;

  status|once)
    echo "📊 Current Status Snapshot"
    echo ""
    python3 "$TRACKER_DIR/tracker.py" --once
    ;;

  stats)
    echo "📈 Content Registry Statistics"
    echo ""
    python3 "$TRACKER_DIR/content_registry.py" stats
    ;;

  scan)
    echo "🔍 Scanning and Registering Content..."
    python3 "$TRACKER_DIR/content_registry.py" scan
    ;;

  export)
    OUTPUT="${2:-/tmp/content-status.json}"
    python3 "$TRACKER_DIR/tracker.py" --json "$OUTPUT"
    echo "✅ Status exported to: $OUTPUT"
    cat "$OUTPUT"
    ;;

  ncert)
    echo "📚 NCERT Processing Log (last 50 lines)"
    echo ""
    tail -50 /root/ankr-labs-nx/apps/ankr-curriculum-backend/batch-processing.log | grep -E "📚|✅ Chapter|questions"
    ;;

  cambridge)
    echo "📥 Cambridge Download Log (last 50 lines)"
    echo ""
    tail -50 /root/data/cambridge-comprehensive/cambridge-download.log
    ;;

  db)
    echo "💾 Database Statistics"
    echo ""
    sudo -u postgres psql -d ankr_eon << 'EOF'
SELECT
  'Courses: ' || COUNT(*) as stat FROM ankr_learning.courses
UNION ALL
SELECT 'Modules: ' || COUNT(*) FROM ankr_learning.modules
UNION ALL
SELECT 'Quizzes: ' || COUNT(*) FROM ankr_learning.quizzes
UNION ALL
SELECT 'Questions: ' || COUNT(*) FROM ankr_learning.questions;
EOF
    ;;

  help|*)
    echo "ANKR Content Ingestion Tracker"
    echo "==============================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dashboard, live    Start live dashboard (default, auto-refresh)"
    echo "  status, once       Show current status snapshot"
    echo "  stats              Show content registry statistics"
    echo "  scan               Scan and register all content files"
    echo "  export [file]      Export status to JSON"
    echo "  ncert              Show NCERT processing log"
    echo "  cambridge          Show Cambridge download log"
    echo "  db                 Show database statistics"
    echo "  help               Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                 # Start live dashboard"
    echo "  $0 status          # Quick snapshot"
    echo "  $0 stats           # Registry stats"
    echo "  $0 export /tmp/status.json"
    echo ""
    ;;
esac
