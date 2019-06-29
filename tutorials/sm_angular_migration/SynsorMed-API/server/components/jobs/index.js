'use strict';

var logger = require('logger');
var config = require('config');
var schedule = require('node-schedule');
var sync_alert = require('./sync_alert');
var monitor = require('./monitor');
var checkup_reminder = require('./checkup_reminder');
var measurement_monitor = require('./measurement_monitor');
var notification_system = require('./notification_system');
var push_notifications = require('./push_notifications');
var summary_emails = require('./summary_emails');

var getEnv = config.get('cron_time_prod') ? config.get('cron_time_prod') : config.get('cron_time_staging') ? config.get('cron_time_staging') : config.get('cron_time_test') ? config.get('cron_time_test') : config.get('cron_time_dev');

var startScheduling = function(task, success, failure, rule){
    return schedule.scheduleJob(rule, function(){
        task()
        .then(function(d){
          success(d);
        })
        .catch(function(e){
          logger.error(e);
          failure(e);
        });
    });
};

/**
 * Run a function (Promise) every midnight
 *
 * @param  Promise task , the task to run
 *
 */
 exports.everyNight = function(task, success, failure){
       //set cron job to execute on 1:00 PM UTC
       var rule = new schedule.RecurrenceRule();
       rule.hour = getEnv.everyNight.hour;
       rule.minute = getEnv.everyNight.minute; // its important to set minute to atleast 0
       var Job = startScheduling(task, success, failure, rule);
       Job.on('run', function(){
           logger.debug('Started survey emails cron job.');
           success();
       });
       Job.on('canceled', function(){
           logger.warn(' survey emails Cron job has been cancelled.');
       });
 };


/**
 * Run a function (Promise) every midnight
 *
 * @param  Promise task , the task to run
 *
 */
exports.everyMidnight = function(task, success, failure){
      //set cron job to execute on 1:00 PM UTC
      var rule = new schedule.RecurrenceRule();
      rule.hour = getEnv.everyMidnight.hour;
      rule.minute = getEnv.everyMidnight.minute; // its important to set minute to atleast 0

      var Job = startScheduling(task, success, failure, rule);

      Job.on('run', function(){
          logger.debug('Started a cron job.');
          success();
      });

      Job.on('canceled', function(){
          logger.warn('Cron job has been cancelled.');
      });

};

exports.everyEvening = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.everyEvening.hour;
    rule.minute = getEnv.everyEvening.minute; // its important to set minute to atleast 0 '0 */4 * * *'

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a notification cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Notification Cron job has been cancelled.');
    });

};

exports.everyMorning = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.everyMorning.hour; // 12 AM UTC = 8 PM EST
    rule.minute = getEnv.everyMorning.minute; // its important to set minute to atleast 0 '0 */4 * * *'

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a push notification cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Push notification Cron job has been cancelled.');
    });
};

exports.morningSync = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.morningSync.hour; // 3 PM UTC
    rule.minute = getEnv.morningSync.minute; // its important to set minute to atleast 0 '0 */4 * * *'

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a push notification cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Push notification Cron job has been cancelled.');
    });
};

exports.eveningSync = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.eveningSync.hour; // 11:00 PM UTC
    rule.minute = getEnv.eveningSync.minute; // its important to set minute to atleast 0 '0 */4 * * *'

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a push notification cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Push notification Cron job has been cancelled.');
    });
};

exports.afterParicularTime = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.afterParticularTime.hour; // 12 AM UTC = 8 PM EST
    rule.minute = getEnv.afterParticularTime.minute; // its important to set minute to atleast 0 '0 */4 * * *'

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a push notification cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Push notification Cron job has been cancelled.');
    });
};

exports.everyTuesdayOfWeek = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.onTuesday.hour;
    rule.minute = getEnv.onTuesday.minute;
    rule.dayOfWeek = getEnv.onTuesday.dayOfWeek;

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a email cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Email Cron job has been cancelled.');
    });
};

exports.everyFridayOfWeek = function(task, success, failure){
    var rule = new schedule.RecurrenceRule();
    rule.hour = getEnv.onFriday.hour;
    rule.minute = getEnv.onFriday.minute;
    rule.dayOfWeek = getEnv.onFriday.dayOfWeek;

    var Job = startScheduling(task, success, failure, rule);

    Job.on('run', function(){
        logger.debug('Started a email cron job.');
    });

    Job.on('canceled', function(){
        logger.warn('Email Cron job has been cancelled.');
    });
};

exports.registerAll = function(){
  if(getEnv.cronEnabled){
    monitor.beginExecution();
    measurement_monitor.beginExecution();
    notification_system.beginExecution();
    //push_notifications.beginExecution();
    checkup_reminder.beginExecution();
    sync_alert.beginExecution();
    summary_emails.beginExecution();
  }else{
    logger.info("Cron jobs disabled for this env");
  }
};
