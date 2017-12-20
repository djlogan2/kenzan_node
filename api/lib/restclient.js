const Client = require('node-rest-client').Client;
const client = new Client();
const ErrorCode = require('./errorcode');
const LocalDate = require('js-joda').LocalDate;

const validParser = {
    name: "JSON",
    isDefault: false,
    match: function (/*response*/) {
        return true; //response.headers["nothing"]==="nothing";
    },
    parse: function (byteBuffer, nrcEventEmitter, parsedCallback) {
        "use strict";
        let parsedData = null;
        try {
            if(byteBuffer.length !== 0) {
                try {
                    parsedData = JSON.parse(byteBuffer.toString());
                } catch (e) {
                    console.dir(e);
                    console.dir(byteBuffer.toString());
                }

                if(parsedData) {
                    if (parsedData.dateOfBirth) {
                        parsedData.dateOfBirth = LocalDate.parse(parsedData.dateOfBirth);
                    }

                    if (parsedData.dateOfEmployment) {
                        parsedData.dateOfEmployment = LocalDate.parse(parsedData.dateOfEmployment);
                    }
                }

            }

            parsedCallback(parsedData);
        } catch (err) {
            nrcEventEmitter('error', err);
        }
    }
};

client.parsers.add(validParser);

function RestClient(url, type) {
    "use strict";
    this.url = url;
    let prefix = 'c_';
    if(type === 'promises') prefix = 'p_';
    for (const attr in this)
    {
        if(attr.indexOf(prefix) === 0)
        {
            const newProperty = attr.substr(prefix.length);
            this[newProperty] = this[attr];
        }
    }
}

RestClient.prototype.promise_X = function() {
    "use strict";

    const args = [].slice.call(arguments);
    const self = this;
    const restFunction = args.shift();

    return new Promise(function(resolve, reject){
        args.push(function(data){
            if (data && data.errorcode && data.errorcode !== ErrorCode.NONE)
                reject(data);
            else
                resolve(data);
            return self;
        });
        restFunction.apply(self, args)
    });
};

RestClient.prototype.c_login = function (username, password, done) {
    "use strict";
    const self = this;
    client.post(this.url + "/login", {
        data: {username: username, password: password},
        headers: {"Content-Type": "application/json"}
    }, function (data) {
        if (data.jwt)
            self.jwt = data.jwt;
        done(data);
    });
};

RestClient.prototype.p_login = function(username, password) {
    "use strict";
    return this.promise_X(this.c_login, username, password);
};

RestClient.prototype.c_getEmployee = function (data, done) {
    "use strict";
    let parameters = '';
    if(typeof data !== 'object')
    {
        parameters = 'id=' + data;
    }
    else
    {
        let ampersand = '';
        for (const key in data)
        {
            parameters += ampersand + key + '=' + encodeURI(data[key]);
            ampersand = '&';
        }
    }

    client.get(this.url + "/get_emp?" + parameters, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": this.jwt
        }
    }, function (data) {
        if(data && "_id" in data)
        {
            Object.defineProperty(data, "id", {
                get: function() {return this._id;},
                set: function(val) {this._id = val; }
            });
        }
        done(data);
    });
};

RestClient.prototype.p_getEmployee = function(id) {
    "use strict";
    return this.promise_X(this.c_getEmployee, id);
};

RestClient.prototype.c_getAllEmployees = function (done) {
    "use strict";
    client.get(this.url + "/get_all", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": this.jwt
        }
    }, function (data) {
        if(data)
            data.forEach(function(emp){
                if("_id" in emp)
                {
                    Object.defineProperty(emp, "id", {
                        get: function() {return this._id;},
                        set: function(val) {this._id = val; }
                    });
                }
            });
        done(data);
    });
};

RestClient.prototype.p_getAllEmployees = function() {
    "use strict";
    return this.promise_X(this.c_getAllEmployees);
};

RestClient.prototype.c_addEmployee = function (employee, done) {
    "use strict";
    client.post(this.url + "/add_emp", {
        headers: {"Content-Type": "application/json", "Authorization": this.jwt},
        data: employee
    }, function (data) {
        done(data);
    });
};

RestClient.prototype.p_addEmployee = function(employee) {
    "use strict";
    return this.promise_X(this.c_addEmployee, employee);
};

RestClient.prototype.c_updateEmployee = function (employee, done) {
    "use strict";
    if("id" in employee)
    {
        employee._id = employee.id;
        delete employee.id;
        Object.defineProperty(employee, "id", {
            get: function() {return this._id;},
            set: function(val) {this._id = val; }
        });
    }
    client.post(this.url + "/update_emp", {
        headers: {"Content-Type": "application/json", "Authorization": this.jwt},
        data: employee
    }, function (data) {
        done(data);
    });
};

RestClient.prototype.p_updateEmployee = function(employee) {
    "use strict";
    return this.promise_X(this.c_updateEmployee, employee);
};

RestClient.prototype.c_deleteEmployee = function (id, done) {
    "use strict";
    client.get(this.url + "/delete_emp?id=" + id, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": this.jwt
        }
    }, function (data) {
        done(data);
    });
};

RestClient.prototype.p_deleteEmployee = function(id) {
    "use strict";
    return this.promise_X(this.c_deleteEmployee, id);
};

RestClient.prototype.c_setPassword = function (username, password, done) {
    "use strict";
    client.post(this.url + "/set_password", {
        data: {username: username, password: password},
        headers: {"Content-Type": "application/json", Authorization: this.jwt}
    }, function (data) {
        done(data);
    });
};

RestClient.prototype.p_setPassword = function(username, password) {
    "use strict";
    return this.promise_X(this.c_setPassword, username, password);
};

module.exports = RestClient;
