#!/bin/bash

echo "🔍 Checking all Git repositories..."
echo "=================================="
echo ""

repos=(
    "/root"
    "/root/ankr-ai-gateway"
    "/root/ankrcode-project"
    "/root/ankr-labs-nx"
    "/root/ankr-sandbox-repo"
    "/root/ankr-skill-loader"
    "/root/ankr-universe"
    "/root/bani-repo"
    "/root/everpure-whatsapp-bot"
    "/root/openclaude-ide"
    "/root/power-erp"
    "/root/swayam"
)

for repo in "${repos[@]}"; do
    if [ -d "$repo/.git" ]; then
        echo "📁 $repo"
        cd "$repo" || continue
        
        # Get remote URL
        remote_url=$(git remote get-url origin 2>/dev/null || echo "No remote")
        echo "   Remote: $remote_url"
        
        # Get current branch
        branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        echo "   Branch: $branch"
        
        # Check if there are uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            echo "   ⚠️  Has uncommitted changes"
            git status --short | head -10
        else
            echo "   ✅ Clean working directory"
        fi
        
        # Check if ahead/behind remote
        if git remote get-url origin &>/dev/null; then
            git fetch origin &>/dev/null
            local_commit=$(git rev-parse @ 2>/dev/null)
            remote_commit=$(git rev-parse @{u} 2>/dev/null || echo "")
            
            if [ -n "$remote_commit" ]; then
                if [ "$local_commit" != "$remote_commit" ]; then
                    ahead=$(git rev-list --count @{u}..@ 2>/dev/null || echo "0")
                    behind=$(git rev-list --count @..@{u} 2>/dev/null || echo "0")
                    
                    if [ "$ahead" -gt 0 ]; then
                        echo "   ⬆️  Ahead by $ahead commits"
                    fi
                    if [ "$behind" -gt 0 ]; then
                        echo "   ⬇️  Behind by $behind commits"
                    fi
                else
                    echo "   ✅ Up to date with remote"
                fi
            else
                echo "   ℹ️  No upstream branch"
            fi
        fi
        
        echo ""
    fi
done
