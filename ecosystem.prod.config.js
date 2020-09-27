require('dotenv').config();

module.exports = {
  apps : [{
    name: 'di.scord',
    script: 'dist/index.js',
    instances : 1,
    log_file: 'logs/app.log',
    env: {
      NODE_ENV: "production",
    }
  }]
};
