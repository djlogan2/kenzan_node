"use strict";

const TEST_ENVIRONMENT = 'ruby';

const assert = require('assert'),
    Browser = require('zombie'),
    RestClient = require('../api/lib/restclient'),
    Client = require('node-rest-client').Client,
    client = new Client(),
    Helpers = require('./helpers'),
    _ = require('underscore'),
    LocalDate = require('js-joda').LocalDate,
    PSEQ = require('promise-sequential'),
    errorCode = require('../api/lib/errorcode'),
    environment = require('./environment')(TEST_ENVIRONMENT);

Browser.prototype.login = function (url, username, password) {
    "use strict";
    const self = this;
    const pw = (password || 'kenzan');
    return self.visit(url)
        .then(function () {
            self.assert.element('form input[id=employee_username]');
            self.assert.element('form input[id=employee_password]');
            self.assert.element('form input[name=commit]');
            self.fill('[id=employee_username]', username);
            self.fill('[id=employee_password]', pw);
            return self.pressButton('[name=commit]');
        });
};

Browser.prototype.logout = function () {
    return this.clickLink('Logout');
};

const username_suffixes = ['', 'a', 'ad', 'au', 'd', 'du', 'u', 'adu'];
const kenzan_id = {};
const getId = function (username) {
    "use strict";
    const restclient = new RestClient(environment.rest_url, 'promises');
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
    const client = new RestClient(environment.rest_url, 'promises');
    return client.login('kenzanp', 'kenzan').then(() => client.addEmployee(emp));
};

describe('If a user is not logged in', function () {
    "use strict";
    ['', `/${environment.http_suffix}`, `/${environment.http_suffix}/new`, `/${environment.http_suffix}/1234`].forEach(function (route) {

        it(`should take me to the login screen when trying to go to ${route}`, function () {
            const browser = new Browser();
            return browser.visit(environment.url + route)
                .then(function () {
                    browser.assert.element('form');
                    browser.assert.element('form input[id=employee_username]');
                    browser.assert.element('form input[id=employee_password]');
                    browser.assert.element('form input[name=commit]');
                })
        });
        /*
                it.skip('should fail with a direct post of a new record', function () {
                    const browser = new Browser();
                });

                it.skip('should fail with a direct delete of a record', function () {
                });
                it.skip('should fail with a direct post of an updated record', function () {
                });
            });
            */
    });
});

