function Immodispo(seedData) {

    var self = this;

    this.jQuery = $;
    this.seedData = seedData || {};
    this.activeModule = this.seedData.module;
    this.moduleVars = this.seedData.vars;

    this.jQuery(document).ready(function () {
        self.start();
        $(this).foundation();
    });
}

Immodispo.prototype.start = function () {

    var Module;

    require('./search');

    if (this.activeModule == 'map') {
        Module = require('./map/index');
    } else if (this.activeModule == 'listing') {
        Module = require('./listing/index');
    }

    if (Module) {
        this.module = new Module(this);
    }
};

window.immodispo = Immodispo;