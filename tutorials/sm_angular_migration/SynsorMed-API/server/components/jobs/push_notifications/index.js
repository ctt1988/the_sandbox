'use strict';

var Q = require('q');
var _ = require('lodash');
var bin = require('./bin');
var config = require('config');
var models = require('models');
var logger = require('logger');
var asyncMod = require('async');
var scheduler = require('../index');
var adminRoleId = config.get('seeds.roles.Admin');

/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var checkOrganizations = function(organizations){
    var orgQueue = [];
    var org = {};

    _.forEach(organizations, function(organization){
        var org_id = organization.id;
        if(org[org_id]) return;
        org[org_id] = true;
        orgQueue.push(function(callback){
            bin.checkByAPI(organization)
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
    var currentQueuePromise = Q.defer();
    logger.info(' Organization Queue has length ' + orgQueue.length);
    asyncMod.parallelLimit(orgQueue, config.get('cron.parallelLimit'), function(err, results){
        if(err){
            currentQueuePromise.reject(err);
        } else {
            currentQueuePromise.resolve(results);
        }
    });

    return currentQueuePromise.promise;
};

var task = function(){
    var active_org_ids = config.get('push_notifications.active_org_ids') || [];
    return models.Organization.findAll({
        where: {
            id: {
                $in: active_org_ids
            }
        },
        include: [{
          required: true,
          model: models.User,
          where: {
            role_id: adminRoleId
          }
        }]
    }) //find all active organizations
    .then(function(organization){
        if(organization && organization.length){
            return checkOrganizations(organization);
        }
        else{
            return logger.debug('No acitve organization to send push notifications');
        }
    });
};

module.exports.beginExecution = function(){
    scheduler.everyMorning(task, function(){
        logger.info('Push Notification Cron Job Done');
    }, function(e){
        logger.error('Failed Push Notification Cron Job due to : ' + e);
    });
    logger.info('Push Notification Cron Setup: Done');
};
