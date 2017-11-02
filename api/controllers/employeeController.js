var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var errorCode = require('./errorcode');
var _ = require('underscore');

Employee = mongoose.model('Employee');
var JWT = require('./jwt');

function isEmployeeRecordValid(res, emp, id_required) {
    "use strict";
    var fieldCount = 6;
    var err = null;

    ['dateOfBirth', 'firstName', 'lastName', 'bStatus', 'username', 'email'].forEach(function (key) {
        if (!(key in emp) || !emp[key]) {
            err = {errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: key + ' is missing', id: null};
        } // Required field(s) do not exist
    });
    if(err) {res.json(err); return false;}

    if (id_required) {
        if (!emp._id) {
            res.json({errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: 'id is missing', id: null});
            return false;
        }
        fieldCount++;
    }
    else if ("_id" in emp) {
        res.json({errorcode: errorCode.UNKNOWN_ERROR, error: 'id not allowed', id: null});
    }

    ['middleInitial', 'dateOfEmployment'].forEach(function (key) {
        if (key in emp) fieldCount++; // Optional fields do exist
    });

    if (Object.keys(emp).length !== fieldCount) {
        res.json({errorcode: errorCode.CANNOT_INSERT_UNKNOWN_FIELDS, error: 'Too many keys in object', id: null});
        return false; // Too many fields
    }

    if((typeof emp.dateOfBirth === 'string' && isNaN((new Date(emp.dateOfBirth)).getTime())) ||
        (typeof emp.dateOfBirth === '[Object Date]') && isNaN(emp.dateOfBirth.getTime()) ||
        (!emp.dateOfBirth || (typeof emp.dateOfBirth !== 'string' && typeof emp.dateOfBirth !== '[Object Date]')))
    {
        res.json({errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid date of birth', id: null});
        return false;
    }

    if(emp.dateOfEmployment) {
        if ((typeof emp.dateOfEmployment === 'string' && isNaN((new Date(emp.dateOfEmployment)).getTime())) ||
            (typeof emp.dateOfEmployment === '[Object Date]') && isNaN(emp.dateOfEmployment.getTime()) ||
            (typeof emp.dateOfEmployment !== 'string' && typeof emp.dateOfEmployment !== '[Object Date]')) {
            res.json({errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid date of employment', id: null});
            return false;
        }
    }

    if(emp.bStatus !== 'ACTIVE' && emp.bStatus !== 'INACTIVE')
    {
        res.json({errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid status', id: null});
        return false;
    }

    return true;
}

function isAuthorized2(req, res, role)
{
    "use strict";
    var token = req.headers['authorization'];
    if(token)
    {
        var checkJwt = new JWT(token);
        if(!checkJwt.isValid()) {
            res.json({errorcode: checkJwt.errorcode, error: checkJwt.error, id: null});
            return [false, null];
        }

        if(!role || checkJwt.isInRole(role))
            return [true, checkJwt.payload.username];
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
}

function isAuthorized(req, res, role)
{
    return isAuthorized2(req, res, role)[0];
}

exports.login = function(req, res) {
    "use strict";
    var login = req.body;
    if(!login || Object.keys(login).length !== 2 || !login.username || !login.password)
    {
        res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to login', id: null });
        return;
    }

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

function ourJson(obj)
{
    "use strict";
    console.log('res.json called');
    console.dir(obj);
    return this.originalJson(obj);
}

exports.add_emp = function(req, res) {
    "use strict";
    //res.originalJson = res.json;
    //res.json = ourJson;
    if(!isAuthorized(req, res, "ROLE_ADD_EMP")) return;
    var emp = req.body;
    if(!isEmployeeRecordValid(res, emp, false)) return;
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
    var err = null;
    if(!isAuthorized(req, res, "ROLE_UPDATE_EMP")) return;
    if(!isEmployeeRecordValid(res, emp, true)) return;

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
    if(!isAuthorized(req, res, "ROLE_DELETE_EMP")) return;
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

    var ia2 = isAuthorized2(req, res);
    if(!ia2[0]) return;

    if(!uid_pass || Object.keys(uid_pass).length !== 2 || !uid_pass.username || !uid_pass.password)
    {
        res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to set users password', id: null });
        return;
    }

    if(ia2[1] != uid_pass.username && !isAuthorized(req, res, 'ROLE_SET_PASSWORD')) return;

    bcrypt.hash(uid_pass.password, 10, function(err, hash){
        Employee.findOneAndUpdate({username: uid_pass.username, bStatus: 'ACTIVE'}, {password: hash}, {upsert: false}, function(err, updated){
            if(!updated) res.json({ errorcode: errorCode.INVALID_USERNAME_OR_PASSWORD, error: 'Unable to set users password', id: null });
            else if(err) res.json({errorcode: errorCode.UNKNOWN_ERROR, error: "Unable to delete", id: null });
            else    res.json({ error: null, errorcode: errorCode.NONE, id: updated.id });
        });
    });
};
