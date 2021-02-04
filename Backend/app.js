var createError = require('http-errors');
var express = require('express');
const expSession = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");

var indexRouter = require('./routes/index');

var app = express();

const redis = require('redis');
const connectRedis = require('connect-redis');

const RedisStore = connectRedis(expSession)

const client = redis.createClient(
  {
    host: 'redis-13459.c244.us-east-1-2.ec2.cloud.redislabs.com',
    port: 13459,
    password: 'PhCOixzP31ZkIEcTSjowF89HSliUMU82'
}); //creates a new client

client.on('connect', function() {
    console.log('connected');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use(expSession({
  store: new RedisStore({ client: client }),
  secret: 'secret$%^134',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false, // if true only transmit cookie over https
      httpOnly: false, // if true prevent client side JS from reading the cookie 
      maxAge: 1000 * 60 * 10 // session max age in miliseconds
  }
}));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
exports.client=client;
