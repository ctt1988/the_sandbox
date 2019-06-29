'use strict';

var reader = require('../../../../api/rest/monitor/measurements/reader');
var push = require('../../../quick-blox/push-notifications');
var driver = require('../../../../api/service/driver');
var takedecision = require('./takeDecision');
var analyseData = require('./analyseData');
var getMessage = require('./getMessage');
var helpers = require('./helpers');
var logger = require('logger');
var models = require('models');

module.exports = function(measurement){
    var oauthData = null;
    var serviceName = null;
    var decision = null;
    var patientName = measurement.Monitor.Patient.getName();

    return measurement.getAuthData()
    .then(function(oauthDataSet){
         oauthData = oauthDataSet ? JSON.parse(oauthDataSet.oauth_data) : oauthData;
         serviceName = oauthDataSet ? oauthDataSet.service_name : serviceName;
         if(!oauthData || !serviceName){ //this monitor doesn't have any oauth data
            throw new Error('No oAuth data found for MeasurementMonitor ' + measurement.id);
         }
         oauthData.all = true;  //set `all` param to true, get all the readings from API
         oauthData.days = 30; // set `days` param to read last 30 days data;
         oauthData.oauthModelInstance = measurement.OauthMonitorToken;
         return driver.getUserDetails(serviceName, oauthData, measurement.Measurement.name);//get desired readings from all API records
    })
    .then(function(results){
        var readingObj = reader(measurement.Measurement, serviceName, results, true);
            readingObj = helpers.getMeasurementData(readingObj, serviceName);
        return analyseData(readingObj, measurement.repeat_within_seconds, measurement.Measurement.name, measurement.lowerbound,  measurement.upperbound);
    })
    .then(function(analysedData){
        return takedecision.takeDecision(analysedData);
    })
    .then(function(result){
        decision = result;
        if(result.probability <= 50){
            throw new Error('Today is lesser probability of sending push notification to ' + measurement.Monitor.patient_code);
        }
       return models.Device.getMonitorData(measurement.Monitor.id);
    })
    .then(function(allowNotifications){
        if(!allowNotifications){
            throw new Error('Monitor '+measurement.Monitor.patient_code+ ' did\'t logged on any device yet');
        }
        return getMessage(decision, measurement.Measurement.name,  measurement.lowerbound,  measurement.upperbound, patientName);
    })
    .then(function(message){
        var code = measurement.Monitor.patient_code;
        console.log('Message for '+code+' is ', message);
        return push.sendPushNotificationByUser(code, message)
        .then(function(){
            logger.debug('Sync push notification sent to ' +code);
        });
    })
    .catch(function(error){
        logger.error(error);
    });
};
