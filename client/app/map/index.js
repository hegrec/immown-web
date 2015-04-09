var _ = require('lodash'),
    MapIcon = require('./helper/MapIcon'),
    currencyConverter = require('./../../../lib/currencyConverter'),
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
    this.ajaxIconRequest = null;
    this.ajaxSidebarRequest = null;
    this.ajaxOverviewRequest = null;
    this.markerLookup = {};
    this.salePrices = [
        50000,
        100000,
        200000,
        300000,
        400000,
        500000,
        600000,
        700000,
        800000,
        900000,
        1000000
    ];

    this.rentPrices = [
        100,
        250,
        500,
        1000,
        2000,
        3000,
        4000,
        5000,
        6000,
        7000,
        8000,
        9000,
        10000
    ];
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

            setTimeout(function() {$(".menu_mobile_app.js-filter-form input[type='text']:first").focus();}, 250);
            self.mobileFilterOpen = true;
        }
    });

    $('.js-filter-form').on('submit', function()
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
            var latlong = new google.maps.LatLng(v.lat(), v.lng());
            bounds.extend(latlong);
        }

        placemark.polygon.bounds = bounds;
        placemark.polygon.setOptions(opt);
    });
};

ImmoMap.prototype.buildFilterState = function () {
    var sidebar = $('#map-sidebar'),
        mapLat = this.map.getCenter().lat() + '',
        mapLng = this.map.getCenter().lng() + '',
        minPrice,
        maxPrice,
        minSize,
        maxSize,
        minRoom,
        maxRoom,
        filterState = {};

    if (sidebar.css('display') == 'none') {
        sidebar = $('.menu_mobile_app.filter-form');
    }

    mapLat = mapLat.substring(0, 6);
    mapLng = mapLng.substring(0, 6);

    filterState['lat'] = mapLat;
    filterState['lng'] = mapLng;
    filterState['zoom'] = this.map.getZoom();

    if (this.rentalMode) {
        filterState['rent'] = 1;
    } else {
        filterState['rent'] = 0;
    }

    minPrice = Number(sidebar.find('select[name="minprice"]').val());
    maxPrice = Number(sidebar.find('select[name="maxprice"]').val());
    minSize = Number(sidebar.find('select[name="minsize"]').val());
    maxSize = Number(sidebar.find('select[name="maxsize"]').val());
    minRoom = Number(sidebar.find('select[name="minroom"]').val());
    maxRoom = Number(sidebar.find('select[name="maxroom"]').val());

    if (minPrice != 0) {
        if (this.rentalMode && _.indexOf(this.rentPrices, minPrice) > -1) {
            filterState['min-price-rent'] = minPrice;
        } else if (_.indexOf(this.salePrices, minPrice) > -1) {
            filterState['min-price-sale'] = minPrice;
        }
    }

    if (maxPrice != 0) {
        if (this.rentalMode && _.indexOf(this.rentPrices, maxPrice) > -1) {
            filterState['max-price-rent'] = maxPrice;
        } else if (_.indexOf(this.salePrices, maxPrice) > -1) {
            filterState['max-price-sale'] = maxPrice;
        }
    }

    if (minSize) {
        filterState['min-size'] = maxPrice;
    }

    if (maxSize) {
        filterState['max-size'] = maxSize;
    }

    if (minRoom) {
        filterState['min-room'] = minRoom;
    }

    if (maxRoom) {
        filterState['max-room'] = maxRoom;
    }

    if (!sidebar.find('input[name="construct_type"].search_a').prop('checked')) {
        filterState['apartment'] = 0;
    } else {
        filterState['apartment'] = 1;
    }

    if (!sidebar.find('input[name="construct_type"].search_h').prop('checked')) {
        filterState['house'] = 0;
    } else {
        filterState['house'] = 1;
    }

    if (!sidebar.find('input[name="construct_type"].search_t').prop('checked')) {
        filterState['land'] = 0;
    } else {
        filterState['land'] = 1;
    }

    return filterState;
};

