var assert = require('assert'),
    webdriver = require('selenium-webdriver');

var By = webdriver.By;
var until = webdriver.until;
var driver = new webdriver.Builder().forBrowser('chrome').build();
var RestClient = require('../api/lib/restclient');
var restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
var _ = require('underscore');

var kenzan_id = {};
var getId = function (username) {
    "use strict";
    return new Promise(function (resolve, reject) {
        if (kenzan_id[username]) {
            resolve(kenzan_id[username]);
            return;
        }
        restclient.login('kenzanadu', 'kenzan')
            .then(function () {
                return restclient.getEmployee({username: username})
            })
            .then(function (employee) {
                kenzan_id[username] = employee.id;
                resolve(employee.id);
            })
            .catch(function (err) {
                "use strict";
                console.log('Unable to run tests: ' + err);
            });
    });
};

var login = function (username, route) {
    return driver.get('http://192.168.1.69:3000' + route)
        .then(function () {
            return driver.findElement(By.id('employee_username'))
        })
        .then(function (e1) {
            return e1.sendKeys(username)
        })
        .then(function () {
            return driver.findElement(By.id('employee_password'))
        })
        .then(function (e1) {
            return e1.sendKeys('kenzan')
        })
        .then(function () {
            return driver.findElement(By.id('new_employee'))
        })
        .then(function (e1) {
            return e1.submit();
        })
        .catch(assert.fail);
};

var logout = function () {
    return driver.findElement(By.linkText('Logout'))
        .then(function (e1) {
            e1.click()
        })
        .catch(assert.fail);
};

describe('If a user is not logged in', function () {
    "use strict";
    ['', '/employees', '/employees/new', '/employees/1234', '/employees/1234/edit'/*, '/employees/1234/delete'*/].forEach(function (route) {
        it('should take me to the login screen when trying to go to ' + route, function (done) {
            driver.get('http://192.168.1.69:3000' + route)
                .then(function () {
                    driver.findElement(By.id('employee_username'))
                })
                .then(done)
                .catch(assert.fail);
        });
        it('should fail with a direct post of a new record', function () {
        });
        it('should fail with a direct delete of a record', function () {
        });
        it('should fail with a direct post of an updated record', function () {
        });
    });
});

['', 'a', 'ad', 'au', 'd', 'du', 'u', 'adu'].forEach(function (username_suffix) {
    describe('kenzan' + username_suffix, function () {

        ['/', '/employees'].forEach(function (route) {
            "use strict";
            it('should have access to ' + route, function (done) {
                login('kenzan' + username_suffix, route)
                    .then(function () {
                        return driver.findElement(By.id('test_automation'))
                    })
                    .then(function (e1) {
                        return e1.getAttribute('name')
                    })
                    .then(function (e1) {
                        assert.equal(e1, 'Employee#index');
                    })
                    .then(logout)
                    .then(done)
                    .catch(assert.fail);
            });
        });

        [['/new', 'a', 'new'], ['/%d/edit', 'u', 'edit']].forEach(function (one) {
            var urlsuffix = one[0],
                authletter = one[1],
                autoname = one[2];
            it('should' + (username_suffix.indexOf(authletter) === -1 ? ' not ' : ' ') + ' allow access to ' + urlsuffix, function (done) {
                getId('kenzanadu')
                    .then(function (id) {
                        return login('kenzan' + username_suffix, '/employees' + urlsuffix.replace('%d', id))
                    })
                    .then(function () {
                        return driver.findElement(By.id('test_automation'))
                    })
                    .then(function (e1) {
                        return e1.getAttribute('name')
                    })
                    .then(function (e1) {
                        if (username_suffix.indexOf(authletter) === -1)
                            assert.equal(e1, 'Employee#index');
                        else
                            assert.equal(e1, 'Employee#' + autoname)
                    })
                    .then(logout)
                    .then(done)
                    .catch(assert.fail);
            });
        });
    });
});

describe('Adding a new record', function () {
    "use strict";
    it('should not have a password field if a user does not have privileges', function () {

    });
    it('should have a password field if a user does have privileges', function () {
    });
    it('should not have a roles field if a user does not have privileges', function () {
    });
    it('should have a roles field if a user does have privileges', function () {
    });
    it('should not have a password field if a user does not have privileges', function () {
    });
    it('should not work with a direct post if user does not have privileges', function () {
    });
    it('should work with a direct post if user does have privileges', function () {
    });
});