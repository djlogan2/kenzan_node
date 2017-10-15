'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmployeeSchema = new Schema({

    username: {
        type: String,
        required: 'Please enter username'
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

module.exports = mongoose.model('Employee', EmployeeSchema);
