var _ = require('lodash');
    formatters = require('./../util/formatters');

function ImmoListing(application) {

    var self = this;

    this.firstHeight = $("#preview-image").height();

    $('#image-container').find('img').on("mousemove",function () {

        var src = $(this).attr('src');
        $("#preview-image").attr('src', src);
        $("#preview-image").css('height', self.firstHeight + 'px');
        $("#preview-image").css('width', 'auto');
    });
}

module.exports = ImmoListing;

/*
setEnergyRating($("#dpeMark").text())



$("#telephone_form").submit(function(evt){


    $.get("/feed/?agency_telephone="+$("#agency_id").val(),function(result) {

        $("#phone_submit").html("<span class=\"glyphicon glyphicon-earphone\"></span>"+result)
        $("#phone_submit").attr("disabled","disabled")
    });
    return false;
});


var currentImage = 1;
$("#prev_img").click(function(evt){
    setActiveImage(currentImage-1)
});
$("#next_img").click(function(evt){
    setActiveImage(currentImage+1)
});

function setActiveImage(imgNumber)
{


    if (imgNumber>$("#image_container div").length)
        imgNumber = 1
    else if (imgNumber<1)
        imgNumber = $("#image_container div").length

    currentImage = imgNumber
    var newImage = $("#image_container div:nth-child("+currentImage+")" ).attr("data-img");
    $("#bigimage").css("background-image","url('"+newImage+"')")

}

function setEnergyRating(iRating)
{
    $("#dpeMark").text(iRating);
    if (iRating>450)
        $("#dpeMark").attr("class","dpe_g");
    else if (iRating>=331)
        $("#dpeMark").attr("class","dpe_f");
    else if (iRating>=231)
        $("#dpeMark").attr("class","dpe_e");
    else if (iRating>=151)
        $("#dpeMark").attr("class","dpe_d");
    else if (iRating>=91)
        $("#dpeMark").attr("class","dpe_c");
    else if (iRating>=50)
        $("#dpeMark").attr("class","dpe_b");
    else
        $("#dpeMark").attr("class","dpe_a");
}*/