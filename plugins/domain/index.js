var immodispo = require('./../../lib/api');
exports.register = function (server, options, next) {

    server.decorate('reply', 'models', function() {

        return immodispo.models();
    });

    next();
};

exports.register.attributes = {
    name: 'database',
    version: '1.0.0'
};