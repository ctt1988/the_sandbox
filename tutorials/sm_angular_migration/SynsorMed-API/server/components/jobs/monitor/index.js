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


/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var checkMonitors = function(monitors){
    var monitorQueue = []; // Queue for various services

    // monitors.forEach(function(monitor){
    //   if(monitor && monitor.medication){
    //       monitorQueue.push(function(callback){
    //           bin.checkByAPI(monitor)
    //           .then(function(data){
    //               callback(null, data);
    //           })
    //           .catch(function(e){
    //               logger.trace(e.message);
    //               callback(e, null);
    //           });
    //       });
    //   }
    // });
    var monitorGroups = {};
    monitorGroups.one = [];
    monitorGroups.two = [];
    monitorGroups.three = [];

    monitors.forEach(function(monitor){

      if(monitor && monitor.medication && monitor.medication_reminder){
        if(monitor.medication_reminder == 1){//once a day people
          monitorGroups.one.push(monitor.patient_code);
        }else if(monitor.medication_reminder == 2){//Twice a day people
          monitorGroups.two.push(monitor.patient_code);
        }else if(monitor.medication_reminder == 3){//3 per day people
          monitorGroups.three.push(monitor.patient_code);
        }
      }

    });

    console.log("*** The montorGroups are: " + JSON.stringify(monitorGroups));

    monitorQueue.push(function(callback){
      bin.checkByAPI(monitorGroups)
      .then(function(data){
        callback(null, data);
      })
      .catch(function(e){
        logger.trace(e.message);
        callback(e, null);
      });
    });

    //Main queue, which finishes when all queues are done
    var currentQueuePromise = Q.defer();
    asyncMod.parallelLimit(monitorQueue, config.get('cron.parallelLimit'), function(err, results){
        if(err){
            currentQueuePromise.reject(err);
        } else {
            currentQueuePromise.resolve(results);
        }
    });

    return currentQueuePromise.promise;
};


/**
* Cron Job logic, It pick all monitor , get API data and will then report missed/out of range monitors
*/

var task = function(){
    //find all the monitors which are in range
    return MonitorModel.findAll({
      include: [{
          required: true,
          model: models.User,
        }]
    })
    .then(function(monitors){
      if(monitors && monitors.length){
          return checkMonitors(monitors);
      }
      else{
          return logger.debug('No monitors find to send push notifications');
      }
    });
};
/**
 * Start the monitor cron job
 */

 //task()
module.exports.beginExecution = function(){
    scheduler.afterParicularTime(task, function(){
        logger.info('Monitor Cron Job Done');
    }, function(e){
        logger.error('Failed Monitor Cron Job due to : ' + e);
    });
    logger.info('Monitor Cron Setup: Done');

};
