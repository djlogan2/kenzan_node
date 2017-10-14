'use string';

module.exports = function(app) {
  var employeeController = require('../controllers/employeeController.js');

  app.route('/login').post(employeeController.login);
  app.route('/get_emp').get(employeeController.get_emp);
  app.route('/get_all').get(employeeController.get_all);
  app.route('/add_emp').post(employeeController.add_emp);
  app.route('/update_emp').post(employeeController.update_emp);
  app.route('/delete_emp').get(employeeController.delete_emp);
  app.route('/set_password').post(employeeController.set_password);

};
