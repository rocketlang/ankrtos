#!/bin/bash
set -e

# GPT Expert Delegation via Codex MCP
# Usage: delegate.sh <expert> "<task>" [--files "file1,file2"] [--mode advisory|implementation]

EXPERT="${1:-}"
TASK="${2:-}"
shift 2 || true

if [ -z "$EXPERT" ] || [ -z "$TASK" ]; then
    echo "Usage: delegate.sh <expert> \"<task>\" [--files \"file1,file2\"] [--mode advisory|implementation]" >&2
    echo "Experts: architect, plan-reviewer, scope-analyst, code-reviewer, security-analyst, judge" >&2
    exit 1
fi

# Parse options
FILES=""
MODE="advisory"
while [ $# -gt 0 ]; do
    case "$1" in
        --files)
            FILES="$2"
            shift 2
            ;;
        --mode)
            MODE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Set sandbox based on mode
if [ "$MODE" = "implementation" ]; then
    SANDBOX="workspace-write"
else
    SANDBOX="read-only"
fi

# Map expert to prompt file
PROMPT_DIR="${CLAUDE_PLUGIN_ROOT:-/root/ankr/swayam}/prompts"
case "$EXPERT" in
    architect)
        PROMPT_FILE="$PROMPT_DIR/architect.md"
        ;;
    plan-reviewer|plan)
        PROMPT_FILE="$PROMPT_DIR/plan-reviewer.md"
        ;;
    scope-analyst|scope)
        PROMPT_FILE="$PROMPT_DIR/scope-analyst.md"
        ;;
    code-reviewer|code)
        PROMPT_FILE="$PROMPT_DIR/code-reviewer.md"
        ;;
    security-analyst|security)
        PROMPT_FILE="$PROMPT_DIR/security-analyst.md"
        ;;
    judge)
        PROMPT_FILE="$PROMPT_DIR/judge.md"
        ;;
    *)
        echo "Unknown expert: $EXPERT" >&2
        exit 1
        ;;
esac

# Read expert prompt if file exists
DEVELOPER_INSTRUCTIONS=""
if [ -f "$PROMPT_FILE" ]; then
    DEVELOPER_INSTRUCTIONS=$(cat "$PROMPT_FILE")
fi

# Build context
CONTEXT=""
if [ -n "$FILES" ]; then
    IFS=',' read -ra FILE_ARRAY <<< "$FILES"
    for file in "${FILE_ARRAY[@]}"; do
        if [ -f "$file" ]; then
            CONTEXT="$CONTEXT\n\n### File: $file\n\`\`\`\n$(cat "$file")\n\`\`\`"
        fi
    done
fi

# Output delegation info (for MCP consumption)
cat <<EOF
{
    "expert": "$EXPERT",
    "task": $(echo "$TASK" | jq -Rs .),
    "sandbox": "$SANDBOX",
    "mode": "$MODE",
    "context": $(echo -e "$CONTEXT" | jq -Rs .),
    "developerInstructions": $(echo "$DEVELOPER_INSTRUCTIONS" | jq -Rs .)
}
EOF

echo "" >&2
echo "Delegation prepared for $EXPERT expert in $MODE mode." >&2
echo "Use mcp__codex__codex with the above payload." >&2
