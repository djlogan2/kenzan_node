var client = require('./restclient');
var assert = require('assert');
var errorCode = require('../api/controllers/errorcode');
var _ = require('underscore');
var JWT = require('../api/controllers/jwt');

//var URL = "http://localhost:8080/Kenzan/rest"; //    Java/Tomcat
var URL = "http://localhost:3000";             //    Our node.js server
//var URL = "http://192.168.1.101:65376/rest";   //    Windows C#

var RestClient = require('node-rest-client').Client;
var restclient = new RestClient();

var variousUsers = ['kenzan', 'kenzana', 'kenzand', 'kenzanu', 'kenzanad', 'kenzanau', 'kenzandu', 'kenzanadu'];

var testno = 0;

function areEmployeeRecordsEqual(e1, e2) {
    "use strict";
    return (
      e1.username === e2.username &&
      e1.firstName === e2.firstName &&
      e1.middleInitial === e2.middleInitial &&
      e1.lastName === e2.lastName &&
      e1.bStatus === e2.bStatus &&
        (e1.dateOfBirth && e2.dateOfBirth && e1.dateOfBirth.getTime() === e2.dateOfBirth.getTime()) &&
        ((!e1.dateOfEmployment && !e2.dateOfEmployment) || (e1.dateOfEmployment && e2.dateOfEmployment && e1.dateOfEmployment.getTime() === e2.dateOfEmployment.getTime()))
    );
}

function newEmployee(prefix) {
    "use strict";
    var emp = {
        username: "user" + prefix + testno,
        dateOfBirth: new Date(),
        dateOfEmployment: new Date(),
        bStatus: 'ACTIVE',
        firstName: 'fn' + prefix + testno,
        middleInitial: 'X',
        lastName: 'ln' + prefix + testno
    };
    //
    // Just make sure we are at midnight to help with future
    // comparisons, since Javascript has no "date without time"
    // object.
    //
    emp.dateOfBirth.setHours(0, 0, 0, 0);
    emp.dateOfEmployment.setHours(0, 0, 0, 0);
    testno++;
    return emp;
}

