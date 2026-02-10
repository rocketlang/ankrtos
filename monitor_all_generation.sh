#!/bin/bash
# Monitor all three generation pipelines

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        ANKR CURRICULUM GENERATION - PARALLEL MONITORING            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📅 $(date)"
echo ""

# Check processes
echo "🔄 Active Processes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ps aux | grep -q "[p]rocess-class-7-8"; then
    echo "  ✅ NCERT Real (Class 7&8 Math/Science): RUNNING"
else
    echo "  ⏸️  NCERT Real: STOPPED"
fi

if ps aux | grep -q "[g]enerate_all_class_7_8"; then
    echo "  ✅ NCERT AI (Class 7&8 Other Subjects): RUNNING"
else
    echo "  ⏸️  NCERT AI: STOPPED"
fi

if ps aux | grep -q "[g]enerate_all_cambridge"; then
    echo "  ✅ Cambridge AI (IGCSE): RUNNING"
else
    echo "  ⏸️  Cambridge AI: STOPPED"
fi

echo ""
echo "📊 Database Stats:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d ankr_eon -t -c "SELECT '  Questions: ' || COUNT(*) FROM ankr_learning.questions;" 2>/dev/null
sudo -u postgres psql -d ankr_eon -t -c "SELECT '  Courses: ' || COUNT(*) FROM ankr_learning.courses;" 2>/dev/null

echo ""
echo "📁 Generated Files:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NCERT AI: $(ls /root/data/ncert-ai-generator/generated/*.json 2>/dev/null | wc -l) files"
echo "  Cambridge AI: $(ls /root/data/cambridge-ai-generator/generated/*.json 2>/dev/null | wc -l) files"

echo ""
echo "📝 Recent Activity:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NCERT Real:"
tail -3 /root/ankr-labs-nx/apps/ankr-curriculum-backend/class-7-8-processing.log 2>/dev/null | sed 's/^/    /'

echo ""
echo "  NCERT AI:"
tail -3 /root/data/ncert-ai-generator/generation.log 2>/dev/null | grep -E "Generated|✅" | tail -1 | sed 's/^/    /'

echo ""
echo "  Cambridge AI:"
tail -3 /root/data/cambridge-ai-generator/generation_all.log 2>/dev/null | grep -E "Generated|✅" | tail -1 | sed 's/^/    /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run: watch -n 30 ./monitor_all_generation.sh  (for live updates)"
