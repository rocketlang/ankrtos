#!/bin/bash
##############################################################################
# Automated Cloudflare Pages Setup via API
##############################################################################

set -e

ACCOUNT_ID="1c452912df3eea9e8f1a2a973ff337f5"
ZONE_ID="1c452912df3eea9e8f1a2a973ff337f5"
PROJECT_NAME="mari8x"
REPO_NAME="rocketlang/dodd-icd"
BRANCH="master"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

echo "════════════════════════════════════════════════════════════════════════"
echo "  🤖 AUTOMATED CLOUDFLARE PAGES SETUP"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check for API token
if [ -z "$API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set"
    echo ""
    echo "Please set your Cloudflare API token:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo ""
    echo "Or pass as argument:"
    echo "  $0 your-token-here"
    exit 1
fi

if [ -n "$1" ]; then
    API_TOKEN="$1"
fi

echo "✅ API Token provided"
echo "📋 Account ID: $ACCOUNT_ID"
echo "📦 Project: $PROJECT_NAME"
echo "📂 Repository: $REPO_NAME"
echo ""

# Function to call Cloudflare API
cf_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    if [ -z "$data" ]; then
        curl -s -X "$method" \
            "https://api.cloudflare.com/client/v4$endpoint" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" \
            "https://api.cloudflare.com/client/v4$endpoint" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1️⃣  CHECKING EXISTING PROJECT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

EXISTING=$(cf_api GET "/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME")
if echo "$EXISTING" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "⚠️  Project '$PROJECT_NAME' already exists"
    echo ""
    echo "Existing configuration:"
    echo "$EXISTING" | jq -r '.result | {name, production_branch, created_on}'
    echo ""
    echo "Do you want to update it? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    UPDATE_MODE=true
else
    echo "✅ No existing project found, will create new one"
    UPDATE_MODE=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2️⃣  CREATING/UPDATING PAGES PROJECT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create project configuration
PROJECT_CONFIG=$(cat <<EOF
{
  "name": "$PROJECT_NAME",
  "production_branch": "$BRANCH",
  "source": {
    "type": "github",
    "config": {
      "owner": "rocketlang",
      "repo_name": "dodd-icd",
      "production_branch": "$BRANCH",
      "pr_comments_enabled": true,
      "deployments_enabled": true,
      "production_deployments_enabled": true,
      "preview_deployment_setting": "all",
      "preview_branch_includes": ["*"],
      "preview_branch_excludes": []
    }
  },
  "build_config": {
    "build_command": "cd apps/ankr-maritime/frontend && npm install && npx vite build",
    "destination_dir": "apps/ankr-maritime/frontend/dist",
    "root_dir": "/",
    "web_analytics_tag": null,
    "web_analytics_token": null
  },
  "deployment_configs": {
    "production": {
      "environment_variables": {
        "NODE_VERSION": {
          "value": "20"
        }
      },
      "compatibility_flags": [],
      "compatibility_date": "2024-01-01"
    },
    "preview": {
      "environment_variables": {
        "NODE_VERSION": {
          "value": "20"
        }
      },
      "compatibility_flags": [],
      "compatibility_date": "2024-01-01"
    }
  }
}
EOF
)

if [ "$UPDATE_MODE" = true ]; then
    echo "Updating existing project..."
    RESULT=$(cf_api PATCH "/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME" "$PROJECT_CONFIG")
else
    echo "Creating new project..."
    RESULT=$(cf_api POST "/accounts/$ACCOUNT_ID/pages/projects" "$PROJECT_CONFIG")
fi

if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Project configured successfully"
    echo ""
    echo "Project details:"
    echo "$RESULT" | jq -r '.result | {name, production_branch, subdomain}'
else
    echo "❌ Failed to create/update project"
    echo ""
    echo "Error:"
    echo "$RESULT" | jq -r '.errors[]?.message // "Unknown error"'
    echo ""
    echo "Full response:"
    echo "$RESULT" | jq '.'
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3️⃣  CONFIGURING CUSTOM DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DOMAIN_CONFIG=$(cat <<EOF
{
  "name": "mari8x.com"
}
EOF
)

echo "Adding custom domain: mari8x.com"
DOMAIN_RESULT=$(cf_api POST "/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" "$DOMAIN_CONFIG")

if echo "$DOMAIN_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Custom domain added successfully"
    echo ""
    echo "Domain details:"
    echo "$DOMAIN_RESULT" | jq -r '.result | {name, status}'
else
    # Domain might already exist
    if echo "$DOMAIN_RESULT" | jq -r '.errors[]?.message' | grep -q "already exists"; then
        echo "⚠️  Domain already configured"
    else
        echo "⚠️  Could not add custom domain (you may need to add it manually)"
        echo "$DOMAIN_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4️⃣  TRIGGERING INITIAL DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Triggering deployment from GitHub..."
DEPLOY_RESULT=$(cf_api POST "/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" "{}")

if echo "$DEPLOY_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Deployment triggered"
    DEPLOY_ID=$(echo "$DEPLOY_RESULT" | jq -r '.result.id')
    echo "   Deployment ID: $DEPLOY_ID"
    echo ""
    echo "Watch progress at:"
    echo "https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/$DEPLOY_ID"
else
    echo "⚠️  Could not trigger automatic deployment"
    echo "   GitHub integration may need manual authorization"
    echo ""
    echo "Please visit:"
    echo "https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME"
    echo ""
    echo "And authorize GitHub access, then deployment will start automatically."
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ SETUP COMPLETE!"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "📦 Project: $PROJECT_NAME"
echo "🔗 Repository: $REPO_NAME"
echo "🌐 Domain: mari8x.com"
echo "🌿 Branch: $BRANCH"
echo ""
echo "Next steps:"
echo "  1. Authorize GitHub access (if prompted in dashboard)"
echo "  2. First deployment will start automatically"
echo "  3. Wait 2-3 minutes for build to complete"
echo "  4. Visit https://mari8x.com"
echo ""
echo "Future deployments:"
echo "  git push → Auto-deploy (no manual steps)"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
