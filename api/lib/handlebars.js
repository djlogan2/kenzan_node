var Handlebars = require('express-handlebars'),
    HandlebarsFormHelpers = require('handlebars-form-helpers'),
    path = require('path');

module.exports = function (app) {
    "use strict";
    var hbs = Handlebars.create({
        defaultLayout: 'main',
        extname: '.hbs',
        layoutsDir: path.join(__dirname + '/../../', 'views/layouts')
    });

    app.engine('.hbs', hbs.engine);

    app.set('view engine', '.hbs');
    app.set('views', path.join(__dirname + '/../../', 'views'));

    HandlebarsFormHelpers.register(hbs.handlebars, {
        validationErrorClass: 'custom-validation-class'
    });
    return hbs;
};