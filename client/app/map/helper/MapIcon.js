function ImmoMapIcon(options) {
    this.latitude = 0;
    this.longitude = 0;
    this.image = null;
    this.marker = null;
    this.text = "";
    this.referenceObject = {};

    options = options || {};

    if (options.latitude) {
        this.latitude = options.latitude;
    }

    if (options.longitude) {
        this.longitude = options.longitude;
    }

    if (options.image) {
        this.image = options.image;
    }

    if (options.text) {
        this.text = options.text;
    }

    if (options.referenceObject) {
        this.referenceObject = options.referenceObject;
    }
}

ImmoMapIcon.prototype.getId = function getId() {
    return this.referenceObject.id;
};

ImmoMapIcon.prototype.getLat = function () {
    return this.latitude;
};

ImmoMapIcon.prototype.getLng = function () {
    return this.longitude;
};

ImmoMapIcon.prototype.getGoogleMapsIcon = function getGoogleMapsIcon(googleMap) {
    var self = this,
        mapIcon = {
        url: self.image,
        size: new google.maps.Size(20, 20),
        scaledSize: new google.maps.Size(16, 16)
    };

    this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(self.latitude, self.longitude),
        map: googleMap,
        labelContent: self.text,
        labelAnchor: new google.maps.Point(22, 0),
        labelClass: 'somecssclass',
        labelStyle: {
            opacity: 0.5
        }
    });



    this.marker.set('icon', mapIcon);

    return this.marker;
};

ImmoMapIcon.prototype.getMarker = function getMarker() {
    return this.marker;
};

module.exports = ImmoMapIcon;
