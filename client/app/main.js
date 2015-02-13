function Immodispo($) {
    var self = this;

    this.jQuery = $;

    this.jQuery(document).ready(function() {
        self.start();
    });
}

Immodispo.prototype.start = function() {
    var path = window.location.pathname;

    if (path == '/') {
        var MapsModule = require('./map/index');
        new MapsModule(this);
    }
};

var app = new Immodispo($);
