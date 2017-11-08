var errorCode = require('./errorcode');

module.exports = function(role) {
    "use strict";
    return function(req, res, next) {
        "use strict";
        if(!req.jwt) { res.json({ errorcode: errorCode.NO_AUTHORIZATION_TOKEN, error: 'No authorization token found', id: null }); return; }
        if(!role || req.jwt.isInRole(role)) { next(); return; }
        res.json({ errorcode: errorCode.NOT_AUTHORIZED_FOR_OPERATION, error: 'Not authorized to role', id: null });
    }
}