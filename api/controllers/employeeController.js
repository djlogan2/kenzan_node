var mongoose = require('mongoose');
Employee = mongoose.model('Employee');
var jwt = require('./jwt');

function Authorized(token, role)
{
    checkJwt = new jwt(token);
    checkJwt.isValid()
  return 1;
}

exports.login = function(req, res) {
    "use strict";

};

exports.get_emp = function(req, res) {};

exports.get_all = function(req, res) {
    "use strict";
    var e = new Employee({username: 'mongoose', firstName: 'mongoose', middleInitial: 'm', lastName: 'mongoose', dateOfBirth: new Date(), bStatus: 'ACTIVE' });
    e.save(function(err) {
        console.log(err)
    });
   console.dir(req);
   var token = req.headers['authorization'];
   if(token)
   {
      if(!Authorized(token)) { res.json({error: "Not authorized" }); return; }
      Employee.find({bStatus: 'ACTIVE'}, function(err, employees) {
         if(err)
            res.send(err);
         else
            res.json(employees);
      });
   }
   else // No token
   {
      return res.json({ error: "No authorization token" });
   };

};

exports.add_emp = function(req, res) {};

exports.update_emp = function(req, res) {};

exports.delete_emp = function(req, res) {};

exports.set_password = function(req, res) {};
