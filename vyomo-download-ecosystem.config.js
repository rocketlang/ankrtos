module.exports = {
  apps: [{
    name: 'vyomo-download',
    script: '/root/vyomo-download-api.js',
    interpreter: 'bun',
    env: {
      NODE_ENV: 'production',
      PORT: '4447',
      BASE_URL: 'https://vyomo.in'
    },
    env_file: '/root/vyomo-download-api.env'
  }]
}
