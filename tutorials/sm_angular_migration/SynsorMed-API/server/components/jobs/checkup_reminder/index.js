'use strict';

var asyncMod = require('async');
var logger = require('logger');
var scheduler = require('../index');
var models = require('models');
var MonitorModel = models.Monitor;
var UserModel = models.User;
var logger = require('logger');
var mailer = require('../../../emails');

var task = function () {
  return UserModel.findAll({
    where: { is_reminder: 1 },
    include: [models.Organization]
  }).then(function(users){
    if(users && users.length){
      users.forEach(function(user){
        MonitorModel.findAll({
          include: [{
            required: true,
            model: UserModel,
            where:{org_id: user.org_id}
          }]
        }).then(function(monitors){
          return mailer.sendUserReminderEmail(user.email, user.first_name, user.Organization.name, monitors.length);
        });
      });
    }
  })
  .catch(function(e){
    logger.trace(e.message);
  });
};
/**
* Start the monitor cron job
*/
module.exports.beginExecution = function () {
  scheduler.everyTuesdayOfWeek(task, function () {
    logger.info('Tuesday Reminder Email Cron Job Done');
  }, function (e) {
    logger.error('Tuesday Reminder Email Cron Job due to : ' + e);
  });
  scheduler.everyFridayOfWeek(task, function () {
    logger.info('Friday Reminder Email Cron Job Done');
  }, function (e) {
    logger.error('Friday Reminder Email Cron Job due to : ' + e);
  });
  logger.info('Reminder Email Cron Setup: Done');
};
