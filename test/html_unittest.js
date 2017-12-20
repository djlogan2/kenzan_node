"use strict";
const assert = require('assert'),
    Browser = require('zombie'),
    RestClient = require('../api/lib/restclient'),
    //restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises'),
    Client = require('node-rest-client').Client,
    client = new Client(),
    Helpers = require('./helpers'),
    _ = require('underscore'),
    LocalDate = require('js-joda').LocalDate,
    PSEQ = require('promise-sequential');

const username_suffixes = ['', 'a', 'ad', 'au', 'd', 'du', 'u', 'adu'];
const kenzan_id = {};
const getId = function (username) {
    "use strict";
    const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
    return new Promise(function (resolve, reject) {
        if (kenzan_id[username]) {
            resolve(kenzan_id[username]);
            return;
        }
        restclient.login('kenzanadu', 'kenzan')
            .then(() => restclient.getEmployee({username: username})
                .then(function (employee) {
                    kenzan_id[username] = employee.id;
                    resolve(employee.id);
                }))
    });
};

const addEmployee = function (prefix) {
    "use strict";
    const emp = Helpers.newEmployee(prefix);
    const client = new RestClient('http://192.168.1.69:3000/rest', 'promises');
    return client.login('kenzanp', 'kenzan').then(() => client.addEmployee(emp));
};

const login = function (browser, url, username, password) {
    "use strict";
    const pw = (password || 'kenzan');
    console.log('login(' + url + '   ' + username + ')');
    return browser.visit(url)
        .then(function () {
            browser.assert.element('form input[id=employee_username]');
            browser.assert.element('form input[id=employee_password]');
            browser.assert.element('form input[name=commit]');
            return browser
                .fill('[id=employee_username]', username)
                .fill('[id=employee_password]', pw)
                .pressButton('[name=commit]');
        });
};

const logout = function (browser) {
    "use strict";
    return browser.clickLink('Logout');
};

describe('If a user is not logged in', function () {
    "use strict";
    ['', '/employees', '/employees/new', '/employees/1234', '/employees/1234/edit'/*, '/employees/1234/delete'*/].forEach(function (route) {

        it('should take me to the login screen when trying to go to ' + route, function (done) {
            const browser = new Browser();
            browser.visit('http://192.168.1.69:3000' + route)
                .then(function () {
                    browser.assert.element('form');
                    browser.assert.element('form input[id=employee_username]');
                    browser.assert.element('form input[id=employee_password]');
                    browser.assert.element('form input[name=commit]');
                    done();
                })
        });
        /*
                it.skip('should fail with a direct post of a new record', function (done) {
                    const browser = new Browser();
                });

                it.skip('should fail with a direct delete of a record', function (done) {
                });
                it.skip('should fail with a direct post of an updated record', function (done) {
                });
            });
            */
    });
});

username_suffixes.forEach(function (username_suffix) {
    describe('kenzan' + username_suffix, function () {

        const browser = new Browser();

        ['/', '/employees'].forEach(function (route) {
            "use strict";
            it('should have access to ' + route, function (done) {
                login(browser, 'http://192.168.1.69:3000' + route, 'kenzan' + username_suffix)
                    .then(function () {
                        browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
                        logout(browser).then(done);
                    });
            });
        });

        [['/new', 'a', 'new'], ['/%d/edit', 'u', 'edit']].forEach(function (one) {
            let urlsuffix = one[0];
            const authletter = one[1],
                autoname = one[2];
            it('should' + (username_suffix.indexOf(authletter) === -1 ? ' not ' : ' ') + ' allow access to ' + urlsuffix, function (done) {
                "use strict";
                getId('kenzan')
                    .then(function (id) {
                        urlsuffix = urlsuffix.replace('%d', id);
                        return login(browser, 'http://192.168.1.69:3000/employees' + urlsuffix, 'kenzan' + username_suffix);
                    })
                    .then(function (err) {
                        browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#' + (username_suffix.indexOf(authletter) === -1 ? 'index' : autoname));
                        return logout(browser);
                    }).then(done);
            });
        });
    });
});

