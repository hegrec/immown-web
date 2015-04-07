var _ = require('lodash');
    MapIcon = require('./../map/helper/MapIcon'),
    formatters = require('./../util/formatters');

function ImmoListing(application) {

    var self = this,
        defaultLat = 47,
        defaultLng = 2,
        defaultZoom = 7;




    this.application = application;

    this.swiper = new Swiper('.swiper-container', {
        nextButton: '.swiper-button-next',

        prevButton: '.swiper-button-prev',
        pagination: '.swiper-pagination',
        paginationClickable: true,
        // Disable preloading of all images
        preloadImages: false,
        // Enable lazy loading
        lazyLoading: true,
        lazyLoadingInPrevNext: true
    });


    if (this.application.moduleVars.lat) {
        defaultLat = this.application.moduleVars.lat;
    }

    if (this.application.moduleVars.lng) {
        defaultLng = this.application.moduleVars.lng;
    }

    this.map = new google.maps.Map(document.getElementById('map-canvas'),
        {
            zoom: 12,
            disableDefaultUI: true,
            minZoom: 10,
            scaleControl: true,
            center: new google.maps.LatLng(defaultLat, defaultLng),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
    );

    var options = {
        latitude: defaultLat,
        longitude: defaultLng,
        image: '/img/icon.png',
        referenceObject: {}
    };

    var icon =  new MapIcon(options);
    icon.getGoogleMapsIcon(self.map);


    $('#telephone_form').on('submit', function(evt) {
        var agencyId = $(this).find('input[name="agency_id"]').val();

        $.ajax({
            url: '/agency_telephone/' + agencyId,
            success: function(telephone) {


                $('#telephone_form').remove();
                $('.telephone-container').html('<strong><a href="tel:' + telephone + '">' + telephone + '</a></strong>');
            }

        });
       return false;
    });
}

module.exports = ImmoListing;