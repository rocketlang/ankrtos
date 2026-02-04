/**
 * ANKR Master PM2 Ecosystem Configuration
 * ========================================
 * 
 * Usage:
 *   pm2 start /root/ecosystem.config.js          # Start all services
 *   pm2 stop all                                  # Stop all
 *   pm2 restart all                               # Restart all
 *   pm2 delete all && pm2 start /root/ecosystem.config.js  # Fresh start
 */

const { SERVICES } = require('./ankr-services.config.js');

const apps = [];

Object.entries(SERVICES).forEach(([name, config]) => {
  if (config.disabled) return;
  
  // Special handling for cluster mode (compiled JS)
  if (config.cluster) {
    apps.push({
      name,
      script: config.command.split(' ').pop(), // Get the JS file path
      cwd: config.path,
      instances: config.instances || 2,
      exec_mode: 'cluster',
      max_memory_restart: config.maxMemory || '1G',
      env: {
        NODE_ENV: 'production',
        PORT: config.port,
        ...config.env,
      },
      error_file: `/var/log/pm2/${name}-error.log`,
      out_file: `/var/log/pm2/${name}-out.log`,
      merge_logs: true,
      time: true,
      autorestart: true,
      watch: false,
    });
  } else {
    // Fork mode with bash wrapper for tsx/vite commands
    const envExports = Object.entries({ PORT: config.port, ...config.env })
      .map(([k, v]) => `export ${k}='${v}'`)
      .join(' && ');
    
    apps.push({
      name,
      script: '/bin/bash',
      args: `-c "cd ${config.path} && ${envExports} && ${config.command}"`,
      cwd: config.path,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: config.maxMemory || '500M',
      env: {
        NODE_ENV: 'production',
        PORT: config.port,
        ...config.env,
      },
      error_file: `/var/log/pm2/${name}-error.log`,
      out_file: `/var/log/pm2/${name}-out.log`,
      merge_logs: true,
      time: true,
      autorestart: true,
      watch: false,
    });
  }
});

module.exports = { apps };
