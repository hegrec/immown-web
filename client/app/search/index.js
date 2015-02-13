
function LocationSearch(element_typing_box, element_results, up) {
    this.typer = element_typing_box;
    this.results_element = element_results;
    this.currentSelected = 0;
    this.originalSearch = "";
    this.currentSearch = "";
    this.currentPostcode = "";
    this.urlPrefix = up;

    var that = this;

    element_typing_box.keydown(function(evt)
    {
        if (evt.keyCode == 40  || evt.keyCode == 38)
            return true;

        if (evt.keyCode == 13)
        {
            window.location = that.urlPrefix+element_typing_box.val();
            return false;
        }

        that.search(element_typing_box.val()+String.fromCharCode(evt.keyCode))
    })

    element_typing_box.on("focus",function(evt)
    {
        that.results_element.show();
    })


    $( document ).keydown(function(evt)
    {

        if (evt.keyCode == 40 && element_typing_box.is(':focus'))
        {
            that.currentSelected++;
            if (that.currentSelected>that.results_element.find("a").length)
                that.currentSelected = that.results_element.find("a").length;

            that.currentPostcode = that.results_element.find("a:nth-child("+that.currentSelected+")" ).attr("data-postcode")
            that.currentSearch = that.results_element.find("a:nth-child("+that.currentSelected+")" ).attr("data-search")
            element_typing_box.val(that.currentSearch+"-"+that.currentPostcode);
            return false;

        }
        else if (evt.keyCode == 38 && element_typing_box.is(':focus'))
        {
            that.currentSelected--;
            that.currentPostcode = that.results_element.find("a:nth-child("+that.currentSelected+")" ).attr("data-postcode")
            that.currentSearch = that.results_element.find("a:nth-child("+that.currentSelected+")" ).attr("data-search")

            if (that.currentSelected<=0)
            {
                that.currentSelected = 0;
                that.currentSearch = that.results_element.find("a:nth-child("+1+")" ).attr("data-search")
                that.currentPostcode = that.results_element.find("a:nth-child("+1+")" ).attr("data-postcode")
            }
            element_typing_box.val(that.currentSearch+"-"+that.currentPostcode);
            return false;
        }
    })
}

LocationSearch.prototype.search = function(search_term)
{
    if (search_term.length < 3)
        return;

    var that = this;
    $.get("/town_search/?srch="+search_term,function(obj) {
        that.originalSearch = search_term

        that.results_element.empty()

        for (var i=0;i<obj[2].length;i++)
        {
            var row = obj[2][i];
            var name = row.region_name
            var nameURL = name.replace(" ","-")
            var code = row.code
            if (code<10)
                code = "0" + code;
            var id = row.id
            that.results_element.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
        }
        for (var i=0;i<obj[1].length;i++)
        {
            var row = obj[1][i];
            var name = row.department_name
            var nameURL = name.replace(" ","-")
            var code = row.code
            if (code<10)
                code = "0" + code;
            var id = row.id
            that.results_element.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
        }
        for (var i=0;i<obj[0].length;i++)
        {
            var row = obj[0][i];
            var name = row.town_name
            var nameURL = name.replace(" ","-")
            var code = row.code
            if (code<10000)
                code = "0" + code;
            var id = row.id
            that.results_element.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
        }
        that.currentSelected = 0;
    });
};