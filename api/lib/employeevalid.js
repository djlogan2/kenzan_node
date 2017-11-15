errorCode = require('./errorcode'),

    module.exports = function isEmployeeRecordValid(emp, id_required) {
    "use strict";
    var fieldCount = 6;
    var err = null;

    ['dateOfBirth', 'firstName', 'lastName', 'bStatus', 'username', 'email'].forEach(function (key) {
        if (!(key in emp) || !emp[key]) {
            err = {errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: key + ' is missing', id: null};
        } // Required field(s) do not exist
    });
    if(err) return err;

    if (id_required) {
        if (!emp._id)
            return {errorcode: errorCode.CANNOT_INSERT_MISSING_FIELDS, error: 'id is missing', id: null};
        fieldCount++;
    }
    else if ("_id" in emp) {
        return {errorcode: errorCode.UNKNOWN_ERROR, error: 'id not allowed', id: null};
    }

    ['middleInitial', 'dateOfEmployment'].forEach(function (key) {
        if (key in emp) fieldCount++; // Optional fields do exist
    });

    if (Object.keys(emp).length !== fieldCount)
        return {errorcode: errorCode.CANNOT_INSERT_UNKNOWN_FIELDS, error: 'Too many keys in object', id: null}; // Too many fields

    if((typeof emp.dateOfBirth === 'string' && isNaN((new Date(emp.dateOfBirth)).getTime())) ||
        (typeof emp.dateOfBirth === '[Object Date]') && isNaN(emp.dateOfBirth.getTime()) ||
        (!emp.dateOfBirth || (typeof emp.dateOfBirth !== 'string' && typeof emp.dateOfBirth !== '[Object Date]')))
    {
        return {errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid date of birth', id: null};
    }

    if(emp.dateOfEmployment) {
        if ((typeof emp.dateOfEmployment === 'string' && isNaN((new Date(emp.dateOfEmployment)).getTime())) ||
            (typeof emp.dateOfEmployment === '[Object Date]') && isNaN(emp.dateOfEmployment.getTime()) ||
            (typeof emp.dateOfEmployment !== 'string' && typeof emp.dateOfEmployment !== '[Object Date]')) {
            return {errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid date of employment', id: null};
        }
    }

    if(emp.bStatus !== 'ACTIVE' && emp.bStatus !== 'INACTIVE')
        return {errorcode: errorCode.UNKNOWN_ERROR, error: 'Invalid status', id: null};

    return null;
}
