var Client = require('node-rest-client').Client;
var client = new Client();

var validParser = {
    name: "JSON",
    isDefault: false,
    match: function (response) {
        return true; //response.headers["nothing"]==="nothing";
    },
    parse: function (byteBuffer, nrcEventEmitter, parsedCallback) {
        "use strict";
        var parsedData = null;
        try {
            if(byteBuffer.length !== 0) {
                parsedData = JSON.parse(byteBuffer.toString());

                if(parsedData) {
                    if (parsedData.dateOfBirth /*"dateOfBirth" in parsedData*/) {
                        parsedData.dateOfBirth = new Date(parsedData.dateOfBirth);
                    }

                    if (parsedData.dateOfEmployment /*"dateOfEmployment" in parsedData*/) {
                        parsedData.dateOfEmployment = new Date(parsedData.dateOfEmployment);
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

function RestClient(url) {
    "use strict";
    this.url = url;
}

RestClient.prototype.login = function (username, password, done) {
    "use strict";
    var self = this;
    client.post(this.url + "/login", {
        data: {username: username, password: password},
        headers: {"Content-Type": "application/json"}
    }, function (data) {
        if (data.jwt)
            self.jwt = data.jwt;
        done(data);
    });
};

RestClient.prototype.getEmployee = function (id, done) {
    "use strict";
    client.get(this.url + "/get_emp?id=" + id, {
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

RestClient.prototype.getAllEmployees = function (done) {
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

RestClient.prototype.addEmployee = function (employee, done) {
    "use strict";
    client.post(this.url + "/add_emp", {
        headers: {"Content-Type": "application/json", "Authorization": this.jwt},
        data: employee
    }, function (data) {
        done(data);
    });
};

RestClient.prototype.updateEmployee = function (employee, done) {
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

RestClient.prototype.deleteEmployee = function (id, done) {
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

RestClient.prototype.setPassword = function (username, password, done) {
    "use strict";
    client.post(this.url + "/set_password", {
        data: {username: username, password: password},
        headers: {"Content-Type": "application/json", Authorization: this.jwt}
    }, function (data) {
        done(data);
    });
};

module.exports = RestClient;
