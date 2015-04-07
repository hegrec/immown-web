var Api = require('immodispo-api-client'),
    env = require('./env'),
    Hapi = require('hapi'),
    server = new Hapi.Server({connections: {router: {stripTrailingSlash: true}}});
server.connection({ port: 3000 });

var plugins = [
    require('./plugins/nunjucks')
];

require('./app/router')(server);

server.register(plugins, function (err) {
    if (err) {
        console.error('Failed to load a plugin:', err);
    }
});

server.app.api = new Api(env.api.username, env.api.password);

server.start(function () {
    console.log('Server running at:', server.info.uri);
});