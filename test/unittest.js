var client = require('./restclient');
var assert = require('assert');
var statusCode = require('./statuscode');
var _ = require('underscore');

var variousUsers = ['kenzan', 'kenzana', 'kenzand', 'kenzanu', 'kenzanad', 'kenzanau', 'kenzandu', 'kenzanadu'];

var testno = 0;

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
    var clientuser = new client("http://localhost:8080/Kenzan/rest");
    clientuser.login(username, password, function (resp) {
        assert.notEqual(resp, null, 'response should not be null');
        assert.ok("error" in resp, 'response should have an error field');
        assert.ok("errorcode" in resp, 'response should have an error code field');
        assert.ok("jwt" in resp, 'response should have a jwt field');
        assert.equal(resp.error, null, 'response error expected to be null');
        assert.equal(resp.errorcode, statusCode.NONE, 'status code should indicate success');
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
            console.dir(resp);
            assert.notEqual(resp, null, 'response should not be null');
            assert.ok("error" in resp, 'response should have an error field');
            assert.ok("errorcode" in resp, 'response should have an error code field');
            assert.ok("id" in resp, 'response should have an id field');
            assert.equal(resp.error, null, 'response error should be null');
            assert.equal(resp.errorcode, statusCode.NONE, 'error code should indicate a successful add');
            emp.id = resp.id;
            asyncCallback(emp);
        });
    });
}

describe('Rest server', function () {

    describe('Adding a record', function () {
        variousUsers.forEach(function (user) {
            var not = '';
            if (user.indexOf('a', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                "use strict";
                console.log('Trying to add a record as ' + user);
                login(user, "kenzan", function (clientuser) {
                    clientuser.addEmployee(newEmployee('add1'), function (resp) {
                        console.dir(resp);
                        assert.notEqual(resp, null, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        if (not === '') {
                            assert.equal(resp.error, null, 'response error should be null');
                            assert.equal(resp.errorcode, statusCode.NONE, 'error code should indicate no error');
                            assert.notEqual(resp.id, null, 'response id should not be null');
                        }
                        else {
                            assert.notEqual(resp.error, null, 'response error should not be null');
                            assert.equal(resp.errorcode, statusCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
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
                        console.dir(resp);
                        assert.notEqual(resp, null, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        assert.notEqual(resp.error, null, 'response error should not be null');
                        assert.equal(resp.errorcode, statusCode.CANNOT_INSERT_MISSING_FIELDS, 'error code should indicate missing fields');
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
                    assert.equal(resp.errorcode, statusCode.NONE, 'error code indicate success');
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
                    assert.equal(resp.errorcode, statusCode.CANNOT_INSERT_UNKNOWN_FIELDS, 'error code indicate extra fields');
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
                    assert.equal(resp.errorcode, statusCode.CANNOT_INSERT_UNKNOWN_FIELDS, 'error code indicate extra fields');
                    done();
                });
            });
        });
    });

    describe.skip('A record with inactive status', function () {
        "use strict";
        it('should not be returnable with get_all', function(done) {
            login("kenzan", "kenzan", function(clientuser) {
                clientuser.getAllEmployees(function(employees) {});
            });
        });
        it('should not be returnable with get_emp', function(){});
        it('should not be updatable', function(){});
        it('should not be deletable', function(){});
    });

    describe.skip('A record with a username already in the database', function () {
        "use strict";
        it('should not be able to be inserted as a new record if one in the database is active', function(done) {});
        it('should be able to be inserted as a new record if all of the ones in the database are inactive', function(done) {});
        it('should not be able to be updated with status=active if one in the database is active', function(done) {});
        it('should be able to be updated with status=active if all of the ones in the database are inactive', function(done) {});
    });

    describe('Updating a record', function () {
        variousUsers.forEach(function (user) {
            var not = '';
            if (user.indexOf('u', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                addNewEmployee('update1', function (newEmployeeRecord) {
                    "use strict";
                    console.log('Trying to update a record as ' + user);
                    login(user, "kenzan", function (clientuser) {
                        var updatedRecord = _.clone(newEmployeeRecord);
                        updatedRecord.firstName = 'Changed by ' + user;
                        updatedRecord.lastName = 'Changed by ' + user;
                        updatedRecord.middleInitial = '1';
                        updatedRecord.dateOfBirth = new Date(1950, 11, 26);
                        updatedRecord.dateOfEmployment = new Date(1940, 12, 25);
                        clientuser.updateEmployee(updatedRecord, function (resp) {
                            console.dir(resp);
                            assert.notEqual(resp, null, 'response should not be null');
                            assert.ok("error" in resp, 'response should have an error field');
                            assert.ok("errorcode" in resp, 'response should have an error code field');
                            assert.ok("id" in resp, 'response should have an id field');
                            if (not === '') {
                                assert.equal(resp.error, null, 'response error should be null');
                                assert.equal(resp.errorcode, statusCode.NONE, 'error code should indicate no error');
                                assert.notEqual(resp.id, null, 'response id should not be null');
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(_.isEqual(employee, updatedRecord), 'returned record should match our updated data');
                                    done();
                                });
                            }
                            else {
                                assert.notEqual(resp.error, null, 'response error should not be null');
                                assert.equal(resp.errorcode, statusCode.NOT_AUTHORIZED_FOR_OPERATION, 'error code should indicate user is not authorized');
                                clientuser.getEmployee(newEmployeeRecord.id, function(employee) {
                                    assert.notEqual(employee, null, 'employee should not be null');
                                    assert.ok(_.isEqual(employee, newEmployeeRecord), 'returned record should match the originally added data');
                                    done();
                                });
                            }
                        });
                    });
                });
            });
        });
    });

    describe.skip('Test deletes', function () {
    });

    describe.skip('Test nonexistent updates', function () {
    });

    describe.skip('Test nonexistent deletes', function () {
    });

    describe.skip('Expired authorization token', function () {
        "use strict";
        it('should not allow a get_all', function(done){});
        it('should not allow a get_emp', function(done){});
        it('should not allow an add', function(done){});
        it('should not allow an update', function(done){});
        it('should not allow a delete', function(done){});
        it('should not allow a set password', function(done){});
    });

    describe.skip('No authorization token', function () {
        "use strict";
        it('should not allow a get_all', function(done){});
        it('should not allow a get_emp', function(done){});
        it('should not allow an add', function(done){});
        it('should not allow an update', function(done){});
        it('should not allow a delete', function(done){});
        it('should not allow a set password', function(done){});
    });

    describe.skip('Invalid authorization token', function () {
        "use strict";
        it('should not allow a get_all', function(done){});
        it('should not allow a get_emp', function(done){});
        it('should not allow an add', function(done){});
        it('should not allow an update', function(done){});
        it('should not allow a delete', function(done){});
        it('should not allow a set password', function(done){});
    });
});
