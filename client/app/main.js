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


    var isMenuOpen = false;

    $('.menu_btn').click(function()
    {
        if (isMenuOpen == false)
        {
            $("#menu_smartphone").clearQueue().animate({
                left : '0px'
            })
            $("#grey_back").fadeIn('fast');
            $(this).fadeOut(200);
            $(".close").fadeIn(300);

            isMenuOpen = true;
        }
    });
    $('#grey_back').click(function()
    {
        if (isMenuOpen == true)
        {
            $("#menu_smartphone").clearQueue().animate({
                left : '-570px'
            })
            $("#page").clearQueue().animate({
                "margin-left" : '0px'
            })
            $("#grey_back").fadeOut('fast');
            $(this).fadeOut(200);
            $(".menu_btn").fadeIn(300);

            isMenuOpen = false;
        }
    });
};

window.immodispo = Immodispo;