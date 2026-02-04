---
name: ankr-db
description: ANKR database operations for PostgreSQL. Use for querying, data analysis, and database management. Triggers on "database", "query", "SQL", "PostgreSQL", "data".
metadata:
  author: ankr
  version: "1.0.0"
---

# ANKR Database

PostgreSQL database operations for the ANKR ecosystem.

## Connection Info

- **Host**: localhost
- **Port**: 5432
- **User**: ankr
- **Password**: indrA@0612
- **Database**: ankr_eon

## Usage

### Read Queries
```bash
# Execute SELECT query
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM users LIMIT 10"

# Query with parameters
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM orders WHERE user_id = $1" "123"

# Export to CSV
bash /mnt/skills/user/ankr-db/scripts/query.sh "SELECT * FROM products" --format csv > products.csv
```

### Write Queries
```bash
# Execute INSERT/UPDATE/DELETE
bash /mnt/skills/user/ankr-db/scripts/execute.sh "UPDATE users SET status = 'active' WHERE id = $1" "123"

# Execute in transaction
bash /mnt/skills/user/ankr-db/scripts/transaction.sh << 'EOF'
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
EOF
```

### Schema Operations
```bash
# List tables
bash /mnt/skills/user/ankr-db/scripts/schema.sh tables

# Describe table
bash /mnt/skills/user/ankr-db/scripts/schema.sh describe users

# List indexes
bash /mnt/skills/user/ankr-db/scripts/schema.sh indexes users
```

## MCP Tools

```typescript
// Read query
await mcp__db__query({
  sql: "SELECT * FROM users WHERE status = $1",
  params: ["active"],
  limit: 100
});

// Write query
await mcp__db__execute({
  sql: "UPDATE users SET last_login = NOW() WHERE id = $1",
  params: ["123"]
});

// Transaction
await mcp__db__transaction({
  queries: [
    { sql: "UPDATE accounts SET balance = balance - $1 WHERE id = $2", params: [100, 1] },
    { sql: "UPDATE accounts SET balance = balance + $1 WHERE id = $2", params: [100, 2] }
  ]
});
```

## Common Queries

### User Operations
```sql
-- Get user by ID
SELECT * FROM users WHERE id = $1;

-- Get active users
SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC;

-- Count users by status
SELECT status, COUNT(*) FROM users GROUP BY status;
```

### Order Operations
```sql
-- Get recent orders
SELECT o.*, u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 20;

-- Orders by date range
SELECT * FROM orders
WHERE created_at BETWEEN $1 AND $2;
```

### Analytics
```sql
-- Daily order count
SELECT DATE(created_at) as date, COUNT(*) as orders
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Security

1. **Use parameterized queries** - Never concatenate user input
2. **Limit permissions** - Use read-only connections when possible
3. **Audit sensitive queries** - Log access to PII
4. **Validate input** - Sanitize before querying

## Best Practices

1. **Index frequently queried columns**
2. **Use EXPLAIN ANALYZE for slow queries**
3. **Batch large operations**
4. **Use connection pooling**
5. **Handle NULL values explicitly**
