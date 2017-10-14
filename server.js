var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  Employee = require('./api/models/employeeModel'),
  bodyParser = require('body-parser');

//
// Mongoose instance
//
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/KenzanDB');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/kenzanRoutes');
routes(app);

app.listen(port);

console.log('Kenzan RESTful API server started on: ' + port);
