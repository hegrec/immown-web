var _ = require('lodash'),
    MapIcon = require('./helper/MapIcon'),
    formatters = require('./../util/formatters');require

function ImmoMap(application) {
    this.application = application;
    this.map = null;
    this.iconInfoWindow = null;
    this.mapLoaded = false;
    this.rentalMode = false;
    this.activeMarkers = [];
    this.createGoogleMap('map-canvas');
}

ImmoMap.prototype.createGoogleMap = function createMap(canvasId) {
    var self = this;

    this.mapLoaded = false;

    this.iconInfoWindow = new google.maps.InfoWindow({
        content: "Loading Info..."
    });

    this.map = new google.maps.Map(document.getElementById(canvasId),
        {
            zoom: 7,
            disableDefaultUI: true,
            minZoom: 6,
            center: new google.maps.LatLng(47, 2),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
    );

    google.maps.event.addListenerOnce(this.map, 'idle', function () {
        self.mapLoaded = true;
        self.loadMapIcons()
    });

    google.maps.event.addListener(self.map, 'zoom_changed', function () {
        self.loadMapIcons();
    });

    google.maps.event.addListener(self.map, 'dragend', function () {
        window.setTimeout(function() {
            self.loadMapIcons();
        }, 150);
    });
};

ImmoMap.prototype.clearMarkers = function clearMarkers() {

    _.each(this.markers, function(marker) {
        marker.getMarker().setMap(null);
    });

    this.markers = [];
};

ImmoMap.prototype.clearMarkersOffScreen = function clearMarkersOffScreen() {
    var newMarkers = [],
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
        } else {
            newMarkers.push(marker);
        }
    });

    this.markers = newMarkers;
};

ImmoMap.prototype.loadMapIcons = function() {
    var self = this;
    if (!this.mapLoaded) return;

    self.loadPaginatedWidget();

    var extraString = self.buildQueryString();
    $.ajax({
        url: "/icons?" + extraString,
        dataType: "json",
        success: function (serverIcons) {

            self.clearMarkersOffScreen();
            _.each(serverIcons, function(serverIcon) {
                var mapMarker = self.buildMapIcon(serverIcon),
                    googleMarker = mapMarker.getGoogleMapsIcon(self.map);

                google.maps.event.addListener(googleMarker, "click", function (e) {
                    self.loadListingOverviewToInfoWindow(this.id)
                });
                self.markers.push(mapMarker)
            });
        }
    });
};

ImmoMap.prototype.buildMapIcon = function buildMapIcon(serverIcon) {
    var self = this,
        options = {
            latitude: serverIcon.la,
            longitude: serverIcon.lo,
            image: '/img/house.png',
            label: formatters.formatCurrencyForMap(serverIcon.price),
            referenceObject: {
                id: serverIcon.id
            }
        },
        marker = new MapIcon(options);

    return marker;
};

ImmoMap.prototype.loadListingOverviewToInfoWindow = function loadListingOverviewToInfoWindow(listingId) {
    var self = this;
    self.iconInfoWindow.open(self.map, this);
    $.ajax({
        url: "/feed/?overview=&id=" + listingId + "&" + self.buildQueryString(),
        success: function (obj) {
            self.iconInfoWindow.setContent(obj);
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
                if ($(this).attr("data-page") == currentPage)
                    return false;

                self.loadPaginatedWidget();
                $(this).attr("href", getMapURL());
                return false;
            });

            $(".sidebar-listing").on("mouseenter", function () {
                console.log("entered listing in sidebar");
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
        searchValues["min_surface"] = min_surface

    if (max_surface)
        searchValues["max_surface"] = max_surface


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
    return "lng_east=" + lng_east + "&lat_north=" + lat_north + "&lat_south=" + lat_south + "&lng_west=" + lng_west + extraString;
};

module.exports = ImmoMap;