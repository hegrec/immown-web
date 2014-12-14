var map;

var mapOptions = {
    zoom: 7,
    disableDefaultUI: true,
    minZoom: 6,
    center: new google.maps.LatLng(47, 2),
    mapTypeId: google.maps.MapTypeId.ROADMAP
};
map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);