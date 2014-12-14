var nunjucks = require('nunjucks'),
    path = require('path');




exports.register = function (server, options, next) {
    var env = nunjucks.configure(path.join(__dirname, '../../views'));

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