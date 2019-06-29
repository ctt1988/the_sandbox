var scheduler = require('../index');
var asyncMod = require('async');
var logger = require('logger');
var config = require('config');
var bin = require('./bin');
var _ = require('lodash');
var Q = require('q');

var models = require('models');
var MeasurementMonitorModel = models.MeasurementMonitor;
var OauthMonitorTokenModel = models.OauthMonitorToken;
var MeasurementModel = models.Measurement;
var PatientModel = models.Patient;
var MonitorModel = models.Monitor;
var UserModel = models.User;

/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var checkMonitors = function(measurements){
    var apiQueue = {}; // Queue for various services

    measurements.forEach(function(measurement){
        if(!measurement.OauthMonitorToken || !measurement.Monitor.Patient || !measurement.Monitor.Patient.notify){
            return true;
        }

        var currentService = measurement.OauthMonitorToken.service_name;
        // if service not in queue, add it
        apiQueue[currentService] = !apiQueue[currentService] ? [] : apiQueue[currentService];

        apiQueue[currentService].push(function(callback){
            bin.checkByAPI(measurement)
            .then(function(data){
                callback(null, data);
            })
            .catch(function(e){
                logger.trace(e.message);
                callback(e, null);
            });
        });

    });

    //Main queue, which finishes when all queues are done
    var deferredAPI = [];
    _.forEach(apiQueue, function(queue, service){
        var currentQueuePromise = Q.defer();
        logger.info(service + ' API Queue has length ' + queue.length);
        asyncMod.parallelLimit(queue, config.get('cron.parallelLimit'), function(err, results){
            if(err){
                currentQueuePromise.reject(err);
            } else {
                currentQueuePromise.resolve(results);
            }
        });
        deferredAPI.push(currentQueuePromise.promise);
    });
    return Q.allSettled(deferredAPI); //run queue
};

var task = function(){

    return MeasurementMonitorModel.findAll({
        where: ['DATE_ADD(`MeasurementMonitor`.`created_at`,INTERVAL repeat_within_seconds SECOND) <= CURDATE() AND `MeasurementMonitor`.`deleted_at` IS NULL AND `MeasurementMonitor`.`oauth_id` IS NOT NULL'],
        include: [
            OauthMonitorTokenModel,
            MeasurementModel,
            {
                required: true,
                model: MonitorModel,
                where: {
                    auto_fetch: { $eq: true }
                },
                include: [
                     UserModel,
                     {
                          model: PatientModel,
                          where: {
                              notify: true
                          }
                     }
                ]
            }
        ]
    })
    .then(function(measurements){
        return checkMonitors(measurements);
    });
};

module.exports.beginExecution = function(){
    scheduler.everyEvening(task, function(){
        logger.info('Notification Cron Job Done');
    }, function(e){
        logger.error('Failed Monitor Cron Job due to : ' + e);
    });
    logger.info('Notification Cron Setup: Done');
};
