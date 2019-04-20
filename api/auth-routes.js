'use strict';
module.exports = function(app) {
  var authController = require('./auth-controller');

  app.route('/signup')
    .post(authController.createUser);


  app.route('/login')
    .post(authController.login);
};