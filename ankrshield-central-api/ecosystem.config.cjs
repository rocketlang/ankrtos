module.exports = {
  apps: [{
    name: 'ankrshield-central-api',
    script: 'tsx',
    args: 'src/server.ts',
    cwd: '/root/ankrshield-central-api',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '4260',
      LOG_LEVEL: 'info',
    },
    error_file: '/root/.pm2/logs/ankrshield-central-api-error.log',
    out_file: '/root/.pm2/logs/ankrshield-central-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