ImmoMap.prototype.buildMapURL = function () {
    var sidebar = $('#map-sidebar'),
        url = '?',
        state = this.buildFilterState();

    if (sidebar.css('display') == 'none') {
        sidebar = $('.menu_mobile_app.filter-form');
    }

    url += 'lat='+ state['lat']
        + '&lng=' + state['lng']
        + "&zoom=" + state['zoom']
        + "&rent=" + state['rent'];

    if (this.rentalMode && state['min-price-rent']) {
        url += "&min-price=" + state['min-price-rent'];
    } else if (state['min-price-sale']) {
        url += "&min-price=" + state['min-price-sale'];
    }

    if (this.rentalMode && state['max-price-rent']) {
        url += "&max-price=" + state['max-price-rent'];
    } else if (state['min-price-sale']) {
        url += "&max-price=" + state['max-price-sale'];
    }

    if (state['min-size']) {
        url += "&min-size=" + state['min-size'];
    }

    if (state['max-size']) {
        url += "&max-size=" + state['max-size'];
    }

    if (state['min-room']) {
        url += "&min-room=" + state['min-room'];
    }

    if (state['max-room']) {
        url += "&max-room=" + state['max-room'];
    }

    if (sidebar.find('select[name="sort"]').val() != 'featured') {
        url += "&sort=" + sidebar.find('select[name="sort"]').val();
    }

    if (state['apartment'] == 0) {
        url += "&apartment=0";
    }

    if (state['house'] == 0) {
        url += "&house=0";
    }

    if (state['land'] == 0) {
        url += "&land=0";
    }

    return "/map/" + url;
};


ImmoMap.prototype.saveFilterState = function () {
    var state = this.buildFilterState(),
        localStore = window.localStorage || {},
        filterOpts = localStore.mapFilterFormValues || '{}',
        existingState = JSON.parse(filterOpts);

    _.forOwn(state, function(val, key) {
        existingState[key] = val;
    });

    localStore.mapFilterFormValues = JSON.stringify(existingState);
};

ImmoMap.prototype.loadFilterState = function () {
    var localStore = window.localStorage || {},
        filterOpts = localStore.mapFilterFormValues || '{}';

    return JSON.parse(filterOpts);
};


ImmoMap.prototype.updateMapURL = function updateMapURL() {
    var self = this;
    History.replaceState({}, "Immown", self.buildMapURL());
};

