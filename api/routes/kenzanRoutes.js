'use strict';

var authorize = require('../lib/authorizerole');

module.exports = function(app) {
  var employeeController = require('../controllers/employeeController.js');

  app.route('/login').post(employeeController.login);
  app.route('/get_emp').get(authorize(), employeeController.get_emp);
  app.route('/get_all').get(authorize(), employeeController.get_all);
  app.route('/add_emp').post(authorize('ROLE_ADD_EMP'), employeeController.add_emp);
  app.route('/update_emp').post(authorize('ROLE_UPDATE_EMP'), employeeController.update_emp);
  app.route('/delete_emp').get(authorize('ROLE_DELETE_EMP'), employeeController.delete_emp);
  app.route('/set_password').post(authorize(), employeeController.set_password);

};
