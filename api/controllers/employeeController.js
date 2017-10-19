var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var errorCode = require('./errorcode');
var _ = require('underscore');

Employee = mongoose.model('Employee');
var JWT = require('./jwt');

function isAuthorized(req, res, role)
{
    var token = req.headers['authorization'];
    if(token)
    {
        var checkJwt = new JWT(token);
        if(checkJwt.isValid() && (!role || checkJwt.isInRole(role)))
            return true;
        else
        {
            res.json({ errorcode: errorCode.NOT_AUTHORIZED_FOR_OPERATION, error: "Not authorized", id: null });
            return false;
        }
    }
    else
    {
        res.json({ errorcode: errorCode.NO_AUTHORIZATION_TOKEN, error: "Not authorized" });
        return false;
    }
}

exports.login = function(req, res) {
    "use strict";
    var login = req.body;
    if(!login || !login.username || !login.password)
        {res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Invalid login structure", jwt: null }); return; }

    Employee.findOne({bStatus: 'ACTIVE', username: login.username }, function(err, emp) {
        if(err) {
            res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: err.message, jwt: null});
            return;
        }

        if(!emp) { res.json({errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Invalid username or password', jwt: null}); return; }

        bcrypt.compare(login.password, emp.password, function(err, res2) {
            if(!res2) { res.json({errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: "Invalid password", jwt:null } ); return; }
            var jwt = new JWT(emp);
            res.json({jwt: jwt.getToken(), error: null, errorcode: errorCode.NONE });
        });
    });

};

exports.get_emp = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res)) return;
    Employee.findOne({bStatus: 'ACTIVE', _id: req.query.id}, function(err, employee){
        if(err)
            res.json({errorcode: errorCode.UNKNOWN_ERROR, error: err.message});
        else {
            res.json(employee);
        }
    });
};

exports.get_all = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res)) return;
  Employee.find({bStatus: 'ACTIVE'}, function(err, employees) {
     if(err)
        res.json({errorcode: errorCode.UNKNOWN_ERROR, error: err.message});
     else {
         res.json(employees);
     }
  });

};

exports.add_emp = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res, "ROLE_ADD_EMP")) return;
    var emp = req.body;
    Employee.findOne({username: emp.username, bStatus: 'ACTIVE'}, function(err, found_emp) {
        if(!err && !found_emp)
        {
            var newEmp = new Employee(
                {
                    username: emp.username,
                    dateOfBirth: emp.dateOfBirth,
                    dateOfEmployment: emp.dateOfEmployment,
                    bStatus: emp.bStatus,
                    firstName: emp.firstName,
                    middleInitial: emp.middleInitial,
                    lastName: emp.lastName
                });
            newEmp.save(function(err, emp){
                if(err && err.message)
                {
                    if(err.name === 'ValidationError')
                        res.json( { errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: err.message, id: null });
                    else
                        res.json( { errorcode: errorCode.UNKNOWN_ERROR, error: err.message, id: null });
                }
                else
                    res.json( { errorcode: errorCode.NONE, error: null, id: emp._id });
            });
//            res.json({ errorcode: errorCode.NONE, error: null, id: newEmp._id });
        }
        else if(err)
        {
            res.json( { errorcode: errorCode.UNKNOWN_ERROR, error: err.message, id: null });
        }
        else
        {
            res.json( { errorcode: errorCode.DUPLICATE_RECORD, error: "Duplicate record", id: null } );
        }
    });
};

exports.update_emp = function(req, res) {
    "use strict";
    var emp = req.body;
    if(!isAuthorized(req, res, "ROLE_UPDATE_EMP")) return;
    Employee.findOneAndUpdate({_id: emp._id, bStatus: 'ACTIVE'}, emp, {upsert: false}, function(err, updated) {
        if(err || !updated) res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to update" });
        else    res.json({ error: null, errorcode: errorCode.NONE, id: emp._id });
    });
};

exports.delete_emp = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res, "ROLE_DELETE_EMP")) return;
    var id = req.query.id;
    Employee.findOneAndUpdate({_id: id, bStatus: 'ACTIVE'}, {bStatus: 'INACTIVE'}, {upsert: false}, function(err, updated) {
        if(err) res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to delete" });
        else    res.json({ error: null, errorcode: errorCode.NONE, id: id });
    });
};

exports.set_password = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res, "ROLE_SET_PASSWORD")) return;
    res.json( { errorcode: errorCode.UNKNOWN_ERROR, error: "Not implemented" });
};
