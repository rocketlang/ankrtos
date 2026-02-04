#!/bin/bash
set -e

# List available ANKR MCP tools

cat << 'EOF'
CATEGORY            TOOL                    PURPOSE
--------------------------------------------------------------------------------
Memory (EON)
                    eon_remember            Store information in knowledge graph
                    eon_recall              Retrieve stored information
                    eon_forget              Remove information
                    eon_search              Search across memories
                    eon_relate              Create relationships between entities

Validation
                    gst_validate            Validate GST numbers
                    pan_validate            Validate PAN numbers
                    ifsc_validate           Validate IFSC codes
                    iec_validate            Validate IEC codes

Shipment
                    shipment_track          Track shipment status
                    shipment_create         Create new shipment
                    shipment_update         Update shipment details
                    container_track         Track container

Port Operations
                    ankr_get_port           Get service port
                    ankr_get_url            Get service URL
                    ankr_health_check       Check service health

Database
                    db_query                Execute read query
                    db_execute              Execute write query
                    db_transaction          Execute in transaction

AI Proxy
                    ai_complete             Get LLM completion
                    ai_embed                Generate embeddings
                    ai_analyze              Analyze content

GPT Delegation
                    codex                   Delegate to GPT expert

Total: 260+ tools available
EOF
