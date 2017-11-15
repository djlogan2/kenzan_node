var Client = require('../api/lib/restclient');
var assert = require('assert');
var errorCode = require('../api/lib/errorcode');
var _ = require('underscore');
var JWT = require('../api/lib/jwt');

//var URL = "http://localhost:8080/Kenzan/rest"; var DB_ID = 12345678;  //    Java/Tomcat
var URL = "http://192.168.1.69:3000/rest"; var DB_ID = 12345678;             //    Ruby server
//var URL = "http://localhost:3000/rest"; var DB_ID = '59ece620be2b19821cfba9ec';             //    Our node.js server
//var URL = "http://192.168.1.101:65376/rest";  DB_ID = 12345678;    //    Windows C#

var RestClient = require('node-rest-client').Client;
var restclient = new RestClient();

var variousUsers = ['kenzan', 'kenzana', 'kenzand', 'kenzanu', 'kenzanad', 'kenzanau', 'kenzandu', 'kenzanadu'];

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

function areEmployeeRecordsEqual(e1, e2) {
    "use strict";
    return (
        e1.username === e2.username &&
        e1.email === e2.email &&
        e1.firstName === e2.firstName &&
        optionalCompare("middleInitial", e1, e2) &&
        e1.lastName === e2.lastName &&
        e1.bStatus === e2.bStatus &&
        (e1.dateOfBirth && e2.dateOfBirth && e1.dateOfBirth.getTime() === e2.dateOfBirth.getTime()) &&
        optionalCompare("dateOfEmployment", e1, e2, function (d1, d2) {
            return d1.getTime() === d2.getTime();
        })
    );
}

var dob = new Date(1980, 0, 1);
var doe = new Date(1990, 0, 1);
var mi = 0;

function newEmployee(prefix) {
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
    emp.dateOfBirth.setHours(0, 0, 0, 0);
    emp.dateOfEmployment.setHours(0, 0, 0, 0);

    dob.setDate(dob.getDate() + 1);
    doe.setDate(doe.getDate() + 1);

    testno++;
    return emp;
}

function login(username, password, asyncCallback) {
    "use strict";
    var clientuser = new Client(URL);
    clientuser.login(username, password, function (resp) {
        assert.notEqual(resp, null, 'response should not be null');
        assert.ok("error" in resp, 'response should have an error field');
        assert.ok("errorcode" in resp, 'response should have an error code field');
        assert.ok("jwt" in resp, 'response should have a jwt field');
        assert.equal(resp.error, null, 'response error expected to be null');
        assert.equal(resp.errorcode, errorCode.NONE, 'status code should indicate success');
        assert.notEqual(resp.jwt, null, 'response jwt expected to have a value');
        asyncCallback(clientuser);
    });
}

function addNewEmployee(prefix, asyncCallback) {
    "use strict";
    login('kenzanadu', 'kenzan', function (clientuser) {
        var emp = newEmployee(prefix);
        clientuser.addEmployee(emp, function (resp) {
            assert.notEqual(resp, null, 'response should not be null');
            assert.ok("error" in resp, 'response should have an error field');
            assert.ok("errorcode" in resp, 'response should have an error code field');
            assert.ok("id" in resp, 'response should have an id field');
            assert.equal(resp.error, null, 'response error should be null');
            assert.equal(resp.errorcode, errorCode.NONE, 'error code should indicate a successful add');
            emp.id = resp.id;
            asyncCallback(emp);
        });
    });
}

