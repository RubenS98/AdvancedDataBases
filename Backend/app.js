var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");

var indexRouter = require('./routes/index');

var app = express();

var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

const redis = require('redis');

//Se crea nuevo cliente de Redis
const client = redis.createClient(
  {
    host: 'redis-13459.c244.us-east-1-2.ec2.cloud.redislabs.com',
    port: 13459,
    password: 'PhCOixzP31ZkIEcTSjowF89HSliUMU82'
});

client.on('connect', function() {
    console.log('connected');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('secret'));
app.use(cors());

app.use('/', indexRouter);

// Cacchar 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Manejar errores
app.use(function(err, req, res, next) {
  // Establecer locales, únicamente para errores en ambiente de desarrollo
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderizar página de error
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
exports.client=client;
