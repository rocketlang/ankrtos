#!/bin/bash

# ANKR Repository Manager
# Manages cloning and updating of all ANKR-related repositories

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/root"

echo "🚀 ANKR Repository Manager"
echo "=========================="
echo ""

# Define all repositories
declare -A repos=(
    # Core ANKR repositories
    # ["ankr-landing"]="git@github.com:rocketlang/ankr-landing.git"  # Lives in /var/www, not a git repo
    ["ankr-labs-nx"]="git@github.com:rocketlang/ankr-labs-nx.git"
    ["ankr-ai-gateway"]="git@github.com:rocketlang/ankr-ai-gateway.git"
    ["ankr-universe"]="git@github.com:rocketlang/ankr-universe.git"
    ["ankr-sandbox-repo"]="git@github.com:rocketlang/ankr-sandbox.git"
    ["ankr-skill-loader"]="git@github.com:rocketlang/ankr-skill-loader.git"
    
    # Projects
    ["ankrcode-project"]="git@github.com:rocketlang/ankrcode.git"
    ["openclaude-ide"]="git@github.com:rocketlang/openclaude-ide.git"
    ["bani-repo"]="git@github.com:rocketlang/bani.git"
    ["swayam"]="git@github.com:rocketlang/swayam.git"
    ["power-erp"]="git@github.com:rocketlang/power-erp.git"
    ["everpure-whatsapp-bot"]="git@github.com:rocketlang/everpure-whatsapp-bot.git"
    
    # Additional repos (if needed - uncomment to add)
    # ["ankr-mcp"]="git@github.com:rocketlang/ankr-mcp.git"
    # ["rocketlang"]="git@github.com:rocketlang/rocketlang.git"
)

# Function to clone or update a repository
update_repo() {
    local name=$1
    local url=$2
    local repo_path="$BASE_DIR/$name"
    
    if [ -d "$repo_path/.git" ]; then
        echo -e "${BLUE}📦 Updating: $name${NC}"
        cd "$repo_path"
        
        # Check for uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}   ⚠️  Has uncommitted changes - skipping pull${NC}"
            git status --short | head -5
        else
            # Get current branch
            branch=$(git branch --show-current)
            echo -e "   Branch: $branch"
            
            # Fetch updates
            git fetch origin &>/dev/null
            
            # Pull if possible
            if git rev-parse @{u} &>/dev/null; then
                echo -e "${GREEN}   ⬇️  Pulling updates...${NC}"
                git pull origin "$branch"
            else
                echo -e "${YELLOW}   ℹ️  No upstream branch${NC}"
            fi
        fi
    else
        echo -e "${BLUE}📥 Cloning: $name${NC}"
        cd "$BASE_DIR"
        git clone "$url" "$name"
        echo -e "${GREEN}   ✅ Cloned successfully${NC}"
    fi
    
    echo ""
}

# Main execution
echo "Processing repositories..."
echo ""

for repo_name in "${!repos[@]}"; do
    update_repo "$repo_name" "${repos[$repo_name]}"
done

echo -e "${GREEN}✅ Repository update complete!${NC}"
echo ""
echo "📊 Summary:"
cd "$BASE_DIR"
echo "Total repositories: ${#repos[@]}"
echo ""
echo "Repositories with uncommitted changes:"
for repo_name in "${!repos[@]}"; do
    if [ -d "$BASE_DIR/$repo_name/.git" ]; then
        cd "$BASE_DIR/$repo_name"
        if [ -n "$(git status --porcelain)" ]; then
            echo "  - $repo_name"
        fi
    fi
done
