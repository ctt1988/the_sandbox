'use strict';

var _ = require('lodash');
var models = require('models');
var logger = require('logger');
var helper = require('./helpers');
var driver = require('../../../../api/service/driver');
var push = require('../../../quick-blox/push-notifications');
var reader = require('../../../../api/rest/monitor/measurements/reader');

var getRandomMessage = function(data){
  if(_.isEmpty(data)) return false;
  return data[Math.floor((Math.random() * data.length))];
}

module.exports = function(measurement){
  var messageList = [
    'Hello! Please take your COPD survey!',
    'Please remember to send your daily reading!',
    'Have you taken your daily reading today?',
    'Have you sent your readings to the doctor today?'
  ];

  return models.Device.getMonitorData(measurement.Monitor.id)
  .then(function(allowNotifications){
    var message = getRandomMessage(messageList);

    var code = measurement.Monitor.patient_code;
    if(allowNotifications){
      return push.sendPushNotificationByUser(code, message)
      .then(function(){
        logger.debug('Sync push notification sent to ' +code);
      })
      .catch(function(err){
        logger.error(err);
        logger.debug('Sync push notification sending failed to ' + code);
      });
    }
  })
  .catch(function(e){
    logger.error(e);
    logger.debug('Not getting the Monitor data');
  });
};
