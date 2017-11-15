'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var isEmployeeValid = require('../lib/employeevalid');
var bcrypt = require('bcrypt');

var EmployeeSchema = new Schema({

    username: {
        type: String,
        required: 'Please enter username'
    },

    email: {
        type: String,
        required: 'Please enter email'
    },

    firstName: {
        type: String,
        required: 'Please enter first name'
    },

    middleInitial: {
        type: String
    },

    lastName: {
        type: String,
        required: 'Please enter last name'
    },

    bStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        deafult: 'ACTIVE',
        required: 'Please enter status'
    },

    dateOfBirth: {
        type: Date,
        required: 'Please enter date of birth'
    },

    dateOfEmployment: {
        type: Date
    },

    password: {
        type: String
    },

    roles: {
        type: [String]
    }

});
/*
 * It is too hard to figure out how to implement these supposed
 * hooks. The idea of a hook such as this is to ensure that any
 * future programmers do not screw up and make calls that don't
 * meet the requirements. In the case of mongoose, only a small
 * number of calls go through the hooks. There are like 15 hooks,
 * all with different undocumented parameters, that get called
 * when mongoose calls are made. This is ridiculous, and
 * effectively impossible to implement the full suite of hooks
 * that would ensure the success of future programmers. So,
 * I am removing them, putting them back into the controller
 * code, and I am going to rely in valid unit/system/integration
 * tests.
 *
EmployeeSchema.pre('validate', function(next){
    isEmployeeValid(this, false);
    return next();
});

EmployeeSchema.pre('save', function(next) {
    var emp = this;
    if('password' in this)
        bcrypt.hash(emp.password, 10, function(err, hash){
            if(err) return next(err);
            emp.password = hash;
            next();
        });
    else
        next();
});

EmployeeSchema.pre('count', function(next){
    console.log('count');
});

EmployeeSchema.pre('find', function(next){
    this.getQuery().bStatus = 'ACTIVE';
    next();
});

EmployeeSchema.pre('findOne', function(next){
    console.log('findOne');
});

EmployeeSchema.pre('findOneAndRemove', function(next){
    console.log('findOneAndRemove');
});

EmployeeSchema.pre('findOneAndUpdate', function(next){
    console.log('findOneAndUpdate');
});

EmployeeSchema.pre('update', function(next){
    console.log('update');
});
*/
EmployeeSchema.statics.authenticate = function(username, password, callback) {
    Employee.findOne({bStatus: 'ACTIVE', username: username}, function(err, emp){
        if(err || !emp) return callback(err || 'Invalid username or password');
        bcrypt.compare(password, emp.password, function(err, res){
            if(res === true) return callback(null, emp);
            else return callback();
        });
    });
}

module.exports = mongoose.model('Employee', EmployeeSchema);
