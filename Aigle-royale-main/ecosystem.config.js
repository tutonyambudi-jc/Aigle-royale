module.exports = {
  apps: [{
    name: 'aigle-royale',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './',
    instances: 2, // Utiliser 2 instances (cluster mode) - ajuster selon vos ressources
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    exp_backoff_restart_delay: 100,
    // Variables d'environnement additionnelles (optionnel)
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
