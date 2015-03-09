
function LocationSearch(elementTypingBox, elementResults, up) {
    this.typer = elementTypingBox;
    this.resultsElement = elementResults;
    this.currentSelected = 0;
    this.currentSearch = "";
    this.currentPostcode = "";
    this.urlPrefix = up;

    var that = this;

    elementTypingBox.keydown(function(evt)
    {
        if (evt.keyCode == 40  || evt.keyCode == 38)
            return true;

        if (evt.keyCode == 13)
        {
            window.location = that.urlPrefix+elementTypingBox.val();
            return false;
        }

        that.search(elementTypingBox.val()+String.fromCharCode(evt.keyCode))
    })

    elementTypingBox.on("focus",function(evt)
    {
        that.resultsElement.show();
    })


    $( document ).keydown(function(evt)
    {

        if (evt.keyCode == 40 && elementTypingBox.is(':focus'))
        {
            that.currentSelected++;
            if (that.currentSelected>that.resultsElement.find("a").length)
                that.currentSelected = that.resultsElement.find("a").length;

            that.currentPostcode = that.resultsElement.find("a:nth-child("+that.currentSelected+")" ).attr("data-postcode")
            that.currentSearch = that.resultsElement.find("a:nth-child("+that.currentSelected+")" ).attr("data-search")
            elementTypingBox.val(that.currentSearch+"-"+that.currentPostcode);
            return false;

        }
        else if (evt.keyCode == 38 && elementTypingBox.is(':focus'))
        {
            that.currentSelected--;
            that.currentPostcode = that.resultsElement.find("a:nth-child("+that.currentSelected+")" ).attr("data-postcode")
            that.currentSearch = that.resultsElement.find("a:nth-child("+that.currentSelected+")" ).attr("data-search")

            if (that.currentSelected<=0)
            {
                that.currentSelected = 0;
                that.currentSearch = that.resultsElement.find("a:nth-child("+1+")" ).attr("data-search")
                that.currentPostcode = that.resultsElement.find("a:nth-child("+1+")" ).attr("data-postcode")
            }
            elementTypingBox.val(that.currentSearch+"-"+that.currentPostcode);
            return false;
        }
    })
}

LocationSearch.prototype.search = function(search_term)
{
    if (search_term.length < 3)
        return;

    var that = this;
    $.get("/towns/?term="+search_term,function(obj) {
        that.originalSearch = search_term

        that.resultsElement.empty()

        for (var i=0;i<obj[2].length;i++)
        {
            var row = obj[2][i];
            var name = row.region_name
            var nameURL = name.replace(" ","-")
            var code = row.code
            if (code<10)
                code = "0" + code;
            var id = row.id
            that.resultsElement.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
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
            that.resultsElement.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
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
            that.resultsElement.append("<a data-search='"+name+"' data-postcode='"+code+"' href='"+that.urlPrefix+nameURL+"-"+code+"/'><li><div>"+name+" ("+code+") </div></li></a>");
        }
        that.currentSelected = 0;
    });
};