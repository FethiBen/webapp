var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var firebase = require('firebase');
var expressValidator = require('express-validator');
var expressSession = require('express-session');

var index = require('./routes/index');
//var users = require('./routes/users');//--------------------------------------A REVOIR

var app = express();
/*
// Change This...
// Copy and paste from Project Settings > Add Firebase to your web App
// Only copy the config variable...*/
var config = {
    apiKey: "AIzaSyDLgsyBBUYmKiDy4WErgoOYi6iKnCY2cMc",
    authDomain: "bennia-itansfo.firebaseapp.com",
    databaseURL: "https://bennia-itansfo.firebaseio.com",
    projectId: "bennia-itansfo",
    storageBucket: "bennia-itansfo.appspot.com",
    messagingSenderId: "608660233491"	
};
/*var firebase = firebase.initializeApp({
  serviceAccount: "./bennia-itansfo-firebase-adminsdk-30hx7-a050b7c503.json",
  databaseUrl: "https://bennia-itansfo.firebaseio.com"
}, 'firebase');
// Also copy the contents of rules.txt to Develop > Database > Rules
//
*/
firebase.initializeApp(config);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/img', express.static(path.join(__dirname, 'public/imgs')));
app.use('/js', express.static(path.join(__dirname, 'public/javascripts')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({ secret: 'sarfaraz', saveUninitialized: false, resave: false }));//secret : process.env.SESSION_SECRET
console.log('-in app- before app.use');
app.use('/', index);
console.log('-in app- after app.use');
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('-in app- app.use');
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
