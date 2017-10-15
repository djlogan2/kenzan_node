var client = require('./restclient');
var assert = require('assert');
var statusCode = require('./statuscode');

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
    testno++;
    return emp;
}

describe('Rest server', function () {

    describe('Adding a record', function () {
        variousUsers.forEach(function (user) {
            var not = '';
            if (user.indexOf('a', 6) === -1) not = 'not ';
            it('should ' + not + 'be allowed by user ' + user, function (done) {
                "use strict";
                var clientuser = new client("http://localhost:8080/Kenzan/rest");
                clientuser.login(user, "kenzan", function (resp) {
                    console.log(user);
                    console.dir(resp);
                    assert.notEqual(null, resp, 'response should not be null');
                    assert.ok("error" in resp, 'response should have an error field');
                    assert.ok("errorcode" in resp, 'response should have an error code field');
                    assert.ok("jwt" in resp, 'response should have a jwt field');
                    assert.equal(null, resp.error, 'response error expected to be null');
                    assert.equal(statusCode.NONE, resp.errorcode);
                    assert.notEqual(null, resp.jwt, 'response jwt expected to have a value');
                    clientuser.addEmployee(newEmployee('add1'), function(resp) {
                        console.log(user);
                        console.dir(resp);
                        assert.notEqual(null, resp, 'response should not be null');
                        assert.ok("error" in resp, 'response should have an error field');
                        assert.ok("errorcode" in resp, 'response should have an error code field');
                        assert.ok("id" in resp, 'response should have an id field');
                        if (not === '')
                        {
                            assert.equal(null, resp.error, 'response error should be null');
                            assert.equal(statusCode.NONE, resp.errorcode);
                            assert.notEqual(null, resp.id, 'response id should not be null');
                        }
                        else {
                            assert.notEqual(null, resp.error, 'response error should not be null');
                            assert.equal(statusCode.CANNOT_INSERT_DUPLICATE_RECORD, resp.errorcode);
                        }
                        done();
                    });
                });
            });
        });
        it('should fail without a username', function (done) {
            "use strict";
            done();
        });
        it('should fail without a dateOfBirth', function (done) {
            "use strict";
            done();
        });
        it('should fail without a firstName', function (done) {
            "use strict";
            done();
        });
        it('should fail without a lastName', function (done) {
            "use strict";
            done();
        });
        it('should fail without a status', function (done) {
            "use strict";
            done();
        });
        it('should not fail without a middleInitial', function (done) {
            "use strict";
            done();
        });
        it('should fail with a spurious data element', function (done) {
            "use strict";
            done();
        });
    });

    describe('Test inactive status', function () {
    });
    describe('Test duplicate fails and successes', function () {
    });
    describe('Test updates', function () {
    });
    describe('Test deletes', function () {
    });
    describe('Test nonexistent updates', function () {
    });
    describe('Test nonexistent deletes', function () {
    });
    describe('Expired authorization token', function () {
    });
    describe('No authorization token', function () {
    });
    describe('Invalid authorization token', function () {
    });
});
