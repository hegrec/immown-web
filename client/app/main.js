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


    var isMenuOpen = false,
        isSearchMenuOpen = false;

    $('.menu_btn').click(function()
    {
        if (isMenuOpen == false)
        {
            $("#menu_smartphone").addClass('open');
            $('#grey_back').addClass('open');
            isMenuOpen = true;
        }
    });

    $('.search_btn').click(function()
    {
        if (isSearchMenuOpen == false)
        {
            $(".menu_mobile_app.search").addClass('open');
            setTimeout(function() {$(".menu_mobile_app.search input").focus();}, 250);
            isSearchMenuOpen = true;
        }
    });

    $('.menu_mobile_app.search .back_btn').click(function()
    {
        if (isSearchMenuOpen == true)
        {
            $(".menu_mobile_app.search").removeClass('open');
            isSearchMenuOpen = false;
        }
    });

    $('#grey_back').click(function()
    {
        if (isMenuOpen == true)
        {
            $("#menu_smartphone").removeClass('open');
            $('#grey_back').removeClass('open');
            isMenuOpen = false;
        }
    });
};

window.immodispo = Immodispo;