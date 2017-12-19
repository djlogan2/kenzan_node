var restclient = require('../api/lib/restclient');
var LocalDate = require('js-joda').LocalDate;
var testno = 0;

function optionalCompare(key, e1, e2, compare) {
    "use strict";
    if (!(key in e1) && !(key in e2)) return true;
    if (!(key in e1) && (key in e2) && e2[key] === null) return true;
    if (!(key in e2) && (key in e1) && e1[key] === null) return true;
    if (!(key in e1) && (key in e2)) return false;
    if (!(key in e2) && (key in e1)) return false;
    if (compare) return compare(e1[key], e2[key]); else return (e1[key] === e2[key]);
}

exports.areEmployeeRecordsEqual = function (e1, e2) {
    "use strict";
    return (
        e1.username === e2.username &&
        e1.email === e2.email &&
        e1.firstName === e2.firstName &&
        optionalCompare("middleInitial", e1, e2) &&
        e1.lastName === e2.lastName &&
        e1.bStatus === e2.bStatus &&
        (e1.dateOfBirth && e2.dateOfBirth && e1.dateOfBirth.equals(e2.dateOfBirth)) &&
        optionalCompare("dateOfEmployment", e1, e2, (d1, d2) => d1.equals(d2))
    );
};

var dob = LocalDate.of(1980, 1, 1);
var doe = LocalDate.of(1990, 1, 1);
var mi = 0;

exports.newEmployee = function (prefix) {
    "use strict";
    var emp = {
        username: "user" + prefix + testno,
        email: 'user' + prefix + testno + '@kenzan.com',
        dateOfBirth: dob,
        dateOfEmployment: doe,
        bStatus: 'ACTIVE',
        firstName: 'fn' + prefix + testno,
        middleInitial: String.fromCharCode(65 + (mi++)),
        lastName: 'ln' + prefix + testno
    };

    //
    // Just make sure we are at midnight to help with future
    // comparisons, since Javascript has no "date without time"
    // object.
    //
    //emp.dateOfBirth.setHours(0, 0, 0, 0);
    //emp.dateOfEmployment.setHours(0, 0, 0, 0);

    dob = dob.plusDays(1); //.setDate(dob.getDate() + 1);
    doe = doe.plusDays(1); //.setDate(doe.getDate() + 1);

    testno++;
    return emp;
};
