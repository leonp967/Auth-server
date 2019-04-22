var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  User = require('./api/auth-model'),
  bodyParser = require('body-parser'),
  authController = require('./api/auth-controller');
  
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Usersdb', { useNewUrlParser: true }); 


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routes = require('./api/auth-routes');
routes(app);
app.listen(port);
authController.init();


console.log('Auth Server started on: ' + port);