function login(username, password, asyncCallback)
{
    "use strict";
    var clientuser = new client(URL);
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

function addNewEmployee(prefix, asyncCallback)
{
    "use strict";
    login('kenzanadu', 'kenzan', function(clientuser){
        var emp = newEmployee(prefix);
        clientuser.addEmployee(emp, function(resp){
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

    describe('Getting a single record', function(){
        "use strict";
        it('should work if the user has a valid token, no roles necessary', function(done){
            login('kenzana', 'kenzan', function(clientuser){
                var added_employee = newEmployee('get1');
                clientuser.addEmployee(added_employee, function(data){
                    added_employee.id = data.id;
                    login('kenzan', 'kenzan', function(clientuser2){
                        clientuser2.getEmployee(added_employee.id, function(get_employee){
                            assert.ok(areEmployeeRecordsEqual(added_employee, get_employee));
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if no token sent', function(done){
            login('kenzana', 'kenzan', function(clientuser){
                var added_employee = newEmployee('get1');
                clientuser.addEmployee(added_employee, function(data){
                    added_employee.id = data.id;
                    restclient.get(URL + "/get_emp?id=" + added_employee.id, {
                        headers: { "Content-Type": "application/json" }
                    }, function (data, response) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate expired token');
                        done();
                    });
                });
            });
        });

        // This works do to the first test working: it('should work with an active record', function(done){});

        it('should return null with an inactive record', function(done){
            login('kenzanadu', 'kenzan', function(clientuser){
                var added_employee = newEmployee('get2');
                clientuser.addEmployee(added_employee, function(resp){
                    added_employee.id = resp.id;
                    clientuser.deleteEmployee(added_employee.id, function(resp){
                        clientuser.getEmployee(added_employee.id, function(data){
                            assert.equal(data, null, 'Response from service should be null (no record returned)');
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('Getting all records', function(){
        "use strict";
        it('should work if the user has a valid token, no roles necessary', function(done){
            login('kenzan', 'kenzan', function(clientuser){
                clientuser.getAllEmployees(function(resp){
                    assert.ok(resp instanceof Array, 'Response from get all employees should be an array');
                    assert.ok(resp.length > 0, 'There should be records in the array');
                    done();
                });
            });
        });

        it('should fail if no token sent', function(done){
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json" }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });

        it('should return all active records', function(done){
            login('kenzanadu', 'kenzan', function(clientuser){
                var added_employee = newEmployee('getall');
                clientuser.addEmployee(added_employee, function(resp){
                    added_employee.id = resp.id;
                    clientuser.getAllEmployees(function(resp){
                        assert.notEqual(null , _.find(resp, function(emp){
                            return emp.id == added_employee.id;
                        }), 'should find newly added employee record in get_all');
                        clientuser.deleteEmployee(added_employee.id, function(resp){
                            clientuser.getAllEmployees(function(resp){
                                assert.equal(null , _.find(resp, function(emp){ return emp.id == added_employee.id; }), 'should no longer find newly added employee record in get_all');
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
                    });
                    done();
                });
            });

        });

        ["username", "dateOfBirth", "firstName", "lastName", "bStatus"].forEach(function(key){
            it('should fail without a ' + key, function(done){
                login("kenzana", "kenzan", function(clientuser){
                    var emp = newEmployee("add2");
                    delete emp[key];
                    clientuser.addEmployee(emp, function(resp){
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
            login("kenzana", "kenzan", function(clientuser){
                var emp = newEmployee("add3");
                delete emp.middleInitial;
                clientuser.addEmployee(emp, function(resp){
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

        it.skip('should fail with a spurious data element', function (done) {
            "use strict";
            login("kenzana", "kenzan", function(clientuser){
                var emp = newEmployee("add4");
                emp.spuriousField = 'This should fail';
                clientuser.addEmployee(emp, function(resp){
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

        it.skip('should fail with a password field', function (done) {
            "use strict";
            login("kenzana", "kenzan", function(clientuser){
                var emp = newEmployee("add4");
                emp.password = 'password string';
                clientuser.addEmployee(emp, function(resp){
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

        it('should fail if a duplicate username with an active status is in the database', function(done){
            "use strict";
            login('kenzana', 'kenzan', function(clientuser){
                var emp = newEmployee('add5');
                clientuser.addEmployee(emp, function(resp){
                    clientuser.addEmployee(emp, function(resp){
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

        it('should succeed if a duplicate username with an inactive status is in the database', function(done){
            "use strict";
            login('kenzanadu', 'kenzan', function(clientuser){
                var emp = newEmployee('add6');
                clientuser.addEmployee(emp, function(resp){
                    clientuser.deleteEmployee(resp.id, function(resp){
                        clientuser.addEmployee(emp, function(resp){
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
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(employee, updatedRecord), 'returned record should match our updated data');
                                    done();
                                });
                            }
                            else {
                                assert.notEqual(resp.error, null, 'response error should not be null');
                                assert.equal(resp.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(employee, newEmployeeRecord), 'returned record should match the originally added data');
                                    done();
                                });
                            }
                        });
                    });
                });
            });
        });

        ['username', 'dateOfBirth', 'firstName', 'lastName', 'bStatus'].forEach(function(key){
            it('should fail if we delete the ' + key, function(done){
                login('kenzanadu', 'kenzan', function(clientuser){
                    "use strict";
                    var emp = newEmployee('update2');
                    clientuser.addEmployee(emp, function(resp){
                        emp.id = resp.id;
                        delete emp[key];
                        clientuser.updateEmployee(emp, function(data){
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(errorCode.CANNOT_INSERT_MISSING_FIELDS, data.errorcode, 'error code should indicate missing fields');
                            done();
                        });
                    });
                });
            });
        });

        ['middleInitial', 'dateOfEmployment'].forEach(function(key){
            it('should not fail if we delete the ' + key, function(done){
                "use strict";
                login('kenzanadu', 'kenzan', function(clientuser){
                    "use strict";
                    var emp = newEmployee('update2');
                    clientuser.addEmployee(emp, function(resp){
                        emp.id = resp.id;
                        delete emp[key];
                        clientuser.updateEmployee(emp, function(data){
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.equal(data.error, null, 'error field should not be null');
                            assert.equal(errorCode.NONE, data.errorcode, 'error code should indicate missing fields');
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if the record does not exist', function(done){
            "use strict";
            var made_up_employee = {
                id: 12345678,
                username: 'madeup',
                dateOfBirth: new Date(2000, 1, 1),
                firstName: 'fn_madeup',
                lastName: 'ln_madeup',
                bStatus: 'ACTIVE'
            };
            login('kenzanu', 'kenzan', function(clientuser){
                clientuser.updateEmployee(made_up_employee, function(data){
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(errorCode.CANNOT_UPDATE_NONEXISTENT_RECORD, data.errorcode, 'error code should indicate no record to update');
                    done();
                });
            });
        });

        it('should fail if the record is inactive', function(done){
            "use strict";
            login('kenzanadu', 'kenzan', function(clientuser){
                var emp = newEmployee('update3');
                clientuser.addEmployee(emp, function(resp){
                    emp.id = resp.id;
                    clientuser.deleteEmployee(emp.id, function(resp){
                        clientuser.updateEmployee(emp, function(data){
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(errorCode.CANNOT_UPDATE_NONEXISTENT_RECORD, data.errorcode, 'error code should indicate no record to update');
                            done();
                        });
                    });
                });
            });
        });
        it.skip('should fail with an added spurious field', function(done){});
        it.skip('should fail with a password field', function(done){});
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
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.equal(employee, null, 'employee should be null');
                                    done();
                                });
                            }
                            else {
                                assert.notEqual(resp.error, null, 'response error should not be null');
                                assert.equal(resp.errorcode, errorCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(areEmployeeRecordsEqual(employee, newEmployeeRecord), 'returned record should match the original data');
                                    done();
                                });
                            }
                        });
                    });
                });
            });
        });

        it('should fail if the record is already inactive', function(done){
            "use strict";
            login('kenzanadu', 'kenzan', function(clientuser){
                var emp = newEmployee('delete2');
                clientuser.addEmployee(emp, function(resp){
                    emp.id = resp.id;
                    clientuser.deleteEmployee(emp.id, function(resp){
                        clientuser.deleteEmployee(emp.id, function(data){
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(errorCode.CANNOT_DELETE_NONEXISTENT_RECORD, data.errorcode, 'error code should indicate cannot delete nonexistent record');
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if the record does not exist', function(done){
            "use strict";
            login('kenzanadu', 'kenzan', function(clientuser){
                clientuser.deleteEmployee(12345678, function(data){
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(errorCode.CANNOT_DELETE_NONEXISTENT_RECORD, data.errorcode, 'error code should indicate cannot delete nonexistent record');
                    done();
                });
            });
        });
    });

    describe('Expired authorization token', function () {
        "use strict";
        it('should not allow a get_all', function(done){
            var jwt = new JWT({username: 'kenzanadu', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow a get_emp', function(done){
            var jwt = new JWT({username: 'kenzanadu', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_emp?id=1", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow an add', function(done){
            var jwt = new JWT({username: 'kenzanadu', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.post(URL + "/add_emp", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() },
                data: newEmployee('expired1')
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow an update', function(done){
            login('kenzan', 'kenzan', function(clientuser){
                clientuser.getEmployee(1, function(employee){
                    var jwt = new JWT({username: 'kenzanadu', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
                    jwt.payload.atIssued = new Date();
                    jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
                    jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
                    jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
                    restclient.post(URL + "/update_emp", {
                        headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() },
                        data: employee
                    }, function (data, response) {
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                        done();
                    });
                });
            });
        });

        it('should not allow a delete', function(done){
            var jwt = new JWT({username: 'kenzanadu', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/delete_emp?id=1", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });

        it('should not allow a set password', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() - 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.post(URL + "/update_emp", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() },
                data: {username: 'kenzanadu', password: 'newpassword'}
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED, data.errorcode, 'error code should indicate expired token');
                done();
            });
        });
    });

    describe('No authorization token', function () {
        "use strict";
        it('should not allow a get_all', function(done){
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json" }
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow a get_emp', function(done){
            restclient.get(URL + "/get_emp?id=1", {
                headers: { "Content-Type": "application/json" }
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow an add', function(done){
            restclient.post(URL + "/add_emp", {
                headers: {"Content-Type": "application/json", },
                data: newEmployee("noauth1")
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
                done();
            });
        });

        it('should not allow an update', function(done){
            "use strict";
            addNewEmployee("noauth2", function(emp) {
                restclient.post(URL + "/update_emp", {
                    headers: {"Content-Type": "application/json"},
                    data: emp
                }, function (data, response) {
                    assert.notEqual(data, null, 'Response from service should not be null');
                    assert.ok("error" in data, 'error field should exist in service response');
                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                    assert.notEqual(data.error, null, 'error field should not be null');
                    assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
                    done();
                });
            });
        });

        it('should not allow a delete', function(done){
            "use strict";
            addNewEmployee("noauth3", function(emp) {
                restclient.get(URL + "/delete_emp?id=" + emp.id, {headers: {"Content-Type": "application/json"}},
                    function (data, response) {
                        //var resp = JSON.parse(data.toString());
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
                        done();
                    });
            });
        });

        it('should not allow a set password', function(done){
            "use strict";
            restclient.post(URL + "/set_password", {
                data: {username: "kenzan", password: "asdfasdfasdf"},
                headers: {"Content-Type": "application/json"}
            }, function (data, response) {
                //var resp = JSON.parse(data.toString());
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.NO_AUTHORIZATION_TOKEN, data.errorcode, 'error code should indicate not authorized');
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
        it('should fail with an invalid issuer', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.iss = 'Invalid issuer';
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.getToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUER, data.errorcode, 'error code should indicate invalid issuer');
                done();
            });
        });

        it('should fail with an invalid signing key', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.test_signing_key = 'Invalid signing key';
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.getToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_TOKEN_INVALID_SIGNATURE, data.errorcode, 'error code should indicate invalid signature');
                done();
            });
        });

        it('should fail when issue date > expiration date', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.exp = new Date();
            jwt.payload.exp.setMinutes(jwt.payload.exp.getMinutes() - 120);
            jwt.payload.atIssued = new Date(jwt.payload.exp.getTime());
            jwt.payload.atIssued.setMinutes(jwt.payload.exp.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED, data.errorcode, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when issue date > now', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            jwt.payload.atIssued.setMinutes(jwt.payload.atIssued.getMinutes() + 120);
            jwt.payload.exp = new Date(jwt.payload.atIssued.getTime());
            jwt.payload.exp.setMinutes(jwt.payload.atIssued.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED, data.errorcode, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when issuer is null', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            delete jwt.payload.iss;
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.getToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUER, data.errorcode, 'error code should indicate invalid issuer');
                done();
            });
        });

        it('should fail when issue date is null', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.exp = new Date();
            jwt.payload.exp.setMinutes(jwt.payload.exp.getMinutes() + 60);
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUED, data.errorcode, 'error code should indicate invalid issued');
                done();
            });
        });

        it('should fail when expiration date is null', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.payload.atIssued = new Date();
            delete jwt.payload.exp;
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_EXPIRATION, data.errorcode, 'error code should indicate invalid expiration');
                done();
            });
        });

        it('should fail when header algorithm is null', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            delete jwt.header.alg;
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_HEADER_INVALID_ALGORITHM, data.errorcode, 'error code should indicate invalid algorithm');
                done();
            });
        });

        it('should fail when header algorithm is not HS256', function(done){
            var jwt = new JWT({username: 'kenzanp', roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD' ] });
            jwt.header.alg = 'SMEL'; // An abbreviation of 'SoMething ELse' :)
            restclient.get(URL + "/get_all", {
                headers: { "Content-Type": "application/json", Authorization: jwt.internalGetToken() }
            }, function (data, response) {
                assert.notEqual(data, null, 'Response from service should not be null');
                assert.ok("error" in data, 'error field should exist in service response');
                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                assert.notEqual(data.error, null, 'error field should not be null');
                assert.equal(errorCode.INVALID_AUTHORIZATION_HEADER_INVALID_ALGORITHM, data.errorcode, 'error code should indicate invalid algorithm');
                done();
            });
        });
    });

    describe('Setting a password', function(){
        "use strict";
        it('should succeed if an active user sets his own password', function(done){
            var clientuser = new client(URL);
            login('kenzanp', 'kenzan', function (adduser) {
                var emp = newEmployee('password');
                adduser.addEmployee(emp, function(resp){
                    adduser.setPassword(emp.username, emp.username, function(resp){
                        login(emp.username, emp.username, function(newuser){
                            adduser.setPassword(emp.username, 'someotherpassword', function(data){
                                assert.notEqual(data, null, 'Response from service should not be null');
                                assert.ok("error" in data, 'error field should exist in service response');
                                assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                                assert.equal(data.error, null, 'error field should be null');
                                assert.equal(errorCode.NONE, data.errorcode, 'error code should indicate success');
                                var clientuser2 = new client(URL);
                                clientuser2.login(emp.username, emp.username, function (data) {
                                    assert.notEqual(data, null, 'Response from service should not be null');
                                    assert.ok("error" in data, 'error field should exist in service response');
                                    assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                                    assert.notEqual(data.error, null, 'error field should not be null');
                                    assert.equal(errorCode.INVALID_USERNAME_OR_PASSWORD, data.errorcode, 'error code should indicate invalid password');
                                    login(emp.username, 'someotherpassword', function(resp){done();}); // This should pass if we can login!
                                });
                            });
                        });
                    });
                });
            });
        });

        // This works due to the previous test working: it('should succeed if an authorized user sets another active users password', function(done){});
        it('should fail if an authorized user sets another inactive users password', function(done){
            login('kenzanp', 'kenzan', function(adminuser) {
                var emp = newEmployee('pwinactive');
                adminuser.addEmployee(emp, function(resp){              // Add the user
                    adminuser.deleteEmployee(resp.id, function(resp){    // Delete the user (i.e. set inactive)
                        adminuser.setPassword(emp.username, 'doesntmatter', function(data) { // This should now fail
                            assert.notEqual(data, null, 'Response from service should not be null');
                            assert.ok("error" in data, 'error field should exist in service response');
                            assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                            assert.notEqual(data.error, null, 'error field should not be null');
                            assert.equal(errorCode.INVALID_USERNAME_OR_PASSWORD, data.errorcode, 'error code should indicate invalid password');
                            done();
                        });
                    });
                });
            });
        });

        it('should fail if an unauthorized user sets another active users password', function(done){
            login('kenzana', 'kenzan', function(adminuser) {
                var emp = newEmployee('pwinactive');
                adminuser.addEmployee(emp, function(resp){              // Add the user
                    adminuser.setPassword(emp.username, 'doesntmatter', function(data) { // This should now fail
                        assert.notEqual(data, null, 'Response from service should not be null');
                        assert.ok("error" in data, 'error field should exist in service response');
                        assert.ok("errorcode" in data, 'errorcode field should exist in service response');
                        assert.notEqual(data.error, null, 'error field should not be null');
                        assert.equal(errorCode.NOT_AUTHORIZED_FOR_OPERATION, data.errorcode, 'error code should indicate invalid password');
                        done();
                    });
                });
            });
        });
    });

    describe('Logging in', function(){
        "use strict";
        it('fails with an invalid username', function(done){
            var clientuser = new client(URL);
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

        it('fails with an invalid password', function(done){
            var clientuser = new client(URL);
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

        it('fails with a valid combination on an inactive record', function(){
            login('kenzanp', 'kenzan', function(clientuser){
                var emp = new Employee('inactivelogin');
                clientuser.addEmployee(emp, function(resp){
                    clientuser.setPassword(emp.username, 'kenzan', function(done){
                        clientuser.deleteEmployee(resp.id, function(resp){
                            var clientuser2 = new client(URL);
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

        it.skip('should fail if there is no username field on the input', function(done){});
        it.skip('should fail if there is no password field on the input', function(done){});
        it.skip('should fail if there is a spurious field on the input', function(done){});
        it.skip('should fail if there is no input structure sent', function(done){});
    });
});
