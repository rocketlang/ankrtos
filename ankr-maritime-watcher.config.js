// PM2 config for ankr-maritime document watcher
module.exports = {
  apps: [{
    name: 'ankr-maritime-watcher',
    script: '/usr/bin/ankr-publish-watch',
    args: 'watch --dirs /root/apps/ankr-maritime --scan-existing',
    cwd: '/root',
    env: {
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
      VOYAGE_API_KEY: 'pa-IZUdnDHSHAErlmOHsI2w7EqwbIXBxLEtgiE2pB2zqLr',
      NODE_ENV: 'production',
    },
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: '/root/.pm2/logs/ankr-maritime-watcher-error.log',
    out_file: '/root/.pm2/logs/ankr-maritime-watcher-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
