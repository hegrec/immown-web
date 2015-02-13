var _ = require('lodash'),
    path = require('path'),
    api = require('immodispo-api-client'),
    env = require('../env');

module.exports = function(server) {


    server.route({
        method: 'GET',
        path: '/css/{filepath*}',
        handler: {
            file: function (request, reply) {
                return path.join(__dirname, './../public/css/' + request.params.filepath);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/img/{filepath*}',
        handler: {
            file: function (request, reply) {
                return path.join(__dirname, './../public/img/' + request.params.filepath);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/js/{filepath*}',
        handler: {
            file: function (request, reply) {
                return path.join(__dirname, './../public/js/' + request.params.filepath);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.render("map.html");
        }
    });


    server.route({
        method: 'GET',
        path: '/sidebar',
        handler: function (request, reply) {

            var ls = request.query['lat_south'],
                ln = request.query['lat_north'],
                lw = request.query['lng_west'],
                le = request.query['lng_east'],

                filterString = "sort=-price&limit=9999999&filter=latitude>" + ls
                    + ",latitude<" + ln
                    + ",longitude>" + lw
                    + ",longitude<" + le;

            //build a simple sidebar with all listings in the box
            api.get(env.API_HOST + "/listings?" + filterString, function (err, sidebarResults) {

                if (err) {
                    callback(err);
                }
                var context = {
                    listings: sidebarResults.body
                };
                reply.render("partials/result-listing.html", context);

            });

        }
    });

    server.route({
        method: 'GET',
        path: '/icons',
        handler: function(request, reply) {
            var ls = request.query['lat_south'],
                ln = request.query['lat_north'],
                lw = request.query['lng_west'],
                le = request.query['lng_east'],

                filterString = "sort=-price&limit=9999999&filter=latitude>" + ls
                + ",latitude<" + ln
                + ",longitude>" + lw
                + ",longitude<" + le;

            api.get(env.API_HOST + "/listings?" + filterString, function (err, sidebarResults) {

                if (err) {
                    reply(err);
                }
                var output = [];

                _.each(sidebarResults.body, function(listing) {

                    var iconData = {};
                    iconData.la = listing.latitude;
                    iconData.lo = listing.longitude;
                    iconData.id = listing.id;
                    iconData.price = listing.price;
                    output.push(iconData);
                });
                reply(output);

            });

        }
    })
};