require('dotenv').config();

module.exports = {
  apps : [{
    name: 'di.scord',
    script: 'src/index.ts',
    instances : 1,
    watch: 'src',
    log_file: 'logs/app.log',
    error_file: 'logs/app-err.log',
    out_file: 'logs/app-out.log',
    env: {
      NODE_ENV: "development",
    }
  }],

  deploy : {
    production : {
      user : process.env.DEPLOY_USER,
      host : process.env.DEPLOY_HOST,
      ref  : process.env.DEPLOY_BRANCH || 'origin/master',
      repo : process.env.DEPLOY_GIT || 'git@github.com:Zaklinatel/di.scord.git',
      path : process.env.DEPLOY_PATH,
      'post-setup': 'touch ../shared/.env; ln -s ../shared/.env .',
      'post-deploy' : 'npm i --production; npm run start-prod'
    }
  }
};
