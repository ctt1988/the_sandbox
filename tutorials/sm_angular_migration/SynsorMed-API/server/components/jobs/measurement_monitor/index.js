'use strict';

var asyncMod = require('async');
var logger = require('logger');
var Q = require('q');
var scheduler = require('../index');
var bin = require('./bin');
var config = require('config');
var _ = require('lodash');
var models = require('models');
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var UserModel = require('models').User;
var OauthMonitorTokenModel = require('models').OauthMonitorToken;
var MonitorModel = require('models').Monitor;
var MeasurementModel = require('models').Measurement;
var leaderboard = require('./leaderboard');


/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var checkMonitors = function(measurements){
    var apiQueue = {}; // Queue for various services

    measurements.forEach(function(measurement){
      if(!measurement.OauthMonitorToken){
          return true;
      }
      var currentService = measurement.OauthMonitorToken.service_name;

      // this service not in queue, add it
      if(!apiQueue[currentService]) {
        apiQueue[currentService] = [];
      }

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
        logger.info(service + ' API Queue has length ' + queue.length);
        var currentQueuePromise = Q.defer();
        asyncMod.parallelLimit(queue, config.get('cron.parallelLimit'), function(err, results){
            if(err){
                currentQueuePromise.reject(err);
            } else {
                currentQueuePromise.resolve(results);
            }
        });
        deferredAPI.push(currentQueuePromise.promise);
    });

    //run queue
    return Q.allSettled(deferredAPI);
};


/**
* Cron Job logic, It pick all monitor , get API data and will then report missed/out of range monitors
*/

var task = function(){
    //find all the model which are in range
    return MeasurementMonitorModel.findAll({
      //select monitors which were scheduled for today
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
          include: [{
              required: true,
              model: UserModel,
              include: [{
                  required: true,
                  model: models.Organization,
                  include: [{
                      model: models.OrganizationLeaderboard
                  }]
              }]
          }]
        }
      ]
    })
    .then(function(measurements){
      return checkMonitors(measurements);
    })
    .then(function(){
        return leaderboard.sendNotificationToWinners();
    });
};


/**
 * Start the monitor cron job
 */
module.exports.beginExecution = function(){

    scheduler.everyMidnight(task, function(){
        logger.info('Monitor Cron Job Done');
    }, function(e){
        logger.error('Failed Monitor Cron Job due to : ' + e);
    });
    logger.info('Monitor Cron Setup: Done');

};