describe('Viewing all records', function () {
    "use strict";
    it('should have all fields except pw and roles', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000', 'kenzanp')
            .then(function () {
                const headers = ['username', 'Email', 'First name', 'MI', 'Last name', 'Date of birth', 'Date of employment'];
                const nodes = browser.querySelectorAll('th');
                for (let x = 0; x < headers.length; x++)
                    assert.equal(nodes[x].textContent, headers[x]);
                assert.equal(headers.length, nodes.length);
                done();
            })
    });
    it('should have the edit button if user is able to edit', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000', 'kenzanp')
            .then(function () {
                assert.equal(browser.querySelector('input[type=submit]').value, 'Edit');
                done();
            })
    });
    it('should have a delete button if user is able to delete but not edit', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000', 'kenzand')
            .then(function () {
                assert.equal(browser.querySelector('input[type=submit]').value, 'Delete');
                done();
            })
    });
    it('should have no button if user has neither edit nor delete', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000', 'kenzan')
            .then(function () {
                browser.assert.elements('input[type=submit]', 0);
                done();
            })
    });
});

describe('Viewing a single record', function () {
    "use strict";
    it('should have all fields', function (done) {
        const labels = ['Username', 'First name', 'M', 'Last name', 'Date of birth', 'Date of employment'];
        const browser = new Browser();
        getId('kenzan')
            .then(function (id) {
                return login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanp')
            })
            .then(function () {
                const nodes = browser.querySelectorAll('label');
                labels.forEach(function (label) {
                    assert.notEqual(_.find(nodes, function (node) {
                        return node.textContent === label
                    }), null, 'Unable to find a label for ' + label);
                });
                done();
            });
    });

    it('should not have password in text box even if user has authority to change it', function (done) {
        const browser = new Browser();
        getId('kenzan')
            .then(function (id) {
                return login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanp')
            })
            .then(function () {
                const pwnode = browser.querySelector('input[id=employee_password]');
                assert.notEqual(pwnode, null, 'Unable to find password field');
                assert.ok(!pwnode.value, 'Why does the password field have data in it?');
                done();
            });
    });

    it('should have roles if user has authority to view them', function (done) {
        const browser = new Browser();
        getId('kenzan')
            .then(function (id) {
                return login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanp')
            })
            .then(function () {
                browser.assert.element('select[id=employee_role]');
                done();
            });
    });

    it('should not have roles if user does not have authority to view them', function (done) {
        const browser = new Browser();
        getId('kenzan')
            .then(function (id) {
                return login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanadu')
            })
            .then(function () {
                browser.assert.elements('option', 0);
                done();
            });
    });

    it('should have the right roles and only assigned roles', function () {
        const authorities = {
            a: 'ROLE_ADD_EMP',
            u: 'ROLE_UPDATE_EMP',
            d: 'ROLE_DELETE_EMP',
            p: 'ROLE_SET_PASSWORD',
        };
        const getRoles = function (suffix) {
            const roles = [];
            for (let letter in authorities) {
                if (suffix.indexOf(letter) !== -1) roles.push(authorities[letter]);
            }
            return roles;
        };
        username_suffixes.forEach(function (suffix) {
            const browser = new Browser();
            getId('kenzan' + suffix)
                .then(id => login(browser, 'http://192.168.1.69:3000/employees/' + id, 'kenzan' + suffix))
                .then(function () {
                    const roles = getRoles(suffix);
                    const options = browser.querySelectorAll('option');
                    assert.equal(options.length, roles.length);
                    let count = roles.length;
                    roles.forEach(function (role) {
                        assert.notEqual(_.find(options, function (option) {
                            return (option.textContent === role)
                        }), null, 'Unable to find role ' + role);
                        count--;
                    });
                    assert.equal(count, 0, 'Extra roles found');
                    return logout();
                })
                .then(function () {
                    if (suffix === _.last(username_suffixes)) done();
                });
        });
    });
});

