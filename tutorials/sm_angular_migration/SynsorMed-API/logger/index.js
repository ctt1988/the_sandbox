'use strict';

var winston = require('winston');
var path = require('path');
var config = require('config');

/*Don't remove these from here. These packages are necessary for transport.*/
var Logger = require('le_node');
var mysqlDB = require('./winston-mysql-transport').Mysql;

winston.emitErrs = true;

//get default log level
var args = require('minimist')(process.argv.slice(2));
var debugLevel = args.logger || 'debug';
var logger = new (winston.Logger)({
  levels: {
    sql: 0,
    trace: 1,
    debug: 2,
    info: 3,
    data: 4,
    help: 5,
    warn: 6,
    error: 7
  },
  colors: {
    trace: 'magenta',
    sql: 'bgBlue',
    debug: 'blue',
    info: 'bgGreen',
    data: 'grey',
    help: 'cyan',
    warn: 'bgYellow',
    error: 'bgRed'
  }
});

if (process.env.NODE_ENV != 'test') { // Hide logs on test environment
    logger.add(winston.transports.Console, {
        level: debugLevel,
        prettyPrint: true,
        colorize: true,
        silent: false,
        timestamp: false
    });
}



if(config.get('logging.logging_token')){
    logger.add(winston.transports.Logentries, {
          token : config.logging.logging_token,
          level: debugLevel,
          prettyPrint: true,
          colorize: true,
          silent: false,
          timestamp: false
    });
}

if(config.logging.db && config.logging.db.password){
    logger.add(winston.transports.Mysql, {
          host: config.logging.db.host,
          database: config.logging.db.database,
          user : config.logging.db.user,
          password: config.logging.db.password,
          level: 'trace'
    });
}

if(config.get('logging.file')){
    logger.add(winston.transports.DailyRotateFile, {
      level: 'trace',
      name: 'debug',
      datePattern: '.yyyy-MM-dd',
      filename: path.join(__dirname, '/../logs', 'debug.log')
    });
}

module.exports = logger;
module.exports.stream = {
  write: function(message){
    logger.info(message);
  }
};
