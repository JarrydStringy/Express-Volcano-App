const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//Knex setup
const options = require('./knexfile.js');
const knex = require('knex')(options);

const cors = require('cors');

const app = express();

//Routes
const usersRouter = require('./routes/users');
const swaggerRouter = require('./routes/swagger');
const countriesRouter = require('./routes/countries');
const volcanoesRouter = require('./routes/volcanoes');
const identifyMeRouter = require('./routes/me');

require('dotenv').config();

//Connect to db
app.use((req, res, next) => {
  req.db = knex;
  next();
})

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

logger.token('res', (req, res) => {
  const headers = {}
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
  return JSON.stringify(headers)
})

app.get('/knex', function (req, res, next) {
  req.db.raw("SELECT VERSION()").then(
    (version) => console.log((version[0][0]))
  ).catch((err) => { console.log(err); throw err })
  res.send("Version Logged Successfully");
});

//Use the routes
app.use('/users', usersRouter);
app.use('/countries', countriesRouter);
app.use('/volcanoes', volcanoesRouter);
app.use('/volcano', volcanoesRouter);
app.use('/', swaggerRouter);
app.use('/me', identifyMeRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
