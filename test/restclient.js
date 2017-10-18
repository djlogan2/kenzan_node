var Client = require('node-rest-client').Client;
var client = new Client();

var _ = require('underscore');

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
            if(byteBuffer.length != 0) {
                parsedData = JSON.parse(byteBuffer.toString());

                if(parsedData) {
                    if ("dateOfBirth" in parsedData) {
                        if (parsedData.dateOfBirth.indexOf("00:00:00") == -1)
                            parsedData.dateOfBirth = parsedData.dateOfBirth + " 00:00:00";
                        parsedData.dateOfBirth = new Date(parsedData.dateOfBirth);
                    }

                    if ("dateOfEmployment" in parsedData) {
                        if (parsedData.dateOfEmployment.indexOf("00:00:00") == -1)
                            parsedData.dateOfEmployment = parsedData.dateOfEmployment + " 00:00:00";
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
    }, function (data, response) {
        if ("jwt" in data && data.jwt != null)
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
    }, function (data, response) {
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
    }, function (data, response) {
        done(data);
    });
};

RestClient.prototype.addEmployee = function (employee, done) {
    "use strict";
    client.post(this.url + "/add_emp", {
        headers: {"Content-Type": "application/json", "Authorization": this.jwt},
        data: employee
    }, function (data, response) {
        done(data);
    });
};

RestClient.prototype.updateEmployee = function (employee, done) {
    "use strict";
    client.post(this.url + "/update_emp", {
        headers: {"Content-Type": "application/json", "Authorization": this.jwt},
        data: employee
    }, function (data, response) {
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
    }, function (data, response) {
        done(data);
    });
};

RestClient.prototype.setPassword = function (username, password, done) {
    "use strict";
    client.post(this.url + "/set_password", {
        data: {username: username, password: password},
        headers: {"Content-Type": "application/json", Authorization: this.jwt}
    }, function (data, response) {
        done(data);
    });
};

module.exports = RestClient;
