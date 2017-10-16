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
                if("dateOfBirth" in parsedData) parsedData.dateOfBirth = new Date(parsedData.dateOfBirth + " 00:00:00");
                if("dateOfEmployment" in parsedData) parsedData.dateOfEmployment = new Date(parsedData.dateOfEmployment + " 00:00:00");
                //parsedData.parsed = true;
            }
            //else parsedData = {parsed: true};

            // emit custom event
            //nrcEventEmitter('parsed','data has been parsed ' + parsedData);

            // pass parsed data to client request method callback
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
