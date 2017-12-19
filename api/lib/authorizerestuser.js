var JWT = require('./jwt');

module.exports = function (req, res, next) {
    "use strict";

    var token = req.headers['authorization'];

    if (token) {
        var checkJwt = new JWT(token);
        if (!checkJwt.isValid()) {
            res.json({errorcode: checkJwt.errorcode, error: checkJwt.error, id: null});
            return;
        } else {
            req.jwt = checkJwt;
        }
    }
    next();
};