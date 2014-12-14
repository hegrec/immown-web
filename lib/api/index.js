var mysql = require('mysql'),
    domainModels = {};

module.exports = function() {

    function connect() {
        var connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'immodispo',
            password: 'devpassword'
        });

        connection.connect();

        domainModels.region = require("./models/Region")(connection);
    }

    function models() {
        return domainModels;
    }

    return {
        connect: connect,
        models: models
    };
};