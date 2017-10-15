var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

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
            res.json({ error: "Not authorized" });
            return false;
        }
    }
    else
    {
        res.json({ error: "Not authorized" });
        return false;
    }
}

exports.login = function(req, res) {
    "use strict";
    var login = req.body;
    if(!login || !login.username || !login.password)
        {res.json("Invalid login structure"); return; }

    Employee.findOne({bStatus: 'ACTIVE', username: login.username }, function(err, emp) {
        if(err) {
            res.json({error: err.message});
            return;
        }

        bcrypt.compare(login.password, emp.password, function(err, res2) {
            if(!res2) { res.json({error: "Invalid password" } ); return; }
            var jwt = new JWT(emp);
            res.json({jwt: jwt.getToken() });
        });
    });

};

exports.get_emp = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res)) return;
};

exports.get_all = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res)) return;
  Employee.find({bStatus: 'ACTIVE'}, function(err, employees) {
     if(err)
        res.json({error: err.message});
     else
        res.json(employees);
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
            newEmp.save();
            res.json({ error: "ok", id: newEmp._id });
        }
        else if(err)
        {
            res.json( { error: err.message });
        }
        else
        {
            res.json( { error: "Duplicate record" } );
        }
    });
};

exports.update_emp = function(req, res) {
    "use strict";
    var emp = req.body;
    if(!isAuthorized(req, res, "ROLE_UPDATE_EMP")) return;
    Employee.findOneAndUpdate({_id: emp._id, bStatus: 'ACTIVE'}, emp, {upsert: false}, function(err, updated) {
        if(err || !updated) res.json({error: "Unable to update" });
        else    res.json({ error: "ok" });
    });
};

exports.delete_emp = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res, "ROLE_DELETE_EMP")) return;
    var id = req.query.id;
    Employee.findOneAndUpdate({_id: id, bStatus: 'ACTIVE'}, {bStatus: 'INACTIVE'}, {upsert: false}, function(err, updated) {
        if(err) res.json({error: "Unable to delete" });
        else    jres.json({ error: "ok" });
    });
};

exports.set_password = function(req, res) {
    "use strict";
    if(!isAuthorized(req, res, "ROLE_SET_PASSWORD")) return;
    res.json( { error: "Not implemented" });
};
