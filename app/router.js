var path = require('path');

module.exports = function(server) {


    server.route({
        method: 'GET',
        path: '/css/{filepath}',
        handler: {
            file: function (request, reply) {
                return path.join(__dirname, '../public/css/' + request.params.filepath);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/js/{filepath}',
        handler: {
            file: function (request, reply) {
                return path.join(__dirname, '../public/js/' + request.params.filepath);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/map',
        handler: function (request, reply) {
            reply.render("map.html");
        }
    });

};