var express = require('express'),
    errorCode = require('./api/lib/errorcode'),
    JWT = require('./api/lib/jwt'),
    app = express(),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    Employee = require('./api/models/employeeModel'),
    bodyParser = require('body-parser'),
    _ = require('underscore')

//
// Mongoose instance
//
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.1.69/KenzanDB');

function authorize(req, res, next) {
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(authorize);

var routes = require('./api/routes/kenzanRoutes');
routes(app);

app.listen(port);

console.log('Kenzan RESTful API server started on: ' + port);