ImmoMap.prototype.setupFilterForm = function () {
    var self = this,
        url = location.search.substr(1),
        params = url.split('&'),
        paramKeys = {},
        minPriceKey = 'min-price-sale',
        maxPriceKey = 'max-price-sale',
        loadedState = self.loadFilterState();

    $(".js-filter-form").on('submit', function(evt) {
        self.clearMarkers();
        self.loadMapIcons();
        self.updateMapURL();
        return false;
    });

    //localstorage first
    _.forOwn(loadedState, function(opt, key) {
        paramKeys[key] = opt;
    });

    //url overrides
    _.each(params, function(param) {
        var split = param.split('=');
        paramKeys[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    });

    if (paramKeys['rent'] == 1) {
        $("input[name='rent_or_sale'][value='rent']").prop('checked', true);
        self.rentalMode = true;
        minPriceKey = 'min-price-rent';
        maxPriceKey = 'max-price-rent';
    } else {
        $("input[name='rent_or_sale'][value='sale']").prop('checked', true);
    }

    if (paramKeys[minPriceKey]) {
        $('select[name="minprice"]').val(paramKeys[minPriceKey]);
        self.updateMaxPrices(paramKeys[minPriceKey], paramKeys[maxPriceKey]);
    }

    if (paramKeys[maxPriceKey]) {
        $('select[name="maxprice"]').val(paramKeys[maxPriceKey]);
        self.updateMinPrices(paramKeys[maxPriceKey], paramKeys[minPriceKey]);
    }

    if (paramKeys['min-size']) {
        $('input[name="minsize"]').val(paramKeys['min-size']);
    }

    if (paramKeys['max-size']) {
        $('input[name="maxsize"]').val(paramKeys['max-size']);
    }

    if (paramKeys['min-room']) {
        $('input[name="minroom"]').val(paramKeys['min-room']);
    }

    if (paramKeys['max-room']) {
        $('input[name="maxroom"]').val(paramKeys['max-room']);
    }

    if (paramKeys['land'] == 0) {
        $('input[name="construct_type"].search_t').prop('checked', false);
    }

    if (paramKeys['apartment'] == 0) {
        $('input[name="construct_type"].search_a').prop('checked', false);
    }

    if (paramKeys['house'] == 0) {
        $('input[name="construct_type"].search_h').prop('checked', false);
    }

    if (paramKeys['sort']) {
        $('select[name="sort"]').val(paramKeys['sort']);
    }


    self.updateMapURL();

    $("input[name='rent_or_sale']").on('change', function () {
        self.rentalMode = $(this).val() == 'rent';
        self.saveFilterState();
        self.updatePriceLists();
        self.clearMarkers();
        self.loadMapIcons();
        self.updateMapURL();
    });

    $("input[name='construct_type']").on('change', function () {
        self.saveFilterState();
        self.clearMarkers();
        self.loadMapIcons();
        self.updateMapURL();
    });

    $("select[name='sort']").on('change', function () {
        self.saveFilterState();
        self.clearMarkers();
        self.loadMapIcons();
        self.updateMapURL();
    });

    $("select[name='minprice']").on('change', function () {
        self.saveFilterState();
        self.clearMarkers();
        self.updateMaxPrices($(this).val());
        self.loadMapIcons();
        self.updateMapURL();
    });

    $("select[name='maxprice']").on('change', function () {
        self.saveFilterState();
        self.clearMarkers();
        self.updateMinPrices($(this).val());
        self.loadMapIcons();
        self.updateMapURL();
    });
};

ImmoMap.prototype.updatePriceLists = function () {
    var self = this,
        minPriceKey = 'min-price-sale',
        maxPriceKey = 'max-price-sale',
        minPrice = 0,
        maxPrice = 0,
        loadedState = this.loadFilterState();

    if (this.rentalMode) {
        minPriceKey = 'min-price-rent';
        maxPriceKey = 'max-price-rent';
    }

    if (loadedState[minPriceKey]) {
        minPrice = loadedState[minPriceKey];
        $('select[name="minprice"]').val(minPrice);
    }

    if (loadedState[maxPriceKey]) {
        maxPrice = loadedState[maxPriceKey];
        $('select[name="maxprice"]').val(maxPrice);

    }

    self.updateMaxPrices(minPrice, maxPrice);
    self.updateMinPrices(maxPrice, minPrice);
};

ImmoMap.prototype.updateMaxPrices = function (minValue, val) {
    var maxValues = [],
        sidebar = $('#map-sidebar'),
        maxSelector,
        priceList = this.salePrices,
        currentValue = val,
        html = '<option value="0">Pas de max</option>';

    if (sidebar.css('display') == 'none') {
        sidebar = $('.menu_mobile_app.filter-form');
    }

    maxSelector = sidebar.find("select[name='maxprice']");
    if (!val) {
        currentValue = maxSelector.val();
    }

    if (this.rentalMode) {
        priceList = this.rentPrices;
    }

    _.each(priceList, function(priceOption) {
        if (minValue < priceOption || minValue == 0) {
            maxValues.push(priceOption);
        }
    });

    _.each(maxValues, function(val) {
        html += '<option value="' + val;

        if (currentValue == val) {
            html += '" selected="selected">'
        } else {
            html += '">';
        }

        html += currencyConverter(val) + '</option>';
    });

    maxSelector.html(html);
};

ImmoMap.prototype.updateMinPrices = function (maxValue, val) {
    var minValues = [],
        sidebar = $('#map-sidebar'),
        minSelector,
        priceList = this.salePrices,
        currentValue = val,
        html = '<option value="0">Pas de min</option>';

    if (sidebar.css('display') == 'none') {
        sidebar = $('.menu_mobile_app.filter-form');
    }

    minSelector = sidebar.find("select[name='minprice']");
    if (!val) {
        currentValue = minSelector.val();
    }

    if (this.rentalMode) {
        priceList = this.rentPrices;
    }

    _.each(priceList, function(priceOption) {
        if (maxValue > priceOption || maxValue == 0) {
            minValues.push(priceOption);
        }
    });

    _.each(minValues, function(val) {
        html += '<option value="' + val;

        if (currentValue == val) {
            html += '" selected="selected">'
        } else {
            html += '">';
        }

        html += currencyConverter(val) + '</option>';
    });

    minSelector.html(html);
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
        content: "Chargement en cours..."
    });

    this.map = new google.maps.Map(document.getElementById(canvasId),
        {
            zoom: defaultZoom,
            disableDefaultUI: true,
            minZoom: 6,
            scaleControl: true,
            center: new google.maps.LatLng(defaultLat, defaultLng),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
    );
    if (self.application.moduleVars.boundaries) {
        this.geoParser = new geoXML3.parser({
            map: self.map,
            suppressInfoWindows: true,
            zoom: false,
            afterParse: function (doc) {
                self.renderBoundaries(doc)
            }
        });
    }

    google.maps.event.addListenerOnce(this.map, 'idle', function () {
        var boundaries = '';
        self.mapLoaded = true;
        self.loadMapIcons();

        if (self.application.moduleVars.boundaries) {
            boundaries = '<kml><Placemark><name>a big test</name><description>test</description>'
            + self.application.moduleVars.boundaries
            +'</Placemark></kml>';

            self.geoParser.parseKmlString(boundaries);
        }
    });


    google.maps.event.addListener(self.map, 'zoom_changed', function () {
        if (self.geoParser) {
            self.geoParser.hideDocument();
            self.geoParser = null;
        }
        self.loadMapIcons();
        self.updateMapURL();
    });

    google.maps.event.addListener(self.map, 'dragend', function () {
        window.setTimeout(function() {
            if (self.geoParser) {
                self.geoParser.hideDocument();
                self.geoParser = null;
            }
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

    if (!_.isNull(self.ajaxIconRequest)) {
        self.ajaxIconRequest.abort();
    }

    self.ajaxIconRequest = $.ajax({
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

            var text = serverIcons.icons.length + ' résultats';
            if (serverIcons.has_more) {
                text = serverIcons.icons.length + '+ résultats';
            }

            if (serverIcons.town_name) {
                text += ' à ' + serverIcons.town_name;
                text += '<h5>Déplacez vous sur la carte pour voir d\'autres annonces</h5>';
            }

            $('.js-result-count').html(text);
        }
    });
};

ImmoMap.prototype.mapIconExists = function mapIconExists(mapIcon) {
    return this.markerLookup[mapIcon.getId()];
};

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

    if (serverIcon.r) {
        options.image = '/img/icon_rent.png';
    }

    return new MapIcon(options);
};

ImmoMap.prototype.loadListingOverviewToInfoWindow = function loadListingOverviewToInfoWindow(listingId) {
    var self = this,
        marker = self.markerLookup[listingId];

    if (_.isUndefined(marker)) {
        return;
    }


    self.iconInfoWindow.open(self.map, marker.getMarker());

    if (!_.isNull(self.ajaxOverviewRequest)) {
        self.ajaxOverviewRequest.abort();
    }

    self.ajaxOverviewRequest = $.ajax({
        url: "/overview?id=" + listingId,
        success: function (overviewHTML) {
            self.iconInfoWindow.setContent(overviewHTML);
        }
    })
};

ImmoMap.prototype.loadPaginatedWidget = function loadPaginatedWidget() {
    var self = this,

        queryString = self.buildQueryString();

    if (!_.isNull(self.ajaxSidebarRequest)) {
        self.ajaxSidebarRequest.abort();
    }

    self.ajaxSidebarRequest = $.ajax({
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
        min_room,
        max_room,
        sort,
        search_a,
        search_h,
        search_t,
        pathname = location.pathname.substr(1).split('/');

        if (sidebar.css('display') == 'none') {
            sidebar = $('.menu_mobile_app.filter-form');
        }

        min_price = Number(sidebar.find('select[name="minprice"]').val()),
        max_price = Number(sidebar.find('select[name="maxprice"]').val()),
        min_surface = Number(sidebar.find('input[name="minsize"]').val()),
        max_surface = Number(sidebar.find('input[name="maxsize"]').val()),
        min_room = Number(sidebar.find('input[name="minroom"]').val()),
        max_room = Number(sidebar.find('input[name="maxroom"]').val());
        sort = sidebar.find('select[name="sort"]').val();

    if (this.rentalMode) {
        searchValues["rental"] = 1

    }

    if (pathname[1]) {
        searchValues['town'] = pathname[1];
    }

    if (sort) {
        searchValues['sort'] = sort;
    }

    if (min_price)
        searchValues["min_price"] = min_price;

    if (max_price)
        searchValues["max_price"] = max_price;


    if (min_surface)
        searchValues["min_size"] = min_surface;

    if (max_surface)
        searchValues["max_size"] = max_surface;


    if (min_room)
        searchValues["min_room"] = min_room;

    if (max_room)
        searchValues["max_room"] = max_room;

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