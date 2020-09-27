require('dotenv').config();

module.exports = {
  apps : [{
    name: 'di.scord',
    script: 'src/index.ts',
    instances : 1,
    watch: 'src',
    log_file: 'logs/app.log',
    env: {
      NODE_ENV: "development",
    }
  }],

  deploy : {
    production : {
      user : process.env.DEPLOY_USER,
      host : process.env.DEPLOY_HOST,
      ref  : process.env.DEPLOY_BRANCH || 'master',
      repo : process.env.DEPLOY_GIT || 'git@github.com:Zaklinatel/di.scord.git',
      path : process.env.DEPLOY_PATH,
      'post-deploy' : 'npm i --production; tsc & pm2 restart ecosystem.prod.config.js',

    }
  }
};
