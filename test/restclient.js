var Client = require('node-rest-client').Client;
var client = new Client();

function RestClient(url) {
    "use strict";
    this.url = url;
}

RestClient.prototype.login = function(username, password, done) {
    "use strict";
    var self = this;
    client.post(this.url + "/login", {data: { username: username, password: password}, headers: { "Content-Type": "application/json" }}, function(data, response) {
        if("jwt" in data && data.jwt != null)
            self.jwt = data.jwt;
        done(data);
    });
};

RestClient.prototype.getEmployee = function(id, done) {
    "use strict";
    client.get(this.url + "/get_emp?id=" + id, {headers: {"Content-Type": "application/json", "Authorization": this.jwt }}, function(data, response){
        done(data);
    });
};

RestClient.prototype.getAllEmployees = function(done) {
    "use strict";
    client.get(this.url + "/get_all", {headers: {"Content-Type": "application/json", "Authorization": this.jwt }}, function(data,response){
        done(data);
    });
};

RestClient.prototype.addEmployee = function(employee, done) {
    "use strict";
    client.post(this.url + "/add_emp", {headers: {"Content-Type": "application/json", "Authorization": this.jwt }, data: employee}, function(data, response){
        done(data);
    });
};

RestClient.prototype.updateEmployee = function(employee, done) {
    "use strict";
    client.post(this.url + "/upd_emp", {headers: {"Content-Type": "application/json", "Authorization": this.jwt }, data: employee}, function(data, response){
        done(data);
    });
};

RestClient.prototype.deleteEmployee = function(id, done) {
    "use strict";
    client.get(this.url + "/del_emp?id=" + id, {headers: {"Content-Type": "application/json", "Authorization": this.jwt }}, function(data, response){
        done(data);
    });
};

RestClient.prototype.setPassword = function(username, password, done) {
    "use strict";
    client.post(this.url + "/set_password", {data: { username: username, password: password}, headers: { "Content-Type": "application/json", Authorization: this.jwt }}, function(data, response) {
        done(data);
    });
};

module.exports = RestClient;
