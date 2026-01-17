#!/bin/sh
# Runtime environment variable substitution for BFC Web
# Replaces __VITE_*__ placeholders with actual environment values

set -e

# Find all JS files and replace environment placeholders
for file in /usr/share/nginx/html/assets/*.js; do
    if [ -f "$file" ]; then
        # Replace API URL placeholder
        if [ -n "$VITE_API_URL" ]; then
            sed -i "s|__VITE_API_URL__|$VITE_API_URL|g" "$file"
        fi

        # Replace other environment variables as needed
        if [ -n "$VITE_APP_TITLE" ]; then
            sed -i "s|__VITE_APP_TITLE__|$VITE_APP_TITLE|g" "$file"
        fi
    fi
done

echo "Environment variables substituted"
