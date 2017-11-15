var express = require('express'),
    Handlebars = require('express-handlebars'),
    JWT = require('./api/lib/jwt'),
    app = express(),
    session = require('express-session'),
    path = require('path'),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    HandlebarsFormHelpers = require('handlebars-form-helpers');

//
// Mongoose instance
//
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.1.69/KenzanDB');
require('./api/models/employeeModel');

function authorizeRestUser(req, res, next) {
    "use strict";

    var token = req.headers['authorization'];

    if(token)
    {
        var checkJwt = new JWT(token);
        if(!checkJwt.isValid()) {
            res.json({errorcode: checkJwt.errorcode, error: checkJwt.error, id: null});
            return;
        } else {
            req.jwt = checkJwt;
        }
    }
    next();
}

function authorizeHtmlUser(req, res, next) {
    "use strict";
    if(req.originalUrl.indexOf('/rest/') > -1) return; // Skip HTML authorization if we are a REST user

    if(req.method === 'POST' && req.body.username && req.body.password /*&& req.body.login */ && req.body.redirect)
    {
        Employee.authenticate(req.body.username, req.body.password, function(err, emp){
            if(err || !emp)
            {
                res.render('login', {redirect: req.body.redirect, layout: 'nolayout', err: err.toString()});
                return;
            }
            else
            {
                req.current_user = emp;
                req.session.userId = emp._id;
                res.redirect(req.body.redirect);
            }
        });
        return;
    }

    if(req.session.userId)
    {
        Employee.findOne({bStatus: 'ACTIVE', _id: req.session.userId}, function(err, user){
            if(err || !user)
            {
                res.render('login', {err: 'Something happened: ' + err.toString(), redirect: req.originalUrl});
                return;
            }
            req.current_user = user;
            next();
        });
    }
    else
    {
        res.render('login', {layout: 'nolayout', redirect: req.originalUrl});
    }
}

var sessionObject = {
    secret: 'secret',
    resave: false,
    saveUninitialized: true
};
if(app.get('env') === 'production') {
    app.set('trust proxy', 1);
    sessionObject.cookie = {secure: true};
}

app.use(session(sessionObject));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(authorizeRestUser);
app.use(authorizeHtmlUser);

var routes = require('./api/routes/kenzanRoutes');
routes(app);

var hbs = Handlebars.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
});

app.engine('.hbs', hbs.engine);

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

HandlebarsFormHelpers.register(hbs.handlebars, {
    validationErrorClass: 'custom-validation-class'
});

app.listen(port);

console.log('Kenzan server started on: ' + port);
