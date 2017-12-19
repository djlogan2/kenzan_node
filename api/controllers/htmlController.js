var mongoose = require('mongoose');

Employee = mongoose.model('Employee');

var isEmployeeRecordValid = require('../lib/employeevalid');

var defaultError = function(res, firstError)
{
    Employee.find({bStatus: 'ACTIVE'}, function(err, employees) {
        if(err)
            res.render('index', {err: err});
        else {
            res.render('index', { employees: employees, err: firstError});
        }
    });
};

var doIndex  = function(req, res) {
    "use strict";
    Employee.find({bStatus: 'ACTIVE'}, function(err, employees) {
        if(err)
            defaultError(res, err);
        else {
            res.render('index', { employees: employees});
        }
    });
};

exports.index = doIndex;

exports.create = function(req, res) {};

exports.new = function(req, res) {};

exports.show = function(req, res) {};

exports.edit = function(req, res) {
    "use strict";
    Employee.findOne({bStatus: 'ACTIVE', _id: req.params.id}, function(err, employee){
        if(err)
            defaultError(res, 'edit got ' + req.id + ' as an id and found no record');
        else {
            res.render('edit', {employee: employee});
        }
    });
};

exports.update = function(req, res) {
    "use strict";
    var emp = req.body;
    if('save' in emp) {
        delete emp.save;
        var error = isEmployeeRecordValid(emp, true);
        if (error) {
            defaultError(res, error.error);
            return;
        }
        Employee.findOneAndUpdate({_id: emp._id, bStatus: 'ACTIVE'}, emp, {upsert: false}, function (err, updated) {
            if (err || !updated)
                defaultError(res, 'Unable to update record: ' + err.toString());
            else {
                res.render('edit', {employee: emp, err: 'Record updated'});
            }
        })
    } else if ('delete' in emp) {
        Employee.findOneAndUpdate({
            _id: emp._id,
            bStatus: 'ACTIVE'
        }, {bStatus: 'INACTIVE'}, {upsert: false}, function (err, updated) {
            if (err || !updated)
                defaultError(res, 'Unable to delete record: ' + err.toString());
            else {
                res.render('index', {employee: emp, err: 'Record deleted'});
            }
        });
    } else
        defaultError(res, "We don't know what to do with this record");

};
