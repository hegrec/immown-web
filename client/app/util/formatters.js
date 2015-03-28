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
    return Number(price) + "€";
};

module.exports = {
    formatCurrency: getFormattedMoneyEU,
    formatCurrencyForMap: formatPrice
};