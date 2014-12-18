var api = require('immodispo-api-client');
var API_HOST = "http://192.168.33.10:3001";
var listings_to_save = 500;
var latitudeBounds = [43.797863, 49.906576];
var longitudeBounds = [-0.812988, 5.734863];
var index = 0;
var _ = require('lodash');
var construction_types = ['apartment','home','land'];
var fs = require('fs');
var async = require('async');
var path = require('path');
var dummyImages = [];
var imagesDirectory = path.join(__dirname, 'images');

//yay for google (and mozilla)
//http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function generateListings(agencyId) {

    fs.readdir(imagesDirectory, function(err, files) {
        dummyImages = files;
        var rangeArray = _.range(listings_to_save);
        var generationFuncs = [];
        _.each(rangeArray, function(index) {
            var generationFunc = function(callback) {
            var newListing = {
                price: 50000+Math.floor(Math.random()*1000000),
                description: "This is the description of a listing",
                num_rooms: Math.ceil(Math.random()*10),
                num_bathrooms: Math.ceil(Math.random()*10),
                num_bedrooms: Math.ceil(Math.random()*10),
                num_toilets: Math.ceil(Math.random()*10),
                num_floors: Math.ceil(Math.random()*4),
                num_parking: Math.ceil(Math.random()*10),
                construction_type: Math.floor(Math.random()*3),
                listing_url: "http://www.fakenonexistentdomain.awesome/listings/"+Math.floor(Math.random()*100000)+"/"+Math.floor(Math.random()*100000),
                latitude: getRandomArbitrary(latitudeBounds[0],latitudeBounds[1]),
                longitude: getRandomArbitrary(longitudeBounds[0],longitudeBounds[1]),
                energy_rating: Math.ceil(Math.random()*500),
                carbon_rating: Math.ceil(Math.random()*500),
                basement_size: Math.random()*100,
                attic_size: Math.random()*100,
                land_size: Math.random()*10000,
                interior_size: Math.random()*8000,
                total_size: Math.random()*100000,
                has_garden: 0.5+Math.floor(Math.random()),
                has_pool: 0.1+Math.floor(Math.random()),
                has_kitchen: 0.9+Math.floor(Math.random()),
                year_built: 1800+Math.floor(Math.random()*214),
                is_rental: 0.5+Math.floor(Math.random()),
                in_subdivision: 0.5+Math.floor(Math.random()),
                AgencyId: agencyId,
                TownId: 1+Math.floor(Math.random()*36000)
            };

            var numImagesToGive = 5;
            var functionList = [];
            for (var i=0;i<numImagesToGive;i++) {
                var func = function(callback) {
                    var imageFileToUse = dummyImages[Math.floor(Math.random()*dummyImages.length)];

                    fs.readFile(imagesDirectory+'/'+imageFileToUse, function(err, data) {
                        if (err) {
                            return callback(err);
                        } else {
                            var imageData = {
                                extension: path.extname(imageFileToUse),
                                buffer: data.toString('base64')
                            };

                            return callback(null, imageData);
                        }
                    });
                };
                functionList.push(func);
            }

            async.parallel(functionList, function(err, results) {

                if (err) throw err;

                newListing.images = results; //binary image data to be uploaded

                    console.log("POSTing listing to API");
                    api.post(API_HOST + "/listings", newListing, function (err, savedListing) {

                        if (err) {
                            callback(err);
                        }

                        callback(null, savedListing);

                    });

            });
            };

            generationFuncs.push(generationFunc);
        });
        async.series(generationFuncs, function(err, results) {

            if (err) throw err;

            console.log("Generated and saved "+results.length+" listings");

        });
    });
}

fs.readFile(__dirname + '/agency.jpg', function(err, data) {
    if (err) throw err;

    var newAgency = {
        name: "Awesomesauce Agency",
        address_1: Math.ceil(Math.random() * 10000) + ' Fake Street',
        address_2: 'Unit ' + Math.ceil(Math.random() * 999),
        telephone: '5555555555',
        email: 'agency@fakenonexistentdomain.awesome',
        website: 'fakenonexistentdomain.awesome',
        TownId: 1 + Math.floor(Math.random() * 36000),
        image: {
            extension: '.jpg',
            buffer: data.toString('base64')
        }
    };

    //console.log(newAgency);

    api.post(API_HOST + "/agencies", newAgency, function (err, savedAgency) {

        if (err) {
            throw new Error(err);
        }

        console.log(savedAgency);
        generateListings(Number(savedAgency.id));

    });
});