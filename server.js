var express = require('express'),
    errorCode = require('./api/controllers/errorcode'),
    JWT = require('./api/controllers/jwt'),
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
    var requirements = {
        'login': 'OK',
        'add_emp' : 'ROLE_ADD_EMP',
        'update_emp': 'ROLE_UPDATE_EMP',
        'delete_emp': 'ROLE_DELETE_EMP'
    };

    var role = requirements[_.findKey(requirements, function(value, key) {return req.url.indexOf(key) > -1;})];

    if(role === 'OK') { next(); return; } // Return if we are in the login function

    var token = req.headers['authorization'];

    if(token)
    {
        var checkJwt = new JWT(token);
        if(!checkJwt.isValid()) {
            res.json({errorcode: checkJwt.errorcode, error: checkJwt.error, id: null});
            return;
        }

        if(!role || checkJwt.isInRole(role)) {
            req.payload = checkJwt.payload;
            next(); return;
        } else
        {
            res.json({ errorcode: errorCode.NOT_AUTHORIZED_FOR_OPERATION, error: "Not authorized", id: null });
            return;
        }
    }
    else
    {
        res.json({ errorcode: errorCode.NO_AUTHORIZATION_TOKEN, error: "No authorization token", id: null });
        return;
    }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(authorize);

/*
app.use(function myauth(req, res, next){
   "use strict";
   req.challenge = req.get('Authorization');
   if(req.challenge)
   {
       var checkJwt = new JWT(req.challenge);
       if(!checkJwt.isValid()) {
           req.authentication = {errorcode: checkJwt.errorcode, error: checkJwt.error, id: null};
       }

       if(!role || checkJwt.isInRole(role))
           req.authentication = checkJwt.payload.username;
       else
       {
           res.json({ errorcode: errorCode.NOT_AUTHORIZED_FOR_OPERATION, error: "Not authorized", id: null });
           return [false, null];
       }
   }
   else
   {
       res.json({ errorcode: errorCode.NO_AUTHORIZATION_TOKEN, error: "No authorization token", id: null });
       return [false, null];
   }
});
 */

var routes = require('./api/routes/kenzanRoutes');
routes(app);

app.listen(port);

console.log('Kenzan RESTful API server started on: ' + port);
