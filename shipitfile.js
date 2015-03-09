

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/immodispo-web',
            deployTo: '/opt/immodispo-web',
            repositoryUrl: 'https://github.com/hegrec/immodispo-web.git',
            ignores: ['.git', 'node_modules'],
            keepReleases: 3
        },
        staging: {
            servers: 'webuser@caketoast.com'
        },
        production: {
            servers: 'webuser@mealtrap.com'
        }
    });

    shipit.on('published', function() {
        shipit.remote('cd /opt/immodispo-web/current && npm install').then(function(res) {
            shipit.log(res);
            shipit.remote('cp /home/webuser/env.js /opt/immodispo-web/current').then(function(res) {
                shipit.log(res);
                shipit.remote('pm2 restart all').then(function(res) {
                    shipit.log(res);
                });
            });
        });
    })
};