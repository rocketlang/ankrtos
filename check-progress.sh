#!/bin/bash
# Check progress of full NCERT set processing

echo "📊 Current Processing Progress"
echo "=============================="
echo ""

# Show last 30 lines of output
echo "Recent Activity:"
tail -30 /tmp/claude-0/-root/tasks/b977110.output

echo ""
echo "=============================="
echo ""
echo "To see full output: tail -f /tmp/claude-0/-root/tasks/b977110.output"
echo "To check if complete: tail -100 /tmp/claude-0/-root/tasks/b977110.output | grep 'Processing complete'"
