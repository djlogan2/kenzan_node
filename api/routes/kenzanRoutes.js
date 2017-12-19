'use strict';

var authorize = require('../lib/authorizerole');

module.exports = function(app) {
    var restController = require('../controllers/restController.js');
    var htmlController = require('../controllers/htmlController.js');

    app.route('/rest/login').post(restController.login);
    app.route('/rest/get_emp').get(authorize(), restController.get_emp);
    app.route('/rest/get_all').get(authorize(), restController.get_all);
    app.route('/rest/add_emp').post(authorize('ROLE_ADD_EMP'), restController.add_emp);
    app.route('/rest/update_emp').post(authorize('ROLE_UPDATE_EMP'), restController.update_emp);
    app.route('/rest/delete_emp').get(authorize('ROLE_DELETE_EMP'), restController.delete_emp);
    app.route('/rest/set_password').post(authorize(), restController.set_password);

    //
    // Match the same URL patterns Ruby uses
    // Update: We can't without javascript. Ruby uses magic under the covers
    //  in order to send 'DELETE', 'PATCH', and 'PUT' requests. We could do the
    //  same, but there really is no need. Just use the standard 'GET' and 'POST'
    //  methods.
    //
    app.route('/employees').get(htmlController.index);
    app.route('/employees').post(htmlController.create);

    app.route('/employees/new').get(htmlController.new);

    app.route('/employees/:id').get(htmlController.show);

    app.route('/employees/:id/edit').get(htmlController.edit);
    app.route('/employees/:id/edit').post(htmlController.update); // Ruby uses 'PUT', which isn't allowed via the HTML spec. So Ruby must be doing something cool under the covers. Go figure.

    //Moved this to the update method (post:save)
    //app.route('/employees/:id/delete').get(htmlController.destroy); // Delete isn't allowed either. Only GET and POST.
}