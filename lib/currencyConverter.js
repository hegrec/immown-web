function currencyConverter(number) {
    var split = (number+"").split(''),
        builtString = '',
        ndx = -1,
        i;

    for (i = split.length - 1; i >= 0; i--) {
        ndx++;
        if (ndx % 3 == 0 && ndx != 0) {
            builtString = '.' + builtString;
        }
        builtString = split[i] + builtString;
    }

    return builtString + '€';
}

module.exports = currencyConverter;