#!/bin/bash

# Generate index.html for each project directory

DOCS_ROOT="/root/ankr-universe-docs/project/documents"

for project_dir in "$DOCS_ROOT"/*/; do
    project=$(basename "$project_dir")
    index_file="$project_dir/index.html"
    
    # Skip if already has custom index
    if [[ "$project" == "pratham-telehub" ]] && [[ -f "$index_file" ]]; then
        echo "✓ Skipping $project (has custom index)"
        continue
    fi
    
    echo "📝 Generating index for $project..."
    
    cat > "$index_file" << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$project - Documents</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 40px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .back {
            display: inline-block;
            color: #888;
            text-decoration: none;
            margin-bottom: 30px;
        }
        .back:hover {
            color: #667eea;
        }
        .file-list {
            background: #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
        }
        .file-item {
            padding: 16px 24px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
        }
        .file-item:last-child {
            border-bottom: none;
        }
        .file-item:hover {
            background: #333;
        }
        .file-icon {
            font-size: 1.5em;
            margin-right: 16px;
        }
        .file-name {
            color: #667eea;
            text-decoration: none;
            flex: 1;
        }
        .file-name:hover {
            color: #8b9aff;
            text-decoration: underline;
        }
        .file-meta {
            color: #666;
            font-size: 0.85em;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="../" class="back">← Back to all projects</a>
        <h1>📁 $project</h1>
        <p style="color: #888; margin-bottom: 30px;">All documents in this project</p>
        
        <div class="file-list">
HTMLEOF
    
    # List all .md files
    find "$project_dir" -maxdepth 1 -name "*.md" -type f | sort | while read -r file; do
        filename=$(basename "$file")
        size=$(du -h "$file" | cut -f1)
        
        cat >> "$index_file" << HTMLEOF
            <div class="file-item">
                <div class="file-icon">📝</div>
                <a href="$filename" class="file-name">$filename</a>
                <div class="file-meta">$size</div>
            </div>
HTMLEOF
    done
    
    cat >> "$index_file" << 'HTMLEOF'
        </div>
    </div>
</body>
</html>
HTMLEOF
    
    echo "  ✅ Created $index_file"
done

echo ""
echo "✅ All directory indexes generated!"
