module.exports = {
  apps : [{
    script: 'npm start',
    watch: '.'
  }],
  deploy : {
    production : {
      user : 'ratakorn',
      host : '10.252.93.208',
      ref  : 'origin/deploy',
      repo : 'git@github.com-jrm-personal:deeptech-kmitl/e-logbook-web-application.git',
      path : '/home/ratakorn',
      'pre-deploy-local': '',
      'post-deploy' : 'source ~/.nvm/nvm.sh && npm install --force && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes',
    }
  }
};
