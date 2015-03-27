var _ = require('lodash'),
    MapIcon = require('./helper/MapIcon'),
    formatters = require('./../util/formatters');

function ImmoMap(application) {
    var self = this;

    this.application = application;
    this.map = null;
    this.iconInfoWindow = null;
    this.mapLoaded = false;
    this.rentalMode = false;
    this.currentPage = 1;
    this.mobileFilterOpen = false;
    this.markerLookup = {};
    this.createGoogleMap('map-canvas');
    this.setupFilterForm();


    $('.map-list .list').on('click', function(evt, target) {

        $(this).addClass('active');
        $('.map-list .map').removeClass('active');

        $('#map-holder').css('display', 'none');
        $('#map-sidebar').css('display', 'block');
    });

    $('.map-list .map').on('click', function(evt, target) {

        $(this).addClass('active');
        $('.map-list .list').removeClass('active');

        $('#map-holder').css('display', 'block');
        $('#map-sidebar').css('display', 'none');
    });

    $('.filter_btn').click(function()
    {
        if (self.mobileFilterOpen == false)
        {
            $(".menu_mobile_app.filter-form").addClass('open');
            $('#grey_back').addClass('open');

            setTimeout(function() {$(".menu_mobile_app.filter-form input[type='text']:first").focus();}, 250);
            self.mobileFilterOpen = true;
        }
    });

    $('.js-filter-form button[type="submit"]').click(function()
    {
        if (self.mobileFilterOpen == true)
        {
            $(".menu_mobile_app.filter-form").removeClass('open');
            $('.js-filter-form input').blur();
            $('#grey_back').removeClass('open');
            self.mobileFilterOpen = false;
        }
    });

    $('#grey_back').click(function()
    {
        if (self.mobileFilterOpen == true)
        {
            $(".menu_mobile_app.filter-form").removeClass('open');
            $('#grey_back').removeClass('open');
            self.mobileFilterOpen = false;
        }
    });
}

ImmoMap.prototype.renderBoundaries = function (doc) {
    console.log(doc[0]);
    _.each(doc[0].placemarks, function(placemark) {
        var opt = {
            fillColor: '#00ff00',
            fillOpacity: 0.2
        },
        arr = placemark.polygon.getPath(),
        bounds = new google.maps.LatLngBounds(),
        ndx;

        for (ndx = 0; ndx < arr.length; ndx++) {
            var v = arr.getAt(ndx);
            console.log(v);
            var latlong = new google.maps.LatLng(v.lat(), v.lng());
            bounds.extend(latlong);
        }

        console.log(opt);

        placemark.polygon.bounds = bounds;
        placemark.polygon.setOptions(opt);
    });
};

ImmoMap.prototype.buildMapURL = function buildMapURL() {
    var url = '?';
    var mapLat = this.map.getCenter().lat() + '';
    var mapLng = this.map.getCenter().lng() + '';
    mapLat = mapLat.substring(0, 6);
    mapLng = mapLng.substring(0, 6);
    url += 'lat=' + mapLat + '&lng=' + mapLng + "&zoom=" + this.map.getZoom();
    if (this.rentalMode) {
        url += '&rent=1';
    }

    if ($('input[name="minprice"]').val()) {
        url += "&min-price=" + $('input[name="minprice"]').val();
    }

    if ($('input[name="maxprice"]').val()) {
        url += "&max-price=" + $('input[name="maxprice"]').val();
    }

    if ($('input[name="minsize"]').val()) {
        url += "&min-size=" + $('input[name="minsize"]').val();
    }

    if ($('input[name="maxsize"]').val()) {
        url += "&max-size=" + $('input[name="maxsize"]').val();
    }

    return "/map/" + url;
};

ImmoMap.prototype.updateMapURL = function updateMapURL() {
    var self = this;
    History.replaceState({}, "ImmoDispo", self.buildMapURL());
};

