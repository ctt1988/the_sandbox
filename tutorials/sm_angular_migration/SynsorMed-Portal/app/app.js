process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var envconfig = require('./config/environment');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var compress = require('compression');
var routes = require('./routes/index');
var url  = require('url');

var app = express();

app.engine('html', swig.renderFile);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

swig.setDefaults({
    cache: false,
    varControls: ['<%=', '=%>'],
    tagControls: ['<%', '%>'],
    cmtControls: ['<#=', '#>']
});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(compress());

app.use(function(req, res, next){
    if(req.path.indexOf('/proxy') == 0) {
        return next();
    }
    else {
        bodyParser.json()(req, res, next)
    }
});
app.use(function(req, res, next){
    if(req.path.indexOf('/proxy') == 0) {
        return next();
    }
    else {
        bodyParser.urlencoded({ extended: false })(req, res, next)
    }
});

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'),{
    maxAge: envconfig.staticCacheAge
}));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    // handle CSRF token errors here
    res.status(403)
    res.send('session has expired or form tampered with')
})

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error.html', {
            message: err.message,
            error: err
        });
    });
//}

// production error handler
// no stacktraces leaked to user
//app.use(function(err, req, res, next) {
//    res.status(err.status || 500);
//    res.render('error.html', {
//        message: err.message,
//        error: {}
//    });
//});

var server = require('http').createServer(app);

server.listen(envconfig.port, envconfig.ip, function () {
    console.log('Express server listening on %d, in %s mode', envconfig.port, app.get('env'));
});

module.exports = app;