username_suffixes.forEach(function (username_suffix) {
    describe(`kenzan${username_suffix}`, function () {

        //const browser = new Browser();

        ['/', '/employees'].forEach(function (route) {
            "use strict";
            it(`should have access to ${route}`, function () {
                const browser = new Browser();
                return browser.login(environment.url + route, `kenzan${username_suffix}`)
                    .then(() => browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index'))
            });
        });

        [['new', 'a', 'new'], ['%d/edit', 'u', 'edit']].forEach(function (one) {
            let urlsuffix = one[0];
            const authletter = one[1],
                autoname = one[2];
            it('should' + (username_suffix.indexOf(authletter) === -1 ? ' not ' : ' ') + ` allow access to ${urlsuffix}`, function () {
                "use strict";
                const browser = new Browser();
                return getId('kenzan')
                    .then(function (id) {
                        urlsuffix = urlsuffix.replace('%d', id);
                        return browser.login(environment.http_url + urlsuffix, `kenzan${username_suffix}`);
                    })
                    .then(err => browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#' + (username_suffix.indexOf(authletter) === -1 ? 'index' : autoname)))
            });
        });
    });
});

describe('Viewing all records', function () {
    "use strict";
    it('should have all fields except pw and roles', function () {
        const browser = new Browser();
        return browser.login(environment.url, 'kenzanp')
            .then(function () {
                const headers = ['username', 'Email', 'First name', 'MI', 'Last name', 'Date of birth', 'Date of employment'];
                const nodes = browser.querySelectorAll('th');
                for (let x = 0; x < headers.length; x++)
                    assert.equal(nodes[x].textContent, headers[x]);
                assert.equal(headers.length, nodes.length);
            })
    });
    it('should have the edit button if user is able to edit', function () {
        const browser = new Browser();
        return browser.login(environment.url, 'kenzanp')
            .then(function () {
                assert.equal(browser.querySelector('input[type=submit]').value, 'Edit');
            })
    });
    it('should have a delete button if user is able to delete but not edit', function () {
        const browser = new Browser();
        return browser.login(environment.url, 'kenzand')
            .then(function () {
                assert.equal(browser.querySelector('input[type=submit]').value, 'Delete');
            })
    });
    it('should have no button if user has neither edit nor delete', function () {
        const browser = new Browser();
        return browser.login(environment.url, 'kenzan')
            .then(function () {
                browser.assert.elements('input[type=submit]', 0);
            })
    });
});

describe('Viewing a single record', function () {
    "use strict";
    it('should have all fields', function () {
        const labels = ['Username', 'First name', 'M', 'Last name', 'Date of birth', 'Date of employment'];
        const browser = new Browser();
        return getId('kenzan')
            .then(function (id) {
                return browser.login(`${environment.http_url}${id}/edit`, 'kenzanp')
            })
            .then(function () {
                const nodes = browser.querySelectorAll('label');
                labels.forEach(function (label) {
                    assert.notEqual(_.find(nodes, function (node) {
                        return node.textContent === label
                    }), null, `Unable to find a label for ${label}`);
                });
            });
    });

    it('should not have password in text box even if user has authority to change it', function () {
        const browser = new Browser();
        return getId('kenzan')
            .then(function (id) {
                return browser.login(`${environment.http_url}${id}/edit`, 'kenzanp')
            })
            .then(function () {
                const pwnode = browser.querySelector('input[id=employee_password]');
                assert.notEqual(pwnode, null, 'Unable to find password field');
                assert.ok(!pwnode.value, 'Why does the password field have data in it?');
            });
    });

    it('should have roles if user has authority to view them', function () {
        const browser = new Browser();
        return getId('kenzan')
            .then(function (id) {
                return browser.login(`${environment.http_url}${id}/edit`, 'kenzanp')
            })
            .then(function () {
                browser.assert.element('select[id=employee_role]');
            });
    });

    it('should not have roles if user does not have authority to view them', function () {
        const browser = new Browser();
        return getId('kenzan')
            .then(function (id) {
                return browser.login(`${environment.http_url}${id}/edit`, 'kenzanadu')
            })
            .then(function () {
                browser.assert.elements('[id=employee_role]', 0);
            });
    });

    it('should have the right roles and only assigned roles', function (done) {
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
            getId(`kenzan${suffix}`)
                .then(id => browser.login(environment.http_url + id, `kenzan${suffix}`))
                .then(function () {
                    const roles = getRoles(suffix);
                    const options = browser.querySelectorAll('option');
                    assert.equal(options.length, roles.length);
                    let count = roles.length;
                    roles.forEach(function (role) {
                        assert.notEqual(_.find(options, function (option) {
                            return (option.textContent === role)
                        }), null, `Unable to find role ${role}`);
                        count--;
                    });
                    assert.equal(count, 0, 'Extra roles found');
                })
                .then(function () {
                    if (suffix === _.last(username_suffixes)) done();
                });
        });
    });
});

