var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    errorCode = require('../lib/errorcode'),
    JWT = require('../lib/jwt');

Employee = mongoose.model('Employee');
var isEmployeeRecordValid = require('../lib/employeevalid');

exports.login = function(req, res) {
    "use strict";
    var login = req.body;
    if(!login || Object.keys(login).length !== 2 || !login.username || !login.password)
    {
        res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to login', id: null });
        return;
    }
    Employee.authenticate(login.username, login.password, function(err, emp) {
        if(err) { res.json({errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: err, jwt: null}); return;}
        var jwt = new JWT(emp);
        res.json({jwt: jwt.getToken(), error: null, errorcode: errorCode.NONE });
    });
};

exports.get_emp = function(req, res) {
    "use strict";
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
    var emp = req.body;
    var err = isEmployeeRecordValid(emp, false);

    if(err) { res.json(err); return; }
    //
    // This doesn't appear to be transactional to me. What's stopping another thread from
    // adding this employee after we do our find and before we do our save? Nothing that I know of...
    //
    Employee.findOne({username: emp.username, bStatus: 'ACTIVE'}, function(err, found_emp) {
        if(!err && !found_emp)
        {
            var newEmp = new Employee(
                {
                    username: emp.username,
                    email: emp.email,
                    dateOfBirth: emp.dateOfBirth,
                    dateOfEmployment: emp.dateOfEmployment,
                    bStatus: emp.bStatus,
                    firstName: emp.firstName,
                    middleInitial: emp.middleInitial,
                    lastName: emp.lastName
                });
            newEmp.save(function(err, emp){
                if(err)
                {
                    if(err.name === 'ValidationError')
                        res.json( { errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: err.message, id: null });
                    else
                        res.json( { errorcode: errorCode.UNKNOWN_ERROR, error: err.message, id: null });
                }
                else
                    res.json( { errorcode: errorCode.NONE, error: null, id: emp._id });
            });
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

    var err = isEmployeeRecordValid(res, emp, true);
    if(err) { res.json(err); return; }

    //
    // Make sure mongoose knows to delete the fields
    //
    ['middleInitial', 'dateOfEmployment'].forEach(function(key){
        if(!emp[key]) emp[key] = undefined;
    });

    Employee.findOneAndUpdate({_id: emp._id, bStatus: 'ACTIVE'}, emp, {upsert: false}, function(err, updated) {
        if(err || !updated)
        {
            if(!err || (err && err.kind && err.kind === 'ObjectId'))
                res.json({errorcode: errorCode.CANNOT_UPDATE_NONEXISTENT_RECORD, error: "Unable to update" });
            else
                res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to update" });
        }
        else    res.json({ error: null, errorcode: errorCode.NONE, id: emp._id });
    });
};

exports.delete_emp = function(req, res) {
    "use strict";
    var id = req.query.id;
    Employee.findOneAndUpdate({_id: id, bStatus: 'ACTIVE'}, {bStatus: 'INACTIVE'}, {upsert: false}, function(err, updated) {
        if(err)
            res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to delete", id: null });
        else if(!updated)
            res.json({ errorcode: errorCode.CANNOT_DELETE_NONEXISTENT_RECORD, error: 'Unable to delete', id: null });
        else
            res.json({ error: null, errorcode: errorCode.NONE, id: id });
    });
};

exports.set_password = function(req, res) {
    "use strict";
    var uid_pass = req.body;

    if(!uid_pass || Object.keys(uid_pass).length !== 2 || !uid_pass.username || !uid_pass.password)
    {
        res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to set users password', id: null });
        return;
    }

    if(req.jwt.payload.username !== uid_pass.username && !req.jwt.isInRole('ROLE_SET_PASSWORD'))
    {
        res.json({ errorcode: errorCode.NOT_AUTHORIZED_FOR_OPERATION, error: 'Unable to set users password', id: null });
        return;
    }

    bcrypt.hash(uid_pass.password, 10, function(err, hash){
        Employee.findOneAndUpdate({username: uid_pass.username, bStatus: 'ACTIVE'}, {password: hash}, {upsert: false}, function(err, updated){
            if(!updated) res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to set users password', id: null });
            else if(err) res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to delete", id: null });
            else    res.json({ error: null, errorcode: errorCode.NONE, id: updated.id });
        });
    });
};
