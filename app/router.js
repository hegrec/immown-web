var _ = require('lodash'),
    path = require('path'),
    env = require('../env');

module.exports = function(server) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.render("landing.html");
        }
    });

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
        path: '/map/{params*}',
        handler: function (request, reply) {

            var term = request.params.params,
                context = {
                    seed_data: {
                        module: "map",
                        vars: request.query
                    }
                },
                filterString;

            if (term) {
                term = term.replace('-', ' ');
                filterString = "sort=-population&filter=name=" + term;
                //build a simple sidebar with all listings in the box
                request.server.app.api.get(env.API_HOST + "/towns?" + filterString, function (err, searchResults) {
                    var foundTown;

                    if (searchResults.body.length > 0) {
                        foundTown = searchResults.body[0];
                        console.log(foundTown);

                        context.seed_data.vars.lat = foundTown.latitude;
                        context.seed_data.vars.lng = foundTown.longitude;
                        context.seed_data.vars.zoom = 12;
                    }

                    context.seed_data = JSON.stringify(context.seed_data);

                    reply.render("map.html", context);

                });
            } else {
                context.seed_data = JSON.stringify(context.seed_data);
                reply.render("map.html", context);
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/map/',
        handler: function (request, reply) {
            var term = request.payload.term,
                filterString = "sort=-population&filter=name~>" + term;

            if (!term) {
                return reply.redirect('/map/');
            }
            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/towns?" + filterString, function (err, searchResults) {
                var foundTown;

                if (err) {
                    reply(err);
                } else if (searchResults.body.length > 0){
                    foundTown = searchResults.body[0].name.toLowerCase().replace(/\s/g, '-');
                    reply.redirect('/map/' + foundTown);
                } else {
                    reply.redirect('/map/');
                }
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/agents/',
        handler: function (request, reply) {
            var context = {};
            reply.render('agents.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/home-owners/',
        handler: function (request, reply) {
            var context = {};
            reply.render('home-owners.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/list-a-home/',
        handler: function (request, reply) {
            var context = {};
            reply.render('list-a-home.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/sign-up/',
        handler: function (request, reply) {
            var context = {};
            reply.render('register.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/sign-in/',
        handler: function (request, reply) {
            var context = {};
            reply.render('login.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/listing/{id}',
        handler: function (request, reply) {
            var id = request.params.id;

            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/listings/" + id + "?include=ListingImage,ListingDetail,Town,Agency", function (err, listingResult) {

                if (err) {
                    reply(err);
                }
                var context = {
                    listing: listingResult.body[0],
                    similars: [],
                    seed_data: JSON.stringify({
                        module: "listing",
                        vars: request.query
                    })
                };

                console.log(context.listing);
                reply.render("listing.html", context);
                //reply(context);
            });
        }
    });

    function buildMapFilter(request) {
        var ls = request.query['lat_south'],
            ln = request.query['lat_north'],
            lw = request.query['lng_west'],
            le = request.query['lng_east'],

            filterString = "&filter=latitude>" + ls
                + "&filter=latitude<" + ln
                + "&filter=longitude>" + lw
                + "&filter=longitude<" + le;

        if (request.query['rental']) {
            filterString = filterString + '&filter=is_rental=1';
        }

        if (Number(request.query['min_price'])) {
            filterString = filterString + '&filter=price>'+request.query['min_price'];
        }

        if (Number(request.query['max_price'])) {
            filterString = filterString + '&filter=price<'+request.query['max_price'];
        }

        if (Number(request.query['min_size'])) {
            filterString = filterString + '&filter=total_size>'+request.query['min_size'];
        }

        if (Number(request.query['max_size'])) {
            filterString = filterString + '&filter=total_size<'+request.query['max_size'];
        }

        return filterString;
    }

    server.route({
        method: 'GET',
        path: '/sidebar',
        handler: function (request, reply) {
            var numPerPage = 20,
                filterString = buildMapFilter(request),
                currentPage = Number(request.query['page']) || 1;

            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/listings?sort=-feature_score&limit=" + numPerPage
                + "&start=" + (1+((currentPage-1)*numPerPage))
                + "&include=ListingImage,Town&" + filterString, function (err, sidebarResults) {

                if (err) {
                    return reply(err).code(500);
                }

                var context = {
                    listings: sidebarResults.body,
                    current_page: currentPage,
                    page_count: Math.ceil(sidebarResults.meta.total / numPerPage)
                };
                reply.render("partials/result-listing.html", context);

            });

        }
    });

    server.route({
        method: 'GET',
        path: '/overview',
        handler: function (request, reply) {
            var listingId = request.query['id'];
            //build a simple sidebar with all listings in the box

            request.server.app.api.get(env.API_HOST + "/listings/" + listingId + "?include=ListingImage,Town", function (err, overviewListing) {

                if (err) {
                    callback(err);
                }
                var context = {
                    listing: overviewListing.body[0]
                };
                reply.render("partials/overview.html", context);

            });

        }
    });

    server.route({
        method: 'GET',
        path: '/towns',
        handler: function (request, reply) {

            var term = request.query['term'],
                filterString = "sort=-population&filter=name~>" + term;

            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/towns?" + filterString, function (err, searchResults) {

                if (err) {
                    callback(err);
                }
                reply(searchResults);

            });

        }
    });

    server.route({
        method: 'GET',
        path: '/icons',
        handler: function(request, reply) {
            var filterString = buildMapFilter(request);

            request.server.app.api.get(env.API_HOST + "/listings?sort=-feature_score&limit=1000&" + filterString, function (err, sidebarResults) {

                if (err) {
                    reply(err);
                }
                var icons = [];

                _.each(sidebarResults.body, function(listing) {

                    var iconData = {};
                    iconData.la = listing.latitude;
                    iconData.lo = listing.longitude;
                    iconData.id = listing.id;
                    iconData.price = listing.price;
                    icons.push(iconData);
                });

                var output = {
                    icons: icons,
                    total: sidebarResults.meta.total
                };
                reply(output);

            });

        }
    })
};