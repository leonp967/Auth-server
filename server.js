var express = require('express'),
  app = express(),
  port = 3000,
  mongoose = require('mongoose'),
  User = require('./api/auth-model'),
  bodyParser = require('body-parser'),
  authController = require('./api/auth-controller');
  
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://heroku_twtlc8cz:ijusuh34j5nnpdd9cdunk5l8kc@ds145128.mlab.com:45128/heroku_twtlc8cz', { useNewUrlParser: true }); 


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/auth-routes');
routes(app);
app.listen(port);
authController.init();


console.log('Auth Server started on: ' + port);