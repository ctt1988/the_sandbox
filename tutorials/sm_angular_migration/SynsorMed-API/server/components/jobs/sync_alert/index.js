'use strict';

var Q = require('q');
var _ = require('lodash');
var bin = require('./bin');
var config = require('config');
var logger = require('logger');
var models = require('models');
var asyncMod = require('async');
var scheduler = require('../index');

var checkMonitors = function(measurements){
    var apiQueue = {};

    measurements.forEach(function(measurement){
        if(!measurement.OauthMonitorToken){
            return true;
        }
        var currentService = measurement.OauthMonitorToken.service_name;

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

    return Q.allSettled(deferredAPI);
};



var task = function(){
    return models.MeasurementMonitor.findAll({
        where: ['`MeasurementMonitor`.`deleted_at` IS NULL AND `MeasurementMonitor`.`oauth_id` IS NOT NULL'],
        include: [
            models.OauthMonitorToken,
            {
                required: true,
                model: models.Measurement,
                where: {
                    name: {
                        $like: 'status'
                    }
                }
            },
            {
                required: true,
                model: models.Monitor,
                where: {
                    auto_fetch: { $eq: true }
                },
                include: [
                    {
                        required: true,
                        model: models.User,
                        where: {
                            org_id: {
                                $in: config.get('push_notifications.active_org_ids') || []
                            }
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
    // scheduler.morningSync(task, function(){ // for evening
    //     logger.info('Sync Push Notification Cron Job Done');
    // }, function(e){
    //     logger.error('Failed Sync Push Notification Cron Job due to : ' + e);
    // });
    scheduler.eveningSync(task, function(){ // for morning
        logger.info('Sync Push Notification Cron Job Done');
    }, function(e){
        logger.error('Failed Sync Push Notification Cron Job due to : ' + e);
    });
    logger.info('Sync Push Notification Cron Setup: Done');
};
