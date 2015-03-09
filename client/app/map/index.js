var _ = require('lodash'),
    MapIcon = require('./helper/MapIcon'),
    formatters = require('./../util/formatters');

function ImmoMap(application) {
    this.application = application;
    this.map = null;
    this.iconInfoWindow = null;
    this.mapLoaded = false;
    this.rentalMode = false;
    this.currentPage = 1;
    this.markerLookup = {};
    this.createGoogleMap('map-canvas');

    this.setupFilterForm();
}

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

    $("#js-filter-form").on('submit', function(evt) {

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

    google.maps.event.addListenerOnce(this.map, 'idle', function () {
        self.mapLoaded = true;
        self.loadMapIcons()
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
            _.each(serverIcons.icons, function(serverIcon) {
                var mapMarker = self.buildMapIcon(serverIcon),
                    googleMarker;

                if (!self.mapIconExists(mapMarker)) {
                    googleMarker = mapMarker.getGoogleMapsIcon(self.map);

                    google.maps.event.addListener(googleMarker, "click", function (e) {
                        self.loadListingOverviewToInfoWindow(this.id)
                    });
                    self.markerLookup[mapMarker.getId()] = mapMarker;
                    self.markers.push(mapMarker)
                }
            });

            var text = serverIcons.total + ' Listings';
            if (serverIcons.total>serverIcons.icons.length) {
                text += ' ('+ (serverIcons.icons.length) + ' shown)';
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
    var zoom = this.map.getZoom(),
        bounds = this.map.getBounds(),
        lng_east = bounds.getNorthEast().lng(),
        lat_north = bounds.getNorthEast().lat(),
        lat_south = bounds.getSouthWest().lat(),
        lng_west = bounds.getSouthWest().lng(),
        searchValues = {},
        extraString = '',
        min_price = Number($('input[name="minprice"]').val()),
        max_price = Number($('input[name="maxprice"]').val()),
        min_surface = Number($('input[name="minsize"]').val()),
        max_surface = Number($('input[name="maxsize"]').val()),
        min_bedroom = Number($('input[name="minbed"]').val()),
        max_bedroom = Number($('input[name="maxbed"]').val());

    if (this.rentalMode) {
        searchValues["rental"] = 1

    }

    if (min_price)
        searchValues["min_price"] = min_price

    if (max_price)
        searchValues["max_price"] = max_price


    if (min_surface)
        searchValues["min_size"] = min_surface

    if (max_surface)
        searchValues["max_size"] = max_surface


    if (min_bedroom)
        searchValues["min_bedroom"] = min_bedroom

    if (max_bedroom)
        searchValues["max_bedroom"] = max_bedroom

    searchValues["search_a"] = $("#search_a").is(':checked') ? 1 : 0;
    searchValues["search_h"] = $("#search_h").is(':checked') ? 1 : 0;
    searchValues["search_t"] = $("#search_t").is(':checked') ? 1 : 0;
    searchValues["page"] = this.currentPage;
    searchValues["zoom"] = zoom;

    _.forOwn(searchValues, function(searchProperty, key) {
        extraString += "&" + key + "=" + searchProperty
    });
    console.log(extraString);
    return "lng_east=" + lng_east + "&lat_north=" + lat_north + "&lat_south=" + lat_south + "&lng_west=" + lng_west + extraString;
};
http://localhost:3000/sidebar?lng_east=5.5540771484375&lat_north=49.04964295604396&lat_south=44.868601696404&lng_west=-1.5540771484375&search_a=0&search_h=0&search_t=0&page=1&zoom=7
module.exports = ImmoMap;