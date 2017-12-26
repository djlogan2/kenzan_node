"use strict";

const assert = require('assert');
const LocalDate = require('js-joda').LocalDate;

const _environment = {
    java: {url: 'http://localhost/', http_suffix: 'employees/', rest_suffix: 'rest/', db_id: 1},
    ruby: {url: 'http://192.168.1.69:3000/', http_suffix: 'employees/', rest_suffix: 'rest/', db_id: 1},
    node: {},
    csharp: {},
};

_environment.ruby.fillDate = function (browser, datefld, y, m, d) {
    if (y === 'InvalidDate') return; // No way to really enter an invalid date in the ruby screen
    if (datefld === 'dateOfEmployment') {
        if (y)
            browser.check('#employee_hasEmploymentDate');
        else {
            browser.uncheck('#employee_hasEmploymentDate');
            return;
        }
    }

    assert.ok(y, 'Must have an actual date');

    if (y instanceof LocalDate) {
        d = y.dayOfMonth().toString();
        m = y.monthValue().toString();
        y = y.year().toString();
    }

    browser.select(`#employee_${datefld}_1i`, y);
    browser.select(`#employee_${datefld}_2i`, m);
    browser.select(`#employee_${datefld}_3i`, d);
};

_environment.ruby.assertDateField = function (browser, datefld) {
    browser.assert.element(`#employee_${datefld}_1i`);
    browser.assert.element(`#employee_${datefld}_2i`);
    browser.assert.element(`#employee_${datefld}_3i`);
    if (datefld === 'dateOfEmployment')
        browser.assert.element(`#employee_hasEmploymentDate`);
};

_environment.ruby.getDate = function (browser, datefld) {
    const c = (datefld === 'dateOfEmployment' ? browser.querySelector('#employee_hasEmploymentDate').checked : true);

    if (!c) return null; // Not checked means date should be null

    const y = browser.querySelector(`#employee_${datefld}_1i`).value;
    const m = browser.querySelector(`#employee_${datefld}_2i`).value;
    const d = browser.querySelector(`#employee_${datefld}_3i`).value;

    return LocalDate.of(y, m, d);
};

function environment(which_environment) {
    const self = this;
    this.env = which_environment;
    ['fillDate', 'assertDateField', 'getDate'].forEach(function (key) {
        self[key] = _environment[which_environment][key];
    });
};

['url', 'http_suffix', 'rest_suffix', 'db_id'].forEach(function (key) {
    Object.defineProperty(environment.prototype, key, {
        get: function () {
            return _environment[this.env][key];
        }
    });
});

['http', 'rest'].forEach(function (key) {
    Object.defineProperty(environment.prototype, `${key}_url`, {
        get: function () {
            return _environment[this.env].url + _environment[this.env][`${key}_suffix`];
        }
    });
});

environment.prototype.fillDate = function (browser, datefld, date) {
    _environment[this.env].fillDate(browser, datefld, date);
};
environment.prototype.assertDateField = function (browser, datefld, date) {
    _environment[this.env].assertDateField(browser, datefld, date);
};
environment.prototype.getDate = function (browser, datefld) {
    _environment[this.env].getDate(browser, datefld);
};

module.exports = which_environment => new environment(which_environment);