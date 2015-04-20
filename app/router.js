var _ = require('lodash'),
    path = require('path'),
    async = require('async'),
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
        path: '/about',
        handler: function (request, reply) {
            var context = {
                seed_data: {
                    module: "about",
                    vars: {}
                }
            };
            context.seed_data = JSON.stringify(context.seed_data);

            reply.render("about.html", context);
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
                };

            if (term) {
                async.parallel([
                    function (cb) {
                        term = term.replace(/\s/g, '-');
                        var filterString = "filter=name=" + term;
                        request.server.app.api.get(env.API_HOST + "/departments?" + filterString, function (err, searchResults) {
                            cb(err, searchResults);
                        });
                    },
                    function (cb) {
                        term = term.replace(/-/g, ' ');
                        var filterString = "sort=-population&filter=name=" + term;
                        request.server.app.api.get(env.API_HOST + "/towns?" + filterString, function (err, searchResults) {
                            cb(err, searchResults);
                        });
                    }
                ], function (err, results) {
                    var searchResults = results[0],
                        found,
                        zoom = 9;

                    if (err) {
                        return reply("Server error 500. Please try again later").code(500)
                    }

                    //try department first, then go for town if not found
                    if (searchResults.body.length == 0) {
                        searchResults = results[1];
                        zoom = 12;
                    }

                    if (searchResults.body.length > 0) {
                        found = searchResults.body[0];

                        context.seed_data.vars.lat = found.latitude;
                        context.seed_data.vars.lng = found.longitude;
                        context.seed_data.vars.zoom = zoom;
                        context.search_term = found.name;
                        context.seed_data.vars.boundaries = found.kml;
                        context.seed_data.vars.town_name = found.name;
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
        path: '/map',
        handler: function (request, reply) {
            var term = request.payload.term;

            if (!term) {
                return reply.redirect('/map/');
            }

            async.parallel([
                function (cb) {
                    term = term.replace(/\s/g, '-');
                    var filterString = "filter=name~>" + term;
                    request.server.app.api.get(env.API_HOST + "/departments?" + filterString, function (err, searchResults) {
                        cb(err, searchResults);
                    });
                },
                function (cb) {
                    term = term.replace(/-/g, ' ');
                    var filterString = "sort=-population&filter=name~>" + term;
                    request.server.app.api.get(env.API_HOST + "/towns?" + filterString, function (err, searchResults) {
                        cb(err, searchResults);
                    });
                }
            ], function (err, results) {
                var searchResults = results[0],
                    found;

                //try department first, then go for town if not found
                if (searchResults.body.length == 0) {
                    searchResults = results[1];
                }

                if (err) {
                    return reply("Server error 500. Please try again later").code(500)
                } else if (searchResults.body.length > 0){
                    found = searchResults.body[0].name.toLowerCase().replace(/\s/g, '-');
                    reply.redirect('/map/' + found);
                } else {
                    reply.redirect('/map/');
                }
            });
        }
    });
    /*
    server.route({
        method: 'GET',
        path: '/agents',
        handler: function (request, reply) {
            var context = {};
            reply.render('agents.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/home-owners',
        handler: function (request, reply) {
            var context = {};
            reply.render('home-owners.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/list-a-home',
        handler: function (request, reply) {
            var context = {};
            reply.render('list-a-home.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/sign-up',
        handler: function (request, reply) {
            var context = {};
            reply.render('register.html', context);
        }
    });

    server.route({
        method: 'GET',
        path: '/sign-in',
        handler: function (request, reply) {
            var context = {};
            reply.render('login.html', context);
        }
    });
*/
    server.route({
        method: 'GET',
        path: '/listing/{id}',
        handler: function (request, reply) {
            var id = request.params.id;

            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/listings/" + id + "?include=ListingImage,ListingDetail,Town,Agency", function (err, listingResult) {

                if (err) {
                    return reply("Server error 500. Please try again later").code(500)
                }
                var context = {
                    listing: listingResult.body[0],
                    similars: [],
                    seed_data: {
                        module: "listing",
                        vars: {}
                    }
                };

                context.seed_data.vars.lat = listingResult.body[0].latitude;
                context.seed_data.vars.lng = listingResult.body[0].longitude;
                context.seed_data = JSON.stringify(context.seed_data);

                reply.render("listing.html", context);
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
        } else {
            filterString = filterString + '&filter=is_rental=0';
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

        if (Number(request.query['min_room'])) {
            filterString = filterString + '&filter=num_rooms>'+request.query['min_room'];
        }

        if (Number(request.query['max_room'])) {
            filterString = filterString + '&filter=num_rooms<'+request.query['max_room'];
        }

        if (request.query['search_a'] == 1
            || request.query['search_h'] == 1
            || request.query['search_t'] == 1
           ) {
            var typeIncludes = [];

            if (request.query['search_a'] == 1) {
                typeIncludes.push(2);
            }

            if (request.query['search_h'] == 1) {
                typeIncludes.push(1);
            }

            if (request.query['search_t'] == 1) {
                typeIncludes.push(3);
            }

            filterString = filterString + '&filter=construction_type|IN|' + typeIncludes.join(',');
        }

        return filterString;
    }

    server.route({
        method: 'GET',
        path: '/sidebar',
        handler: function (request, reply) {
            var numPerPage = 20,
                filterString = buildMapFilter(request),
                townTerm = request.query['town'],
                sortBy = request.query.sort,
                sortTerm = '-feature_score',
                currentPage = Number(request.query['page']) || 1;

            switch (sortBy) {
                case 'priceasc':
                    sortTerm = 'price';
                    break;
                case 'pricedesc':
                    sortTerm = '-price';
                    break;
                case 'sizeasc':
                    sortTerm = 'total_size';
                    break;
                case 'sizedesc':
                    sortTerm = '-total_size';
                    break;
            }

            var getSidebarListings = function() {
                //build a simple sidebar with all listings in the box
                request.server.app.api.get(env.API_HOST + "/listings?sort=" + sortTerm + "&limit=" + numPerPage
                    + "&start=" + (1+((currentPage-1)*numPerPage))
                    + "&include=ListingImage,Town&" + filterString, function (err, sidebarResults) {

                    if (err) {
                        return reply("Server error 500. Please try again later").code(500)
                    }

                    var context = {
                        listings: sidebarResults.body,
                        current_page: currentPage,
                        page_count: Math.ceil(sidebarResults.meta.total / numPerPage)
                    };
                    reply.render("partials/result-listing.html", context);

                });
            };

            if (townTerm) {
                townTerm = "sort=-population&filter=name~>" + townTerm.replace(/-/g, ' ');

                request.server.app.api.get(env.API_HOST + "/towns?" + townTerm, function (err, searchResults) {
                    var townIds = [];

                    if (err) {
                        return reply("Server error 500. Please try again later").code(500)
                    }

                    _.each(searchResults.body, function (twn) {
                        townIds.push(twn.id);
                    });

                    if (townIds.length > 0) {
                        filterString = filterString + '&filter=TownId|IN|' + townIds.join(',');
                    }

                    getSidebarListings();

                });
            } else {
                getSidebarListings();
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/icons',
        handler: function(request, reply) {
            var filterString = buildMapFilter(request),
                townTerm = request.query['town'],
                sortBy = request.query.sort,
                sortTerm = '-feature_score',
                output = {};

            switch (sortBy) {
                case 'priceasc':
                    sortTerm = 'price';
                    break;
                case 'pricedesc':
                    sortTerm = '-price';
                    break;
                case 'sizeasc':
                    sortTerm = 'total_size';
                    break;
                case 'sizedesc':
                    sortTerm = '-total_size';
                    break;
            }

            var getIconListings = function() {
                console.log(env.API_HOST + "/listings?sort=" + sortTerm + "&limit=1000&" + filterString);
                request.server.app.api.get(env.API_HOST + "/listings?sort=" + sortTerm + "&limit=1000&" + filterString, function (err, sidebarResults) {

                    if (err) {
                        reply("Server error 500. Please try again later").code(500)
                    }
                    var icons = [];

                    _.each(sidebarResults.body, function (listing) {

                        var iconData = {};
                        iconData.la = listing.latitude;
                        iconData.lo = listing.longitude;
                        iconData.id = listing.id;
                        iconData.r = listing.is_rental;
                        iconData.price = listing.price;
                        icons.push(iconData);
                    });


                    output.icons = icons;
                    output.has_more = sidebarResults.meta.total > icons.length;



                    reply(output);

                });
            };

            if (townTerm) {
                townTerm = "sort=-population&filter=name~>" + townTerm.replace(/-/g, ' ');

                request.server.app.api.get(env.API_HOST + "/towns?" + townTerm, function (err, searchResults) {

                    var townIds = [];

                    if (err) {
                        return reply("Server error 500. Please try again later").code(500);
                    }

                    _.each(searchResults.body, function (twn) {
                        townIds.push(twn.id);
                    });

                    if (townIds.length > 0) {
                        filterString = filterString + '&filter=TownId|IN|' + townIds.join(',');
                        output.town_name = searchResults.body[0].name;
                    }

                    getIconListings();

                });
            } else {
                getIconListings();
            }

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
                    return reply("Server error 500. Please try again later").code(500)
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
                    return reply("Server error 500. Please try again later").code(500)
                }
                reply(searchResults);

            });

        }
    });

    server.route({
        method: 'GET',
        path: '/agency_telephone/{id}',
        handler: function (request, reply) {
            var id = Number(request.params.id);

            //build a simple sidebar with all listings in the box
            request.server.app.api.get(env.API_HOST + "/agencies/" + id, function (err, searchResults) {

                if (err) {
                    return reply("Server error 500. Please try again later").code(500)
                }

                if (searchResults.body.length) {
                    return reply(searchResults.body[0].telephone);
                }

                reply(false);

            });

        }
    });
};