describe('Adding a new record', function () {
    "use strict";
    it('should not have a password field if a user does not have privileges', function () {
        const browser = new Browser();
        return browser.login(`${environment.http_url}new`, 'kenzanadu')
            .then(function (err) {
                console.dir(browser.html());
                browser.assert.elements('input[id=employee_password]', 0);
                browser.assert.elements('select[id=employee_role]', 0);
        })

    });

    it('should have a password field if a user does have privileges', function () {
        const browser = new Browser();
        return browser.login(`${environment.http_url}new`, 'kenzanp')
            .then(function (err) {
                browser.assert.element('input[id=employee_password]');
                browser.assert.element('select[id=employee_role]');
        });
    });

    it('should save all of the fields appropriately', function () {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add1');
        const restclient = new RestClient(environment.rest_url, 'promises');
        emp.password = 'this_is_a_password';
        return browser.login(`${environment.http_url}new`, 'kenzanp')
            .then(function () {
                for (let key in emp)
                    if (key !== 'bStatus')
                        browser.fill(`[id=employee_${key}]`, emp[key]);
                return browser.pressButton('[name=commit]');
            }).then(function () {
                browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#show');
                return restclient.login('kenzan', 'kenzan');
            }).then(() => restclient.getEmployee({username: emp.username}))
            .then(function (addedEmp) {
                assert(Helpers.areEmployeeRecordsEqual(addedEmp, emp), 'Employee records are not equal');
                return restclient.login(emp.username, 'this_is_a_password');
            }).then(function (data) {
                assert.equal(data.errorcode, errorCode.NONE, `Password add failed: ${data.errorcode} ${data.error}`);
        });
    });

    it('should not work with a direct post if user does not have privileges', function () {
        const browser_sufficient = new Browser();
        const browser_insufficient = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        let emp;
        let emp_temp;
        return addEmployee('post2')
            .then(function (ret) {
                emp_temp = ret;
                return restclient.login('kenzan', 'kenzan');
            })
            .then(function () {
                const promise1 = browser_insufficient.login(`${environment.http_url}${emp_temp.id}/edit`, 'kenzanu');
                const promise2 = browser_sufficient.login(`${environment.http_url}new`, 'kenzana');
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
                    browser_sufficient.fill(`[id=employee_${key}]`, emp[key]);
            return browser_sufficient.pressButton('[name=commit]');
        }).then(function () {
            browser_sufficient.assert.attribute('div [id=test_automation]', 'name', 'Employee#index');
            return restclient.getEmployee({username: emp.username});
        }).then(function (emp_to_check) {
            assert.equal(emp_to_check, null, 'Add should not have been allowed');
        });
    });

    it('should save all field data if there is a save error', function () {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add2');
        return browser.login(`${environment.http_url}new`, 'kenzanadu')
            .then(function () {
                for (let key in emp)
                    if (key !== 'bStatus')
                        browser.fill(`[id=employee_${key}]`, emp[key]);
                browser.fill('[id=employee_username]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
                for (let key in emp) {
                    if (key !== 'bStatus' && key !== 'password' && key !== 'username')
                        if (key.startsWith('date'))
                            assert.ok(LocalDate.parse(browser.querySelector(`[id=employee_${key}]`).value).equals(emp[key]));
                        else
                            assert.equal(browser.querySelector(`[id=employee_${key}]`).value, emp[key]);
                }
                browser.fill('[id=employee_username]', emp.username);
                browser.fill('[id=employee_dateOfBirth]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
                for (let key in emp) {
                    if (key !== 'bStatus' && key !== 'password' && key !== 'dateOfBirth')
                        if (key.startsWith('date'))
                            assert.ok(LocalDate.parse(browser.querySelector(`[id=employee_${key}]`).value).equals(emp[key]));
                        else
                            assert.equal(browser.querySelector(`[id=employee_${key}]`).value, emp[key]);
                }
        })
    })
});

describe('Updating a record', function () {
    "use strict";
    it('should have all of the standard fields', function () {
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        const emp = Helpers.newEmployee('update1');
        return restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then(ret => browser.login(`${environment.http_url}${ret.id}/edit?`, 'kenzanu'))
            .then(function () {
                browser.assert.element('[id=employee_username]');
                browser.assert.element('[id=employee_email]');
                browser.assert.element('[id=employee_firstName]');
                browser.assert.element('[id=employee_middleInitial]');
                browser.assert.element('[id=employee_lastName]');
                environment.assertDateField(browser, 'dateOfBirth');
                environment.assertDateField(browser, 'dateOfEmployment');
        });
    });

    it('should have all of the standard fields filled in appropriately', function () {
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        const emp = Helpers.newEmployee('update2');
        return restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then(ret => browser.login(`${environment.http_url}${ret.id}/edit?`, 'kenzanu'))
            .then(function () {
                for (let key in emp) {
                    if (key.startsWith('date'))
                        assert.ok(environment.getDate(browser, key).equals(emp[key]));
                    else if (key !== 'bStatus' && key !== 'password')
                        assert.equal(browser.querySelector(`[id=employee_${key}]`).value, emp[key]);
                }
        });
    });

    it('should retain all new data in all fields if there is a save error', function () {
        const browser = new Browser();
        const emp = Helpers.newEmployee('add3');
        const emp2 = Helpers.newEmployee('add4');
        const restclient = new RestClient(environment.rest_url, 'promises');
        return restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((saved_emp) => browser.login(`${environment.http_url}${saved_emp.id}/edit`, 'kenzanadu'))
            .then(function () {
                for (let key in emp2)
                    if (key.startsWith('date'))
                        environment.fillDate(browser, key, emp2[key]);
                    else if (key !== 'bStatus')
                        browser.fill(`[id=employee_${key}]`, emp2[key]);
                browser.fill('[id=employee_username]', '');
                return browser.pressButton('[name=commit]');
            }).then(function () {
            for (let key in emp2) {
                if (key !== 'bStatus' && key !== 'password' && key !== 'username')
                    if (key.startsWith('date'))
                        assert.ok(environment.getDate(browser, key).equals(emp2[key]));
                    else
                        assert.equal(browser.querySelector(`[id=employee_${key}]`).value, emp2[key]);
            }
            browser.fill('[id=employee_username]', emp2.username);
                browser.fill('[id=employee_email]', '');
            return browser.pressButton('[name=commit]');
        }).then(function () {
            for (let key in emp2) {
                if (key !== 'bStatus' && key !== 'password' && key !== 'email')
                    if (key.startsWith('date'))
                        assert.ok(environment.getDate(browser, key).equals(emp2[key]));
                    else
                        assert.equal(browser.querySelector(`[id=employee_${key}]`).value, emp2[key]);
            }
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
    it('should not have password if user does not have authority', function () {
        var browser = new Browser();
        return getId('kenzanp')
            .then((id) => browser.login(`${environment.http_url}${id}/edit`, 'kenzanu'))
            .then(function(){
                browser.assert.elements('[id=employee_password]', 0);
                browser.assert.elements('[id=employee_role]', 0);
            });

    });

    it('should have password if user has authority', function () {
        var browser = new Browser();
        return getId('kenzanu')
            .then((id) => browser.login(`${environment.http_url}${id}/edit`, 'kenzanp'))
            .then(function(){
                browser.assert.element('[id=employee_password]');
                browser.assert.element('[id=employee_role]');
                assert.equal('', browser.querySelector('[id=employee_password]').value, 'Password field is not blank');
            });

    });

    it('should not change the password if password field is not filled in', function () {
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        var emp = Helpers.newEmployee('pw1');
        return restclient.login('kenzanp', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {emp.id = data.id ; return restclient.setPassword(emp.username, 'initialpassword')})
            .then(() => browser.login(`${environment.http_url}${emp.id}/edit`, 'kenzanp'))
            .then(function() {
                browser.fill('[id=employee_email]', 'bull@bull.com');
                return browser.pressButton('[name=commit]');
            }).then(() => browser.logout())
            .then(() => browser.login(environment.http_url, emp.username, 'initialpassword'))
            .then(() => browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index'));
    });

    it('should change the password if password field is filled in', function () {
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        var emp = Helpers.newEmployee('pw1');
        return restclient.login('kenzanp', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {emp.id = data.id ; return restclient.setPassword(emp.username, 'initialpassword')})
            .then(() => browser.login(`${environment.http_url}${emp.id}/edit`, 'kenzanp'))
            .then(function() {
                browser.fill('[id=employee_email]', 'bull@bull.com');
                browser.fill('[id=employee_password]', 'supersecretnewpassword');
                return browser.pressButton('[name=commit]');
            }).then(() => browser.logout())
            .then(() => browser.login(environment.http_url, emp.username, 'supersecretnewpassword'))
            .then(() => browser.assert.attribute('div [id=test_automation]', 'name', 'Employee#index'));
    });

    it('should change the other input fields appropriately', function () {
        //this.timeout(100000);
        const emp1 = Helpers.newEmployee('change1');
        const emp2 = Helpers.newEmployee('change2');
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        let promises = [];
        promises.push(() => browser.login(environment.url, 'kenzanp'));
        promises.push(() => restclient.login('kenzana', 'kenzan'));
        promises.push(() => restclient.addEmployee(emp1));
        promises.push((data) => {
            emp1.id = emp2.id = data.id;
            return Promise.resolve();
        });
        for(let key in emp2) {
            if (['bStatus', 'password'].indexOf(key) === -1) {
                promises.push(() => browser.visit(`${environment.http_url}${emp1.id}/edit`));
                if (key.startsWith('date')) {
                    promises.push(() => {
                        environment.fillDate(browser, key, emp2[key]);
                        return browser.pressButton('[name=commit]');
                    });
                } else {
                    promises.push(() => {
                        browser.fill(`[id=employee_${key}]`, emp2[key]);
                        return browser.pressButton('[name=commit]')
                    });
                }
                ;
            }
            ;
            promises.push(() => restclient.getEmployee(emp1.id));
            promises.push((changed_emp) => {
                if (key.startsWith('date') ? !changed_emp[key].equals(emp2[key]) : changed_emp[key] !== emp2[key])
                    throw new Error(`Edit did not properly change the ${key} field from ${emp1[key]} to ${emp2[key]}`);
                else return Promise.resolve();
            });
        }
        return PSEQ(promises);
    });

    it('should delete the optional fields appropriately', function () {
        const emp = Helpers.newEmployee('optfld1');
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        return restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {
                emp.id = data.id;
                return browser.login(`${environment.http_url}${data.id}/edit`, 'kenzanu')
            })
            .then(function () {
                browser.fill('[id=employee_middleInitial]', '');
                return browser.pressButton('[name=commit]');
            })
            .then(() => restclient.getEmployee(emp.id))
            .then(function (check) {
                assert.ok(!check.middleInitial);
                return browser.visit(`${environment.http_url}${emp.id}/edit`);
            })
            .then(function () {
                environment.fillDate(browser, 'dateOfEmployment', null);
                return browser.pressButton('[name=commit]');
            })
            .then(() => restclient.getEmployee(emp.id))
            .then(function (check) {
                assert.ok(!check.dateOfEmployment);
            })
    });

    it('should only allow valid dates in the date fields', function () {
        const emp = Helpers.newEmployee('datefld');
        const browser = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        return restclient.login('kenzana', 'kenzan')
            .then(() => restclient.addEmployee(emp))
            .then((data) => {
                emp.id = data.id;
                return browser.login(`${environment.http_url}${data.id}/edit`, 'kenzanu')
            })
            .then(function () {
                environment.fillDate(browser, 'dateOfBirth', 'InvalidDate');
                return browser.pressButton('[name=commit]');
            })
            .then(() => restclient.getEmployee(emp.id))
            .then(check_emp => assert.ok(emp.dateOfBirth.equals(check_emp.dateOfBirth)))
            .then(() => browser.visit(`${environment.http_url}${emp.id}/edit`))
            .then(function () {
                environment.fillDate(browser, 'dateOfEmployment', 'InvalidDate');
                return browser.pressButton('[name=commit]');
            })
            .then(() => restclient.getEmployee(emp.id))
            .then(check_emp => assert.ok(emp.dateOfEmployment.equals(check_emp.dateOfEmployment)))
    });

    it.skip('should have the delete link if user has delete authority', function () {
        const browser = new Browser();
    });

    it.skip('should not have the delete link if user does not have delete authority', function () {
    });

    it('should not work with a direct post if user does not have privileges', function () {
        const browser_sufficient = new Browser();
        const browser_insufficient = new Browser();
        const restclient = new RestClient(environment.rest_url, 'promises');
        let id;
        return addEmployee('post1')
            .then(function (emp) {
                id = emp.id;
                const promise1 = browser_insufficient.login(`${environment.http_url}new`, 'kenzana'); // Add but not update
                const promise2 = browser_sufficient.login(`${environment.http_url}${emp.id}/edit`, 'kenzanu');
                return Promise.all([promise1, promise2]);
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
            });
    });
});

describe.skip('Deleting a record', function () {
});

describe.skip('CSRF protection', function () {
    "use strict";
    it('should fail when we delete authenticity-token in a form', function () {
    });
    it('should fail when we change authenticity-token in a form to something else', function () {
    });
});