describe('Rest server', function () {

    describe('Getting a single record', function () {
        "use strict";
        it('should work if the user has a valid token, no roles necessary', function (done) {
            addNewEmployee('get1', function(added_employee){
                login('kenzan', 'kenzan', function (clientuser2) {
                    clientuser2.getEmployee(added_employee.id, function (get_employee) {
                        assert.notEqual(get_employee, null);
                        assert.ok(areEmployeeRecordsEqual(added_employee, get_employee));
                        done();
                    });
                });
            });
        });

        ['id', 'username', 'firstName', 'middleInitial', 'lastName', 'dateOfBirth', 'dateOfEmployment'].forEach(function(key){
            it('should find a record by ' + key, function(done){
                addNewEmployee('get4', function(added_employee){
                    login('kenzan', 'kenzan', function (clientuser2) {
                        var find = {};
                        find[key] = added_employee[key];
                        clientuser2.getEmployee(find, function (get_employee) {
                            assert.notEqual(get_employee, null);
                            assert.ok(areEmployeeRecordsEqual(added_employee, get_employee));
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if the variable(s) would return duplicate records', function(done){
            addNewEmployee('get5', function(added_employee){
                login('kenzanadu', 'kenzan', function (clientuser2) {
                    added_employee.username = 'get5dup';
                    delete added_employee.id;
                    clientuser2.addEmployee(added_employee, function(){
                        clientuser2.getEmployee({firstName: added_employee.firstName}, function (get_employee) {
                            assert.equal(get_employee, null);
                            done();
                        });
                    });
                });
            });
        });
        it('should find a record using multiple fields', function(done){
            addNewEmployee('get4', function(added_employee){
                login('kenzan', 'kenzan', function (clientuser2) {
                    clientuser2.getEmployee({firstName: added_employee.firstName, lastName: added_employee.lastName}, function (get_employee) {
                        assert.notEqual(get_employee, null);
                        assert.ok(areEmployeeRecordsEqual(added_employee, get_employee));
                        done();
                    });
                });
            });
        });

        it('should fail if no token sent', function (done) {
            addNewEmployee('get2', function(added_employee){
                restclient.get(URL + "/get_emp?id=" + added_employee.id, {
                    headers: {"Content-Type": "application/json"}
                }, function (data) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate expired token');
                    done();
                });
            });
        });

        // This works do to the first test working: it('should work with an active record', function(done){});

        it('should return null with an inactive record', function (done) {
            login('kenzanadu', 'kenzan', function (clientuser) {
                var added_employee = newEmployee('get3');
                clientuser.addEmployee(added_employee, function (resp) {
                    added_employee.id = resp.id;
                    clientuser.deleteEmployee(added_employee.id, function () {
                        clientuser.getEmployee(added_employee.id, function (data) {
                            assert.equal(data, null, 'Response from service should be null (no record returned)');
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('Getting all records', function () {
        "use strict";
        it('should work if the user has a valid token, no roles necessary', function (done) {
            login('kenzan', 'kenzan', function (clientuser) {
                clientuser.getAllEmployees(function (resp) {
                    assert.ok(resp instanceof Array, 'Response from get all employees should be an array');
                    assert.ok(resp.length > 0, 'There should be records in the array');
                    done();
                });
            });
        });

        it('should fail if no token sent', function (done) {
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json"}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate expired token');
                done();
            });
        });

        it('should return all active records', function (done) {
            login('kenzanadu', 'kenzan', function (clientuser) {
                var added_employee = newEmployee('getall');
                clientuser.addEmployee(added_employee, function (resp) {
                    added_employee.id = resp.id;
                    clientuser.getAllEmployees(function (resp) {
                        assert.notEqual(_.find(resp, function (emp) {
                            return emp.id === added_employee.id;
                        }), null, 'should find newly added employee record in get_all');
                        clientuser.deleteEmployee(added_employee.id, function () {
                            clientuser.getAllEmployees(function (resp) {
                                assert.equal(_.find(resp, function (emp) {
                                    return emp.id === added_employee.id;
                                }), null, 'should not find newly added employee record in get_all');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('Adding a record', function () {
        variousUsers.forEach(function (user) {
            var not = '';
            if (user.indexOf('a', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                "use strict";
                login(user, "kenzan", function (clientuser) {
                    clientuser.addEmployee(newEmployee('add1'), function (resp) {
                        assert.notEqual(resp, null, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        if (not === '') {
                            assert.equal(resp.error, null, 'response error should be null');
                            assert.equal(resp.errorcode, errorCode.NONE, 'error code should indicate no error');
                            assert.notEqual(resp.id, null, 'response id should not be null');
                        }
                        else {
                            assert.notEqual(resp.error, null, 'response error should not be null');
                            assert.equal(resp.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                        }
                        done();
                    });
                });
            });

        });

        ["username", "email", "dateOfBirth", "firstName", "lastName", "bStatus"].forEach(function (key) {
            it('should fail without a ' + key, function (done) {
                login("kenzana", "kenzan", function (clientuser) {
                    var emp = newEmployee("add2");
                    delete emp[key];
                    clientuser.addEmployee(emp, function (resp) {
                        assert.notEqual(resp, null, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        assert.notEqual(resp.error, null, 'response error should not be null');
                        assert.equal(resp.errorcode, errorCode.CANNOT_INSERT_MISSING_FIELDS, 'error code should indicate missing fields');
                        done();
                    });
                });
            });
        });

        it('should not fail without a middleInitial', function (done) {
            "use strict";
            login("kenzana", "kenzan", function (clientuser) {
                var emp = newEmployee("add3");
                delete emp.middleInitial;
                clientuser.addEmployee(emp, function (resp) {
                    assert.notEqual(resp, null, 'response should not be null');
                    assert.ok("error" in resp, 'response should have an error field');
                    assert.ok("errorcode" in resp, 'response should have an error code field');
                    assert.ok("id" in resp, 'response should have an id field');
                    assert.equal(resp.error, null, 'response error should be null');
                    assert.equal(resp.errorcode, errorCode.NONE, 'error code indicate success');
                    done();
                });
            });
        });

        it('should fail with a spurious data element', function (done) {
            "use strict";
            login("kenzana", "kenzan", function (clientuser) {
                var emp = newEmployee("add4");
                emp.spuriousField = 'This should fail';
                clientuser.addEmployee(emp, function (resp) {
                    assert.notEqual(resp, null, 'response should not be null');
                    assert.ok("error" in resp, 'response should have an error field');
                    assert.ok("errorcode" in resp, 'response should have an error code field');
                    assert.ok("id" in resp, 'response should have an id field');
                    assert.notEqual(resp.error, null, 'response error should not be null');
                    assert.equal(resp.errorcode, errorCode.CANNOT_INSERT_UNKNOWN_FIELDS, 'error code indicate extra fields');
                    done();
                });
            });
        });

        //
        // Currently there is no way for us to treat the password field as an invalid field in the Java server.
        // Because the field exists in the Employee class, and because it's marked as @JsonIgnore, the validator
        // identifies it as a known field that does not get deserialized. Thus, at this point, there is no way for
        // this test to pass with the Java server. Basically the server will just happily ignore any field marked
        // 'password'.
        //
        it.skip('should fail with a password field', function (done) {
            "use strict";
            login("kenzana", "kenzan", function (clientuser) {
                var emp = newEmployee("add5");
                emp.password = 'password string';
                clientuser.addEmployee(emp, function (resp) {
                    assert.notEqual(resp, null, 'response should not be null');
                    assert.ok("error" in resp, 'response should have an error field');
                    assert.ok("errorcode" in resp, 'response should have an error code field');
                    assert.ok("id" in resp, 'response should have an id field');
                    assert.notEqual(resp.error, null, 'response error should not be null');
                    assert.equal(resp.errorcode, errorCode.CANNOT_INSERT_UNKNOWN_FIELDS, 'error code indicate extra fields');
                    done();
                });
            });
        });

        it('should fail if a duplicate username with an active status is in the database', function (done) {
            "use strict";
            login('kenzana', 'kenzan', function (clientuser) {
                var emp = newEmployee('add6');
                clientuser.addEmployee(emp, function () {
                    clientuser.addEmployee(emp, function (resp) {
                        assert.notEqual(resp, null, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        assert.notEqual(resp.error, null, 'response error should not be null');
                        assert.equal(resp.errorcode, errorCode.DUPLICATE_RECORD, 'error code indicate a duplicate record');
                        done();
                    });
                });
            });
        });

        it('should succeed if a duplicate username with an inactive status is in the database', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                var emp = newEmployee('add7');
                clientuser.addEmployee(emp, function (resp) {
                    clientuser.deleteEmployee(resp.id, function () {
                        clientuser.addEmployee(emp, function (resp) {
                            assert.notEqual(resp, null, 'response should not be null');
                            assert.ok("error" in resp, 'response should have an error field');
                            assert.ok("errorcode" in resp, 'response should have an error code field');
                            assert.ok("id" in resp, 'response should have an id field');
                            assert.equal(resp.error, null, 'response error should not be null');
                            assert.equal(resp.errorcode, errorCode.NONE, 'error code indicate extra fields');
                            done();
                        });
                    });
                });
            });
        });
        it('should fail if no record was sent', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                restclient.post(URL + "/add_emp", {
                    headers: {"Content-Type": "application/json", Authorization: clientuser.jwt}
                }, function (data) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(data.errorcode, errorCode.CANNOT_INSERT_MISSING_FIELDS, 'error code should indicate some type of error');
                    done();
                });
            });
        });
    });

    describe('Updating a record', function () {
        ['kenzan'].forEach(function (user) {
            var not = '';
            if (user.indexOf('u', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                addNewEmployee('update1', function (newEmployeeRecord) {
                    "use strict";
                    login(user, "kenzan", function (clientuser) {
                        var updatedRecord = _.clone(newEmployeeRecord);
                        updatedRecord.firstName = 'Changed by ' + user;
                        updatedRecord.lastName = 'Changed by ' + user;
                        updatedRecord.middleInitial = '1';
                        updatedRecord.dateOfBirth = new Date(1950, 11, 26);
                        updatedRecord.dateOfEmployment = new Date(1940, 12, 25);
                        clientuser.updateEmployee(updatedRecord, function (resp) {
                            assert.notEqual(resp, null, 'response should not be null');
                            assert.ok("error" in resp, 'response should have an error field');
                            assert.ok("errorcode" in resp, 'response should have an error code field');
                            assert.ok("id" in resp, 'response should have an id field');
                            if (not === '') {
                                assert.equal(resp.error, null, 'response error should be null');
                                assert.equal(resp.errorcode, errorCode.NONE, 'error code should indicate no error');
                                assert.notEqual(resp.id, null, 'response id should not be null');
                                clientuser.getEmployee(newEmployeeRecord.id, function (employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(updatedRecord, employee), 'returned record should match our updated data');
                                    done();
                                });
                            }
                            else {
                                assert.notEqual(resp.error, null, 'response error should not be null');
                                assert.equal(resp.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                                clientuser.getEmployee(newEmployeeRecord.id, function (employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(newEmployeeRecord, employee), 'returned record should match the originally added data');
                                    done();
                                });
                            }
                        });
                    });
                });
            });
        });

        ['id', 'username', 'dateOfBirth', 'firstName', 'lastName', 'bStatus'].forEach(function (key) {
            it('should fail if we delete the ' + key, function (done) {
                login('kenzanadu', 'kenzan', function (clientuser) {
                    "use strict";
                    var emp = newEmployee('update2');
                    clientuser.addEmployee(emp, function (resp) {
                        emp.id = resp.id;
                        delete emp[key];
                        clientuser.updateEmployee(emp, function (data) {
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(data.errorcode, errorCode.CANNOT_INSERT_MISSING_FIELDS, 'error code should indicate missing fields');
                            done();
                        });
                    });
                });
            });
        });

        ['middleInitial', 'dateOfEmployment'].forEach(function (key) {
            it('should not fail if we delete the ' + key, function (done) {
                "use strict";
                login('kenzanadu', 'kenzan', function (clientuser) {
                    "use strict";
                    var emp = newEmployee('update3');
                    clientuser.addEmployee(emp, function (resp) {
                        emp.id = resp.id;
                        delete emp[key];
                        clientuser.updateEmployee(emp, function (data) {
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.equal(data.error, null, 'error field should be null');
                            assert.equal(data.errorcode, errorCode.NONE, 'error code should indicate missing fields');
                            clientuser.getEmployee(emp.id, function (updatedEmp) {
                                assert.ok(areEmployeeRecordsEqual(updatedEmp, emp), 'employee records should match');
                                assert.ok(!(key in updatedEmp) || updatedEmp[key] === null, key + ' should no longer be in the updated employee record');
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should fail if the record does not exist', function (done) {
            "use strict";
            var made_up_employee = {
                id: DB_ID,
                username: 'madeup',
                email: 'madeup@madeup.com',
                dateOfBirth: new Date(2000, 1, 1),
                firstName: 'fn_madeup',
                lastName: 'ln_madeup',
                bStatus: 'ACTIVE'
            };
            login('kenzanu', 'kenzan', function (clientuser) {
                clientuser.updateEmployee(made_up_employee, function (data) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(data.errorcode, errorCode.CANNOT_UPDATE_NONEXISTENT_RECORD, 'error code should indicate no record to update');
                    done();
                });
            });
        });

        it('should fail if the record is inactive', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                var emp = newEmployee('update4');
                clientuser.addEmployee(emp, function (resp) {
                    emp.id = resp.id;
                    clientuser.deleteEmployee(emp.id, function () {
                        clientuser.updateEmployee(emp, function (data) {
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(data.errorcode, errorCode.CANNOT_UPDATE_NONEXISTENT_RECORD, 'error code should indicate no record to update');
                            done();
                        });
                    });
                });
            });
        });
        it('should fail with an added spurious field', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                var emp = newEmployee('update5');
                clientuser.addEmployee(emp, function (resp) {
                    emp.id = resp.id;
                    emp.something = 'else';
                    clientuser.updateEmployee(emp, function (data) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.CANNOT_INSERT_UNKNOWN_FIELDS, 'error code should indicate there are extra fields');
                        done();
                    });
                });
            });
        });
        // ***** See the skipped test in adding records ***** it.skip('should fail with a password field', function(done){});
        it.skip('should fail if no record was sent', function (done) {
        });
    });

    describe('Deleting a record', function () {
        variousUsers.forEach(function (user) {
            var not = '';
            if (user.indexOf('d', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                addNewEmployee('delete1', function (newEmployeeRecord) {
                    "use strict";
                    login(user, "kenzan", function (clientuser) {
                        clientuser.deleteEmployee(newEmployeeRecord.id, function (resp) {
                            assert.notEqual(resp, null, 'response should not be null');
                            assert.ok("error" in resp, 'response should have an error field');
                            assert.ok("errorcode" in resp, 'response should have an error code field');
                            assert.ok("id" in resp, 'response should have an id field');
                            if (not === '') {
                                assert.equal(resp.error, null, 'response error should be null');
                                assert.equal(resp.errorcode, errorCode.NONE, 'error code should indicate no error');
                                assert.notEqual(resp.id, null, 'response id should not be null');
                                clientuser.getEmployee(newEmployeeRecord.id, function (employee) {
                                    assert.equal(employee, null, 'employee should be null');
                                    done();
                                });
                            }
                            else {
                                assert.notEqual(resp.error, null, 'response error should not be null');
                                assert.equal(resp.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                                clientuser.getEmployee(newEmployeeRecord.id, function (employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(newEmployeeRecord, employee), 'returned record should match the original data');
                                    done();
                                });
                            }
                        });
                    });
                });
            });
        });

        it('should fail if the record is already inactive', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                var emp = newEmployee('delete2');
                clientuser.addEmployee(emp, function (resp) {
                    emp.id = resp.id;
                    clientuser.deleteEmployee(emp.id, function () {
                        clientuser.deleteEmployee(emp.id, function (data) {
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(data.errorcode, errorCode.CANNOT_DELETE_NONEXISTENT_RECORD, 'error code should indicate cannot delete nonexistent record');
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if the record does not exist', function (done) {
            "use strict";
            login('kenzanadu', 'kenzan', function (clientuser) {
                clientuser.deleteEmployee(DB_ID, function (data) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(data.errorcode, errorCode.CANNOT_DELETE_NONEXISTENT_RECORD, 'error code should indicate cannot delete nonexistent record');
                    done();
                });
            });
        });
    });

    describe('Expired authorization token', function () {
        "use strict";
        it('should not allow a get_all', function (done) {
            var jwt = new JWT({
                username: 'kenzanadu',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow a get_emp', function (done) {
            var jwt = new JWT({
                username: 'kenzanadu',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_emp?id=1", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow an add', function (done) {
            var jwt = new JWT({
                username: 'kenzanadu',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.post(URL + "/add_emp", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()},
                data: newEmployee('expired1')
            }, function (data) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow an update', function (done) {
            login('kenzan', 'kenzan', function (clientuser) {
                clientuser.getEmployee(1, function (employee) {
                    var jwt = new JWT({
                        username: 'kenzanadu',
                        roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
                    });
                    jwt.payload.atIssued = new Date();
                    jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
                    jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
                    jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
                    restclient.post(URL + "/update_emp", {
                        headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()},
                        data: employee
                    }, function (data) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                        done();
                    });
                });
            });
        });

        it('should not allow a delete', function (done) {
            var jwt = new JWT({
                username: 'kenzanadu',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/delete_emp?id=1", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow a set password', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.post(URL + "/update_emp", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()},
                data: {username: 'kenzanadu', password: 'newpassword'}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, 'error code should indicate expired token');
                done();
            });
        });
    });

    describe('No authorization token', function () {
        "use strict";
        it('should not allow a get_all', function (done) {
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json"}
            }, function (data) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow a get_emp', function (done) {
            restclient.get(URL + "/get_emp?id=1", {
                headers: {"Content-Type": "application/json"}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow an add', function (done) {
            restclient.post(URL + "/add_emp", {
                headers: {"Content-Type": "application/json"},
                data: newEmployee("noauth1")
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow an update', function (done) {
            "use strict";
            addNewEmployee("noauth2", function (emp) {
                restclient.post(URL + "/update_emp", {
                    headers: {"Content-Type": "application/json"},
                    data: emp
                }, function (data) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                    done();
                });
            });
        });

        it('should not allow a delete', function (done) {
            "use strict";
            addNewEmployee("noauth3", function (emp) {
                restclient.get(URL + "/delete_emp?id=" + emp.id, {headers: {"Content-Type": "application/json"}},
                    function (data) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                        done();
                    });
            });
        });

        it('should not allow a set password', function (done) {
            "use strict";
            restclient.post(URL + "/set_password", {
                data: {username: "kenzan", password: "asdfasdfasdf"},
                headers: {"Content-Type": "application/json"}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.NO_AUTHORIZATION_TOKEN, 'error code should indicate not authorized');
                done();
            });
        });
    });

    //
    // We have already determined that the servers authorization code works with an expired token,
    // so here we are going to skimp on checking every single API, and just call "get_all" for ease,
    // making sure the token checking code of the server checks our various fields correctly.
    //
    describe('Invalid authorization token', function () {
        "use strict";
        it('should fail with an invalid issuer', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.iss = 'Invalid issuer';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUER, 'error code should indicate invalid issuer');
                done();
            });
        });

        it('should fail with an invalid signing key', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.test_signing_key = 'Invalid signing key';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_INVALID_SIGNATURE, 'error code should indicate invalid signature');
                done();
            });
        });

        it('should fail when issue date > expiration date', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.exp = new Date();
            jwt.payload.exp.setMinutes(jwt.payload.exp.getMinutes() + 60);
            jwt.payload.atIssued = new Date(jwt.payload.exp.getTime());
            jwt.payload.atIssued.setMinutes(jwt.payload.exp.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when issue date > now', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() + 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when issuer is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            delete jwt.payload.iss;
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUER, 'error code should indicate invalid issuer');
                done();
            });
        });

        it('should fail when issue date is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.exp = new Date();
            jwt.payload.exp.setMinutes(jwt.payload.exp.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUED, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when expiration date is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            delete jwt.payload.exp;
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_EXPIRATION, 'error code should indicate invalid expiration');
                done();
            });
        });

        it('should fail when header algorithm is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            delete jwt.header.alg;
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_HEADER_INVALID_ALGORITHM, 'error code should indicate invalid algorithm');
                done();
            });
        });

        it('should fail when header algorithm is not HS256', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.header.alg = 'SMEL'; // An abbreviation of 'SoMething ELse' :)
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_HEADER_INVALID_ALGORITHM, 'error code should indicate invalid algorithm');
                done();
            });
        });

        it('should fail if header is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.header = null;
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR, 'error code should indicate invalid algorithm');
                done();
            });
        });
        it('should fail if header is not a valid object', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.header = 'Not an object';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR, 'error code should indicate invalid algorithm');
                done();
            });
        });
        it('should fail if payload is null', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload = null;
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR, 'error code should indicate invalid algorithm');
                done();
            });
        });
        it('should fail if payload is not a valid object', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload = 'Not an object';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR, 'error code should indicate invalid algorithm');
                done();
            });
        });
        it('should fail if issue date is an invalid date', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.exp = new Date();
            jwt.payload.atIssued = 'Not a date';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED, 'error code should indicate invalid issue date');
                done();
            });
        });
        it('should fail if expiration date is an invalid date', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            jwt.payload.atIssued = new Date();
            jwt.payload.exp = 'Not a date';
            restclient.get(URL + "/get_all", {
                headers: {"Content-Type": "application/json", Authorization: jwt.internalGetToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_EXPIRATION, 'error code should indicate invalid expiration date');
                done();
            });
        });
    });

    describe('Setting a password', function () {
        "use strict";
        it('should succeed if an active user sets his own password', function (done) {
            login('kenzanp', 'kenzan', function (adduser) {
                var emp = newEmployee('password');
                adduser.addEmployee(emp, function () {
                    adduser.setPassword(emp.username, emp.username, function () {
                        login(emp.username, emp.username, function () {
                            adduser.setPassword(emp.username, 'someotherpassword', function (data) {
                                assert.notEqual(data, null, 'Response from service should not be null');
                                assert.ok("error" in data, 'error field should exist in service response');
                                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                                assert.equal(data.error, null, 'error field should be null');
                                assert.equal(data.errorcode, errorCode.NONE, 'error code should indicate success');
                                var clientuser2 = new Client(URL);
                                clientuser2.login(emp.username, emp.username, function (data) {
                                    console.log('here 6');
                                    assert.notEqual(data, null, 'Response from service should not be null');
                                    assert.ok("error" in data, 'error field should exist in service response');
                                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                                    assert.notEqual(data.error, null, 'error field should not be null');
                                    assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid password');
                                    login(emp.username, 'someotherpassword', function(data){done()}); // This should pass if we can login!
                                });
                            });
                        });
                    });
                });
            });
        });

        // This works due to the previous test working: it('should succeed if an authorized user sets another active users password', function(done){});
        it('should fail if an authorized user sets another inactive users password', function (done) {
            login('kenzanp', 'kenzan', function (adminuser) {
                var emp = newEmployee('pwinactive');
                adminuser.addEmployee(emp, function (resp) {              // Add the user
                    adminuser.deleteEmployee(resp.id, function () {    // Delete the user (i.e. set inactive)
                        adminuser.setPassword(emp.username, 'doesntmatter', function (data) { // This should now fail
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid password');
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if an unauthorized user sets another active users password', function (done) {
            login('kenzana', 'kenzan', function (adminuser) {
                var emp = newEmployee('opwnauth');
                adminuser.addEmployee(emp, function () {              // Add the user
                    adminuser.setPassword(emp.username, 'doesntmatter', function (data) { // This should now fail
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate invalid password');
                        done();
                    });
                });
            });
        });

        it('should fail if there is no username field on the input', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            restclient.post(URL + "/set_password", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()},
                data: {password: 'somethingelse'}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username');
                done();
            });
        });

        it('should fail if there is no password field on the input', function (done) {
            login('kenzana', 'kenzan', function (clientuser) {
                var newemp = newEmployee('pass1');
                clientuser.addEmployee(newemp, function () {
                    var jwt = new JWT({
                        username: 'kenzanp',
                        roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
                    });
                    restclient.post(URL + "/set_password", {
                        headers: {"Content-Type": "application/json", Authorization: jwt.getToken()},
                        data: {username: newemp.username}
                    }, function (data) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid password');
                        done();
                    });
                });
            });
        });

        it('should fail if there is a spurious field on the input', function (done) {
            login('kenzana', 'kenzan', function (clientuser) {
                var newemp = newEmployee('pass2');
                clientuser.addEmployee(newemp, function () {
                    var jwt = new JWT({
                        username: 'kenzanp',
                        roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
                    });
                    restclient.post(URL + "/set_password", {
                        headers: {"Content-Type": "application/json", Authorization: jwt.getToken()},
                        data: {username: newemp.username, password: 'somethingelse', somethingelse: 'exists'}
                    }, function (data) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username');
                        done();
                    });
                });
            });
        });

        it('should fail if there is no input structure sent', function (done) {
            var jwt = new JWT({
                username: 'kenzanp',
                roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
            });
            restclient.post(URL + "/set_password", {
                headers: {"Content-Type": "application/json", Authorization: jwt.getToken()}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username/password');
                done();
            });
        });
    });

    describe('Logging in', function () {
        "use strict";
        it('fails with an invalid username', function (done) {
            var clientuser = new Client(URL);
            clientuser.login('asdfasdfasdfasdf', 'kenzan', function (resp) {
                assert.notEqual(resp, null, 'response should not be null');
                assert.ok("error" in resp, 'response should have an error field');
                assert.ok("errorcode" in resp, 'response should have an error code field');
                assert.ok("jwt" in resp, 'response should have a jwt field');
                assert.notEqual(resp.error, null, 'response error expected to not be null');
                assert.equal(resp.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'status code should indicate invalid username/password');
                assert.equal(resp.jwt, null, 'response jwt expected to be null');
                done();
            });
        });

        it('fails with an invalid password', function (done) {
            var clientuser = new Client(URL);
            clientuser.login('kenzanadu', 'totallyinvalidpassword', function (resp) {
                assert.notEqual(resp, null, 'response should not be null');
                assert.ok("error" in resp, 'response should have an error field');
                assert.ok("errorcode" in resp, 'response should have an error code field');
                assert.ok("jwt" in resp, 'response should have a jwt field');
                assert.notEqual(resp.error, null, 'response error expected to not be null');
                assert.equal(resp.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'status code should indicate invalid username/password');
                assert.equal(resp.jwt, null, 'response jwt expected to be null');
                done();
            });
        });

        it('fails with a valid combination on an inactive record', function (done) {
            login('kenzanp', 'kenzan', function (clientuser) {
                var emp = newEmployee('inactivelogin');
                clientuser.addEmployee(emp, function (resp) {
                    var addedId = resp.id;
                    clientuser.setPassword(emp.username, 'kenzan', function () {
                        clientuser.deleteEmployee(addedId, function () {
                            var clientuser2 = new Client(URL);
                            clientuser2.login(emp.username, 'kenzan', function (resp) {
                                assert.notEqual(resp, null, 'response should not be null');
                                assert.ok("error" in resp, 'response should have an error field');
                                assert.ok("errorcode" in resp, 'response should have an error code field');
                                assert.ok("jwt" in resp, 'response should have a jwt field');
                                assert.notEqual(resp.error, null, 'response error expected to not be null');
                                assert.equal(resp.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'status code should indicate invalid username/password');
                                assert.equal(resp.jwt, null, 'response jwt expected to be null');
                                done();
                            });
                        });
                    });
                });
            });
        });
        it('should fail if username is null or missing', function (done) {
            restclient.post(URL + "/login", {
                headers: {"Content-Type": "application/json"},
                data: {password: 'kenan'}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username/password');
                done();
            });
        });
        it('should fail if password is null or missing', function (done) {
            restclient.post(URL + "/login", {
                headers: {"Content-Type": "application/json"},
                data: {username: 'kenan'}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username/password');
                done();
            });
        });
        it('should fail if there are spurious keys in the object', function (done) {
            restclient.post(URL + "/login", {
                headers: {"Content-Type": "application/json"},
                data: {username: 'kenzan', password: 'kenan', something: 'else'}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username/password');
                done();
            });
        });
        it('should fail if no object was sent', function (done) {
            restclient.post(URL + "/login", {
                headers: {"Content-Type": "application/json"}
            }, function (data) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(data.errorcode, errorCode.INVALID_USERNAME_OR_PASSWORD, 'error code should indicate invalid username/password');
                done();
            });
        });
    });
});