describe('Adding a new record', function () {
    "use strict";
    it('should not have a password field if a user does not have privileges', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000/employees/new', 'kenzanadu')
            .then(function (err) {
                console.dir(browser.html());
                browser.assert.elements('input[id=employee_password]', 0);
                browser.assert.elements('select[id=employee_role]', 0);
                done();
            }).catch(function (e) {
            assert.fail(e);
            done();
        })

    });

    it('should have a password field if a user does have privileges', function (done) {
        const browser = new Browser();
        login(browser, 'http://192.168.1.69:3000/employees/new', 'kenzanp')
            .then(function (err) {
                browser.assert.element('input[id=employee_password]');
                browser.assert.element('select[id=employee_role]');
                done();
            }).catch(function (e) {
            assert.fail(e);
            done();
        });
    });

    it('should save all of the fields appropriately', function (done) {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add1');
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        emp.password = 'this_is_a_password';
        login(browser, 'http://192.168.1.69:3000/employees/new', 'kenzanp')
            .then(function () {
                for (let key in emp)
                    if (key !== 'bStatus')
                        browser.fill('[id=employee_' + key + ']', emp[key]);
                return browser.pressButton('[name=commit]');
            }).then(function () {
            browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#show');
            return restclient.login('kenzan', 'kenzan');
        }).then(() => restclient.getEmployee({username: emp.username}))
            .then(function (addedEmp) {
                assert(Helpers.areEmployeeRecordsEqual(addedEmp, emp), 'Employee records are not equal');
                return restclient.login(emp.username, 'this_is_a_password');
            }).then(function (err) {
            assert.ok(err, err);
            done();
        }).catch(function (e) {
            assert.fail(e);
            done();
        });
    });

    it('should not work with a direct post if user does not have privileges', function (done) {
        const browser_sufficient = new Browser();
        const browser_insufficient = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        let emp;
        let emp_temp;
        addEmployee('post2')
            .then(function (ret) {
                emp_temp = ret;
                return restclient.login('kenzan', 'kenzan');
            })
            .then(function () {
                const promise1 = login(browser_insufficient, 'http://192.168.1.69:3000/employees/' + emp_temp.id + '/edit', 'kenzanu');
                const promise2 = login(browser_sufficient, 'http://192.168.1.69:3000/employees/new', 'kenzana');
                return Promise.all([promise1, promise2]);
            }).then(function () {
            browser_sufficient.deleteCookies();
            browser_insufficient.cookies.forEach(function (cookie) {
                cookie.name = cookie.key;
                delete cookie.key;
                browser_sufficient.setCookie(cookie);
            });
            browser_sufficient.fill('[name=authenticity_token]', browser_insufficient.querySelector('[name=authenticity_token]').value);
            emp = Helpers.newEmployee('post1');
            for (let key in emp)
                if (key !== 'bStatus' && key !== 'password')
                    browser_sufficient.fill('[id=employee_' + key + ']', emp[key]);
            return browser_sufficient.pressButton('[name=commit]');
        }).then(function () {
            browser_sufficient.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
            return restclient.getEmployee({username: emp.username});
        }).then(function (emp_to_check) {
            assert.equal(emp_to_check, null, 'Add should not have been allowed');
            done();
        }).catch(function (e) {
            assert.fail(e);
            done();
        });
    });

    it('should save all field data if there is a save error', function (done) {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add2');
        login(browser, 'http://192.168.1.69:3000/employees/new', 'kenzanadu')
            .then(function () {
                for (let key in emp)
                    if (key !== 'bStatus')
                        browser.fill('[id=employee_' + key + ']', emp[key]);
                browser.fill('[id=employee_username]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
                for (let key in emp) {
                    if (key !== 'bStatus' && key !== 'password' && key !== 'username')
                        if (key.indexOf('date') > -1)
                            assert.ok(LocalDate.parse(browser.querySelector('[id=employee_' + key + ']').value).equals(emp[key]));
                        else
                            assert.equal(browser.querySelector('[id=employee_' + key + ']').value, emp[key]);
                }
                browser.fill('[id=employee_username]', emp.username);
                browser.fill('[id=employee_dateOfBirth]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
                for (let key in emp) {
                    if (key !== 'bStatus' && key !== 'password' && key !== 'dateOfBirth')
                        if (key.indexOf('date') > -1)
                            assert.ok(LocalDate.parse(browser.querySelector('[id=employee_' + key + ']').value).equals(emp[key]));
                        else
                            assert.equal(browser.querySelector('[id=employee_' + key + ']').value, emp[key]);
                }
                done();
        })
    })
});

describe('Updating a record', function () {
    "use strict";
    it('should have all of the standard fields', function (done) {
        const browser = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        const emp = Helpers.newEmployee('update1');
        restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then(ret => login(browser, 'http://192.168.1.69:3000/employees/' + ret.id + '/edit?', 'kenzanu'))
            .then(function () {
                browser.assert.element('[id=employee_username]');
                browser.assert.element('[id=employee_email]');
                browser.assert.element('[id=employee_firstName]');
                browser.assert.element('[id=employee_middleInitial]');
                browser.assert.element('[id=employee_lastName]');
                browser.assert.element('[id=employee_dateOfBirth]');
                browser.assert.element('[id=employee_dateOfEmployment]');
                done();
            }).catch(function (e) {
            console.log(e);
            assert.fail(e);
        });
    });

    it('should have all of the standard fields filled in appropriately', function (done) {
        const browser = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        const emp = Helpers.newEmployee('update2');
        restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then(ret => login(browser, 'http://192.168.1.69:3000/employees/' + ret.id + '/edit?', 'kenzanu'))
            .then(function () {
                for (let key in emp) {
                    if (key !== 'bStatus' && key !== 'password')
                        if (key.indexOf('date') > -1)
                            assert.ok(LocalDate.parse(browser.querySelector('[id=employee_' + key + ']').value).equals(emp[key]));
                        else
                            assert.equal(browser.querySelector('[id=employee_' + key + ']').value, emp[key]);
                }
                done();
            }).catch(function (e) {
            console.log(e);
            assert.ok(false);
        });
    });

    it('should retain all new data in all fields if there is a save error', function (done) {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add3');
        const emp2 = Helpers.newEmployee('add4');
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((saved_emp) =>login(browser, 'http://192.168.1.69:3000/employees/' + saved_emp.id + '/edit', 'kenzanadu'))
            .then(function () {
                for (let key in emp2)
                    if (key !== 'bStatus')
                        browser.fill('[id=employee_' + key + ']', emp2[key]);
                browser.fill('[id=employee_username]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
            for (let key in emp2) {
                if (key !== 'bStatus' && key !== 'password' && key !== 'username')
                    if (key.indexOf('date') > -1)
                        assert.ok(LocalDate.parse(browser.querySelector('[id=employee_' + key + ']').value).equals(emp2[key]));
                    else
                        assert.equal(browser.querySelector('[id=employee_' + key + ']').value, emp2[key]);
            }
            browser.fill('[id=employee_username]', emp2.username);
            browser.fill('[id=employee_dateOfBirth]', '');
            return browser.pressButton('[name=commit]');
        }).then(function () {
            for (let key in emp2) {
                if (key !== 'bStatus' && key !== 'password' && key !== 'dateOfBirth')
                    if (key.indexOf('date') > -1)
                        assert.ok(LocalDate.parse(browser.querySelector('[id=employee_' + key + ']').value).equals(emp2[key]));
                    else
                        assert.equal(browser.querySelector('[id=employee_' + key + ']').value, emp2[key]);
            }
            done();
        })
    });

    //
    // These test for:
    //   The presence of password if user has authority
    //   The lack of presence if user does not
    //   The presence of the roles if user has authority
    //   The lack of presence if user does not
    //   That the password field does not have any contents
    //
    it('should not have password if user does not have authority', function (done) {
        var browser = new Browser();
        getId('kenzanp')
            .then((id) => login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanu'))
            .then(function(){
                browser.assert.elements('[id=employee_password]', 0);
                browser.assert.elements('[id=employee_role]', 0);
            });

    });

    it('should have password if user has authority', function (done) {
        var browser = new Browser();
        getId('kenzanp')
            .then((id) => login(browser, 'http://192.168.1.69:3000/employees/' + id + '/edit', 'kenzanu'))
            .then(function(){
                browser.assert.element('[id=employee_password]');
                browser.assert.element('[id=employee_role]');
                assert.equal('', browser.querySelector('[id=employee_password]'), '');
            });

    });

    it('should not change the password if password field is not filled in', function (done) {
        const browser = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        var emp = Helpers.newEmployee('pw1');
        restclient.login('kenzanp', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {emp.id = data.id ; return restclient.setPassword(emp.username, 'initialpassword')})
            .then(() => login(browser, 'http://192.168.1.69:3000/employees/' + emp.id + '/edit', 'kenzanp'))
            .then(function() {
                browser.fill('[id=employee_email]', 'bull@bull.com');
                return browser.pressButton('[name=commit]');
            }).then(() => logout(browser))
            .then(() => login(browser, 'http://192.168.1.69:3000/', emp.username, 'initialpassword'))
            .then(function(){
                browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
                done();
            });
    });

    it('should change the password if password field is filled in', function (done) {
        const browser = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        var emp = Helpers.newEmployee('pw1');
        restclient.login('kenzanp', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {emp.id = data.id ; return restclient.setPassword(emp.username, 'initialpassword')})
            .then(() => login(browser, 'http://192.168.1.69:3000/employees/' + emp.id + '/edit', 'kenzanp'))
            .then(function() {
                browser.fill('[id=employee_email]', 'bull@bull.com');
                browser.fill('[id=employee_password]', 'supersecretnewpassword');
                return browser.pressButton('[name=commit]');
            }).then(() => logout(browser))
            .then(() => login(browser, 'http://192.168.1.69:3000/', emp.username, 'supersecretnewpassword'))
            .then(function(){
                browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
                done();
            });
    });

    it.only('should change the other input fields appropriately', function (done) {
        //this.timeout(100000);
        const emp1 = Helpers.newEmployee('change1');
        const emp2 = Helpers.newEmployee('change2');
        const browser = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        let promises = [];
        promises.push(() => login(browser, 'http://192.168.1.69:3000', 'kenzanu'));
        promises.push(() => restclient.login('kenzana', 'kenzan'));
        promises.push(() => restclient.addEmployee(emp1));
        promises.push((data) => {emp1.id = emp2.id = data.id; return Promises.resolve();});
        for(let key in emp2) {
            promises.push(() => browser.visit('http://192.168.1.69:3000/employees/' + emp1.id + '/edit'));
            promises.push(() => {
                browser.fill('[id=employee_' + key + ']', emp2[key]);
                return browser.pressButton('[name=commit]')
            });
            promises.push(() => restclient.getEmployee(emp1.id));
            promises.push((changed_emp) => {
                assert.equal(changed_emp[key], emp2[key], 'Edit did not properly change the ' + key + ' field');
                return Promise.resolve();
            });
        }
        promises.push(() => done());
        PSEQ(promises);
    });

    it.skip('should delete the optional fields appropriately', function (done) {
    });

    it.skip('should only allow valid dates in the date fields', function (done) {
    });

    it.skip('should have the delete link if user has delete authority', function (done) {
    });

    it.skip('should not have the delete link if user does not have delete authority', function (done) {
    });

    it('should not work with a direct post if user does not have privileges', function (done) {
        const browser_sufficient = new Browser();
        const browser_insufficient = new Browser();
        const restclient = new RestClient('http://192.168.1.69:3000/rest', 'promises');
        let id;
        addEmployee('post1')
            .then(function (emp) {
                id = emp.id;
                const promise1 = login(browser_insufficient, 'http://192.168.1.69:3000/employees/new', 'kenzana'); // Add but not update
                const promise2 = login(browser_sufficient, 'http://192.168.1.69:3000/employees/' + emp.id + '/edit', 'kenzanu');
                return Promise.all([promise1, promise2]);
            }).catch(function (e) {
            console.dir(browser_sufficient.html());
            assert.fail(e);
        }).then(function () {
            browser_sufficient.deleteCookies();
            browser_insufficient.cookies.forEach(function (cookie) {
                cookie.name = cookie.key;
                delete cookie.key;
                browser_sufficient.setCookie(cookie);
            });
            browser_sufficient.fill('[id=employee_username]', 'should_not_be_allowed');
            browser_sufficient.fill('[name=authenticity_token]', browser_insufficient.querySelector('[name=authenticity_token]').value);
            return browser_sufficient.pressButton('[name=commit]');
        }).then(function () {
            browser_sufficient.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
            return restclient.login('kenzan', 'kenzan');
        }).then(() => restclient.getEmployee(id))
            .then(function (emp_to_check) {
                assert.notEqual(emp_to_check.username, 'should_not_be_allowed', 'Edit should not have been allowed');
                done();
            });
    });
});

describe.skip('Deleting a record', function () {
});

describe.skip('security', function () {
    "use strict";
    it('what happens when we delete authenticity-token in a form', function (done) {
    });
    it('what happens when we change authenticity-token in a form to something else', function (done) {
    });
});
