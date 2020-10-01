require('dotenv').config();

module.exports = {
  apps : [{
    name: 'di.scord',
    script: 'dist/index.js',
    instances : 1,
    error_file: 'logs/app-err.log',
    out_file: 'logs/app-out.log',
    env: {
      NODE_ENV: "production",
    }
  }]
};