ImmoMap.prototype.setupFilterForm = function setupFilterForm() {
    var self = this;

    $(".js-filter-form").on('submit', function(evt) {

        self.clearMarkers();
        self.loadMapIcons();

        self.updateMapURL();
        return false;
    });

    var url = location.search.substr(1);
    var params = url.split('&');
    var paramKeys = {};
    _.each(params, function(param) {
        var split = param.split('=');
        paramKeys[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    });

    if (paramKeys['min-price']) {
        $('input[name="minprice"]').val(paramKeys['min-price']);
    }

    if (paramKeys['max-price']) {
        $('input[name="maxprice"]').val(paramKeys['max-price']);
    }

    if (paramKeys['min-size']) {
        $('input[name="minsize"]').val(paramKeys['min-size']);
    }

    if (paramKeys['max-size']) {
        $('input[name="maxsize"]').val(paramKeys['max-size']);
    }

    $(".filter-purchase-rent").on('click', function () {
        if ($(this).attr("id") == 'filter-rent') {
            self.rentalMode = true;
            $('#filter-purchase').addClass('secondary');
        } else {
            self.rentalMode = false;
            $('#filter-rent').addClass('secondary');
        }

        $(this).removeClass('secondary');

        self.clearMarkers();
        self.loadMapIcons();
        self.updateMapURL();
    });
};

ImmoMap.prototype.createGoogleMap = function createMap(canvasId) {
    var self = this,
        defaultLat = 47,
        defaultLng = 2,
        defaultZoom = 7;

    if (this.application.moduleVars.lat) {
        defaultLat = this.application.moduleVars.lat;
    }

    if (this.application.moduleVars.lng) {
        defaultLng = this.application.moduleVars.lng;
    }

    if (this.application.moduleVars.zoom) {
        defaultZoom = Number(this.application.moduleVars.zoom);
    }

    this.mapLoaded = false;

    this.iconInfoWindow = new google.maps.InfoWindow({
        content: "Loading Info..."
    });

    this.map = new google.maps.Map(document.getElementById(canvasId),
        {
            zoom: defaultZoom,
            disableDefaultUI: true,
            minZoom: 6,
            center: new google.maps.LatLng(defaultLat, defaultLng),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
    );

    this.geoParser = new geoXML3.parser({
        map: self.map,
        suppressInfoWindows: true,
        zoom: false,
        afterParse: function(doc) { self.renderBoundaries(doc) }
    });

    google.maps.event.addListenerOnce(this.map, 'idle', function () {
        var boundaries = '';
        self.mapLoaded = true;
        self.loadMapIcons();

        if (self.application.moduleVars.boundaries) {
            boundaries = '<kml><Placemark><name>a big test</name><description>test</description>'
            + self.application.moduleVars.boundaries
            +'</Placemark></kml>';

            console.log(boundaries);
            self.geoParser.parseKmlString(boundaries);
        }
    });


    google.maps.event.addListener(self.map, 'zoom_changed', function () {
        self.loadMapIcons();
        self.updateMapURL();
    });

    google.maps.event.addListener(self.map, 'dragend', function () {
        window.setTimeout(function() {
            self.loadMapIcons();
        }, 150);

        self.updateMapURL();
    });
};

ImmoMap.prototype.clearMarkers = function clearMarkers() {

    _.each(this.markers, function(marker) {
        marker.getMarker().setMap(null);
    });

    this.markers = [];
    this.markerLookup = {};
};

ImmoMap.prototype.clearMarkersOffScreen = function clearMarkersOffScreen() {
    var newMarkers = [],
        self = this;
        bounds = this.map.getBounds(),
        lng_east = bounds.getNorthEast().lng(),
        lat_north = bounds.getNorthEast().lat(),
        lat_south = bounds.getSouthWest().lat(),
        lng_west = bounds.getSouthWest().lng();

    _.each(this.markers, function(marker) {
        var mapMarker = marker.getMarker(),
            latlng = mapMarker.getPosition();

        if (latlng.lng()>lng_east || latlng.lng()<lng_west ||
            latlng.lat()>lat_north || latlng.lat()<lat_south)
        {
            mapMarker.setMap(null);
            delete self.markerLookup[marker.getId()];
        } else {
            newMarkers.push(marker);
        }
    });

    this.markers = newMarkers;
};

ImmoMap.prototype.loadMapIcons = function() {
    var self = this;
    if (!this.mapLoaded) return;
    self.currentPage = 1;
    self.loadPaginatedWidget();

    var extraString = self.buildQueryString();
    $.ajax({
        url: "/icons?" + extraString,
        dataType: "json",
        success: function (serverIcons) {
            self.clearMarkersOffScreen();
            var iconCache = {},
                count = 0;
            _.each(serverIcons.icons, function(serverIcon) {
                var mapMarker = self.buildMapIcon(serverIcon),
                    googleMarker,
                    hash = mapMarker.getLat() + ':' + mapMarker.getLng();


                if (!self.mapIconExists(mapMarker) && !iconCache[hash]) {
                    googleMarker = mapMarker.getGoogleMapsIcon(self.map);

                    google.maps.event.addListener(googleMarker, "click", function (e) {
                        self.loadListingOverviewToInfoWindow(mapMarker.getId())
                    });
                    self.markerLookup[mapMarker.getId()] = mapMarker;
                    iconCache[hash] = mapMarker;
                    self.markers.push(mapMarker);
                    count++;
                }

            });

            console.log(count, serverIcons.icons.length);

            var text = serverIcons.icons.length + ' results';
            if (serverIcons.has_more) {
                text = serverIcons.icons.length + '+ results';
            }

            $('.js-result-count').text(text);
        }
    });
};

ImmoMap.prototype.mapIconExists = function mapIconExists(mapIcon) {
    return this.markerLookup[mapIcon.getId()];
}

ImmoMap.prototype.buildMapIcon = function buildMapIcon(serverIcon) {
    var options = {
            latitude: serverIcon.la,
            longitude: serverIcon.lo,
            image: '/img/icon.png',
            label: formatters.formatCurrencyForMap(serverIcon.price),
            referenceObject: {
                id: serverIcon.id
            }
        };

    return new MapIcon(options);
};

ImmoMap.prototype.loadListingOverviewToInfoWindow = function loadListingOverviewToInfoWindow(listingId) {
    var self = this,
        marker = self.markerLookup[listingId];

    if (_.isUndefined(marker)) {
        return;
    }


    self.iconInfoWindow.open(self.map, marker.getMarker());

    $.ajax({
        url: "/overview?id=" + listingId,
        success: function (overviewHTML) {
            self.iconInfoWindow.setContent(overviewHTML);
        }
    })
};

ImmoMap.prototype.loadPaginatedWidget = function loadPaginatedWidget() {
    var self = this,

        queryString = self.buildQueryString();

    $.ajax({
        url: "/sidebar?" + queryString,
        success: function (obj) {
            var listingResults = $('.listing-results'),
                container = document.getElementById('map-sidebar');

            listingResults.empty();
            listingResults.append(obj);

            container.scrollTop = 0;

            $(".pagination-link").click(function () {
                if ($(this).attr("data-page") == this.currentPage) {
                    return false;
                }

                self.currentPage = $(this).attr("data-page");

                self.loadPaginatedWidget();
                return false;
            });

            $(".sidebar-listing").on("mouseenter", function () {
                self.loadListingOverviewToInfoWindow($(this).data('id'));
            })
        }
    });
};

ImmoMap.prototype.buildQueryString = function buildQueryString() {
    var self = this,
        zoom = this.map.getZoom(),
        bounds = this.map.getBounds(),
        lng_east = bounds.getNorthEast().lng(),
        lat_north = bounds.getNorthEast().lat(),
        lat_south = bounds.getSouthWest().lat(),
        lng_west = bounds.getSouthWest().lng(),
        searchValues = {},
        extraString = '',
        sidebar = $('#map-sidebar'),
        min_price,
        max_price,
        min_surface,
        max_surface,
        min_bedroom,
        max_bedroom,
        search_a,
        search_h,
        search_t;

        if (sidebar.css('display') == 'none') {
            sidebar = $('.menu_mobile_app.filter-form');
        }

        min_price = Number(sidebar.find('input[name="minprice"]').val()),
        max_price = Number(sidebar.find('input[name="maxprice"]').val()),
        min_surface = Number(sidebar.find('input[name="minsize"]').val()),
        max_surface = Number(sidebar.find('input[name="maxsize"]').val()),
        min_bedroom = Number(sidebar.find('input[name="minbed"]').val()),
        max_bedroom = Number(sidebar.find('input[name="maxbed"]').val());

    if (this.rentalMode) {
        searchValues["rental"] = 1

    }

    if (min_price)
        searchValues["min_price"] = min_price;

    if (max_price)
        searchValues["max_price"] = max_price;


    if (min_surface)
        searchValues["min_size"] = min_surface;

    if (max_surface)
        searchValues["max_size"] = max_surface;


    if (min_bedroom)
        searchValues["min_bedroom"] = min_bedroom;

    if (max_bedroom)
        searchValues["max_bedroom"] = max_bedroom;

    search_a = sidebar.find('.search_a');
    search_h = sidebar.find('.search_h');
    search_t = sidebar.find('.search_t');

    searchValues["search_a"] = search_a.is(':checked') ? 1 : 0;
    searchValues["search_h"] = search_h.is(':checked') ? 1 : 0;
    searchValues["search_t"] = search_t.is(':checked') ? 1 : 0;

    searchValues["page"] = this.currentPage;
    searchValues["zoom"] = zoom;

    _.forOwn(searchValues, function(searchProperty, key) {
        extraString += "&" + key + "=" + searchProperty
    });

    return "lng_east=" + lng_east + "&lat_north=" + lat_north + "&lat_south=" + lat_south + "&lng_west=" + lng_west + extraString;
};

module.exports = ImmoMap;