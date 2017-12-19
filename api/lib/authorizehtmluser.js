module.exports = function (req, res, next) {
    "use strict";

    if (req.originalUrl.indexOf('/rest/') > -1) {
        next();
        return;
    } // Skip HTML authorization if we are a REST user

    if (req.method === 'POST' && req.body.username && req.body.password && req.body.redirect) {
        Employee.authenticate(req.body.username, req.body.password, function (err, emp) {
            if (err || !emp) {
                res.render('login', {redirect: req.body.redirect, layout: 'nolayout', err: err.toString()});
            }
            else {
                //
                // Make sure upon first login, we regenerate the session and store a new cookie.
                // This prevents sites from taking old cookies and using them.
                //
                req.session.regenerate(function (err) {
                    if (err) throw err;
                    req.current_user = emp;
                    req.session.userId = emp._id;
                    res.redirect(req.body.redirect);
                });
            }
        });
        return;
    }

    if (req.session.userId) {
        Employee.findOne({bStatus: 'ACTIVE', _id: req.session.userId}, function (err, user) {
            if (err || !user) {
                res.render('login', {err: 'Something happened: ' + err.toString(), redirect: req.originalUrl});
                return;
            }
            req.current_user = user;
            next();
        });
    }
    else {
        res.render('login', {layout: 'nolayout', redirect: req.originalUrl});
    }
};