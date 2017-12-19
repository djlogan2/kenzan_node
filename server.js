var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    path = require('path');

//
// Mongoose instance
//
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.1.69/KenzanDB');
require('./api/models/employeeModel');

app.use(require('serve-favicon')(path.join(__dirname, 'public', 'kenzan.ico')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('./api/lib/session')(app);

var hbs = require('./api/lib/handlebars')(app);

require('./api/lib/protectfromforgery')(app, hbs);

app.use(require('./api/lib/authorizehtmluser'));
app.use(require('./api/lib/authorizerestuser'));

require('./api/routes/kenzanRoutes')(app);

app.listen(port);

console.log('Kenzan server started on: ' + port);
