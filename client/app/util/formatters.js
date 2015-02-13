function getFormattedMoneyEU(sAmt)
{
    var len = sAmt.length,
        rem = len % 3,
        i = 0,
        priceOut = "";
    for (i=0;i<len;i++)
    {
        priceOut += sAmt.charAt(i);
        if ((1+i) % 3 == rem && i!= len-1)
            priceOut += "."
    }
    priceOut += "€"
    return priceOut;
}


function formatPrice(price) {
    var priceFormat = Number(price);
    if (priceFormat >= 10000000)
        if (priceFormat % 10000000 == 0)
            priceFormat = price + "".charAt(0) + "M€";
        else {
            priceFormat = price + "".charAt(0) + "." + price.charAt(1) + "M€";
        } else if (priceFormat >= 100000)
        priceFormat = (price + "").substr(0, 3) + "m€";
    else if (priceFormat > 10000)
        priceFormat = (price + "").substr(0, 2) + "m€";
    else if (priceFormat >= 1000) {
        if (priceFormat % 1000 == 0)
            priceFormat = price + "".charAt(0) + "m€";
        else {
            priceFormat = price + "".charAt(0) + "." + price.charAt(1) + "m€";
        }
    } else
        priceFormat = (price + "") + "€";
    return priceFormat;
};

module.exports = {
    formatCurrency: getFormattedMoneyEU,
    formatCurrencyForMap: formatPrice
};