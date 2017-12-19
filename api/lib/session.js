module.exports = function (app) {
    "use strict";
    var sessionObject = {
        secret: 'secret',
        resave: false,
        saveUninitialized: true
    };

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1);
        sessionObject.cookie = {secure: true};
    }

    app.use(require('express-session')(sessionObject));
};