/**
* Express configuration
*/

'use strict';

var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var config = require('config');
var sequelize = require('models').sequelize;
var logger = require('logger');
var partial = require('express-partial');
var fs = require('fs');
var path = require('path');

module.exports = function(app) {
    app.set('views', 'server/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(compression());
    app.use(partial());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride());


    // filter output of logger
    app.use(function(req, res, next){
        logger.filters = [];

        logger.filters.push(function(message, meta, level, winstonObj){

            if(winstonObj.transports.Mysql){
               winstonObj.transports.Mysql.options.uid = (req.session && req.session.userId) ? req.session.userId : false ;
            }
            var extraText =  (req.session && req.session.userId) ? '[UID '+ req.session.userId +'] ' : '' ;
            return  extraText + message;
        });

        return next();
    });

    var session = require('express-session');
    var SessionStore = require('express-mysql-session');
    var dbDetails = {
        //Session Driver
        sessionConstructor: session.Session,
        // maximum age of a valid session in milliseconds
        // fallback to 24 minutes if nothing supplied
        expiration: config.get('session.expiration') || 1440000,
        // pass database details to session
        host       : sequelize.config.host,
        user       : sequelize.config.username,
        password   : sequelize.config.password,
        database   : sequelize.config.database
    };

    if(sequelize.config.port) dbDetails.port = sequelize.config.port;
    if(sequelize.config.dialectOptions){
       dbDetails.sslOptions = sequelize.config.dialectOptions.ssl;
       dbDetails.ssl = true;
    }
    app.use(session({
        secret: config.get('session.secret'),
        header: 'X-Session-Token',
        cookie: null,
        saveUninitialized: false,
        resave: false,
        store: new SessionStore(dbDetails)
    }));



    app.use(morgan('dev', {stream: logger.stream}));

    if (config.get('logging.level') > 1) {
        app.set('appPath', 'client');
        app.use(errorHandler()); // Error handler - has to be last
    }

};
