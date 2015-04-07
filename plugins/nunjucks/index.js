var nunjucks = require('nunjucks'),
    path = require('path'),
    environment = require('./../../env');




exports.register = function (server, options, next) {
    var env = nunjucks.configure(path.join(__dirname, '../../views'));

    env.addFilter("cdn", function(resource) {
        return environment.CDN_ROOT + resource;
    });

    env.addFilter("currency", function(number) {
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
    });
    server.decorate('reply', 'render', function(templateName, context) {

        var replyObject = this;
        env.render(templateName, context, function(err, renderedTemplate) {

            replyObject(renderedTemplate);
        });
    });

    next();
};

exports.register.attributes = {
    name: 'nunjucks',
    version: '1.0.0'
};