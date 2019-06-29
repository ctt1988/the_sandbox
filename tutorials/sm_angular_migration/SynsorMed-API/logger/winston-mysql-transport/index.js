var util = require('util');
var winston = require('winston');
var mysql = require('mysql');
var os = require('os');


// Constructor for the Mysql transport object.
var Mysql = exports.Mysql = function(options) {
    this.options = options || {};
    if (!options.database)
        throw new Error('The database name is required');

    if (!options.table)
        this.options.table = 'logs';

    if (!options.user)
        throw new Error('User is required');

    // set level for transport
    this.level = options.level || 'debug';
};


util.inherits(Mysql, winston.Transport);
winston.transports.Mysql = Mysql;
Mysql.prototype.name = 'Mysql';


// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
Mysql.prototype.log = function(level, msg, meta, callback) {
    var self = this;

    process.nextTick(function() {
        self.open(function(err, connection) {
            if (err) {
                self.emit('error', err);
                return callback(err, null);
            }

            var onError = function (err) {
               self.close(connection);
               self.emit('error', err);
               callback(err, null);
            };

            var log = {
                       message : ( (typeof msg == 'object' && msg.message && level == 'error') ? msg.message : msg ),
                       uid: self.options.uid ? self.options.uid : null,
                       timestamp : new Date(),
                       level : level,
                       hostname : os.hostname(),
                       meta : null
            };

          connection.query('INSERT INTO '+ self.options.table + ' SET ?', log, function(err) {
                self.close(connection);
                if(err){
                    return onError(err);
                }

                self.emit('logged');
                callback(null, true);
          });

      });

    });
};

//Create Table in database if not exists
Mysql.prototype.createTable = function(connection){
    var query = 'CREATE TABLE IF NOT EXISTS '+ this.options.table + '('+
                '`id` int(10) NOT NULL AUTO_INCREMENT,'+
                '`uid` int(10),'+
                '`level` varchar(45),'+
                '`message` text,'+
                '`timestamp` datetime ,'+
                '`meta` varchar(255),'+
                '`hostname` varchar(255),'+
                'PRIMARY KEY (`id`)'+
                ')';
    connection.query(query);
};

// Attempts to open a new connection to the MySQL server.
Mysql.prototype.open = function(callback) {
    var connection = mysql.createConnection(this.options);
    this.createTable(connection);
    callback(null, connection);
};

// Close a connection
Mysql.prototype.close = function (connection) {
    connection.end();
};
