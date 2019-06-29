/**
* Main application file
*/
'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//Hide bluebird warnings
process.env.BLUEBIRD_WARNINGS = 0;

var config = require('config');
var logger = require('logger');
var path = require('path');

// Setup server
var express = require('express');
var app = express();

if(process.env.NODE_ENV === 'development'){
    app.use(require('cors')());
    logger.warn('CORS: Enabled');
}

var server = require('http').createServer(app);

// var io = require('socket.io')(server);
//
// io.on('connection',function(socket){
//   console.log('socket******************************************', socket)
// });

app.use(express.static(path.join(__dirname, 'tmp')));

var io = require('socket.io').listen(server);
app.io = io;

io.set("transports", ["polling","websocket"]);

io.on('connection', function (socket) {
  var socketComponent = require('./components/sockets');
  socketComponent.setIo(socket);
});

require('models'); //Load DB Models
require('./config')(app); //Setup express and application
require('./components/jobs').registerAll(); //Setup CRON and Queues

require('./components/servicemap') //Load services we provide
.setupServicesMap()
.then(function(){
    logger.trace('New Services and Measurments Created');
    return require('./components/servicemap/servicelist').bindServices();
})
.then(function(){
    logger.info('Service Matrix Setup: Done');
    return require('./components/diseasesmap').setupDiseasesMap()
    .then(function(){
        logger.info('Diseases Setup: Done');
    })
    .catch(function(e){
        logger.error('Diseases Setup: Failed');
        logger.trace(e);
    });
})
.then(function(){
    require('./routes')(app); //Load in route handlers
    server.listen(config.get('server.port'), config.get('server.ip'), function () { // Start server
        logger.info('Express server listening on ' + config.get('server.port') + ', in ' + app.get('env') + ' mode');
    });
})
.catch(function(e){
    logger.error('Service Matrix Setup: Failed');
    logger.error(e);
});

module.exports = app; // Expose app
