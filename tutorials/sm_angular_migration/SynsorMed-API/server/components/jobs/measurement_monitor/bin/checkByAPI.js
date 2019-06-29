'use strict';

var _ = require('lodash');
var bin = require('./index');
var logger = require('logger');
var assert = require('assert');
var models = require('models');
var helper = require('./helpers');
var driver = require('../../../../api/service/driver');
var units = require('../../../../api/service/drivers/base/units');
var reader = require('../../../../api/rest/monitor/measurements/reader');
var moment = require('moment');

/**
* Fetch monitor API data , process to see if monitor is valid
* Send emails in case of invalid status
*/
module.exports = function(measurement){
    var oauthData = null
    , serviceName = null
    , infraction = measurement.infraction
    , emails = null
    , readings
    , isC5Measurement = false
    , readingObj
    , isOutOfBound
    , latestReading;

    return bin.getReceiverEmails(measurement.Monitor.User, measurement.Monitor.reporting_emails)
    .then(function(emailArray){
        assert(emailArray, 'No emails to report to'); //we need some emails
        emails = emailArray;
        return measurement.getAuthData(); //get latest Oauth data
    })
    .then(function(oauthDataSet){
        if(oauthDataSet){ //get Oauth data and service
            oauthData = JSON.parse(oauthDataSet.oauth_data);
            serviceName = oauthDataSet.service_name;
        }

        isC5Measurement = helper.isC5Measurement(serviceName);

        if(!oauthData || !serviceName){ //this monitor doesn't have any oauth data, its an infraction
            infraction = infraction + 1;
            throw new Error('No oAuth data found for MeasurementMonitor ' + measurement.id);
        }

        oauthData.all = true; //set `all` param to true, get all the readings from API
        oauthData.oauthModelInstance = measurement.OauthMonitorToken;
        if(bin.measurementIds.indexOf(measurement.Measurement.id) != -1) oauthData.days = 10;

        return driver.getUserDetails(serviceName, oauthData, measurement.Measurement.name);
    })
    .then(function(results){
        readingObj = reader(measurement.Measurement, serviceName, results, true); //get desired readings from all API records
        if(serviceName == 'survey'){
          // var readingObjKeys = Object.keys(readingObj);
          // var sortedDayData = readingObjKeys.sort(function(a, b){
          //    return new Date(b) - new Date(a);
          // });
          // var lastDataDate = sortedDayData[0];
          var lastDataDate = measurement.OauthMonitorToken.last_sync;
          var futureDate = moment(lastDataDate).add(48, 'hours').format('DD MMM YYYY HH:mm:ss');
          var currentDate = moment().format('DD MMM YYYY HH:mm:ss');

          if(currentDate > futureDate){
            infraction = 2
            throw new Error('No readings sent within 48 hours ' + measurement.Measurement.name + ' via MM Id / Service : ' + measurement.id + ' / ' + serviceName);
          }
          else{
            return true;
          }
        }

        if(isC5Measurement){
            return bin.oxygenAPI(results, measurement, serviceName, emails);
        }

        if(_.isEmpty(readingObj)) {
            infraction = infraction + 1;
            throw new Error('No readings found for ' + measurement.Measurement.name + ' via MM Id / Service : ' + measurement.id + ' / ' + serviceName);
        }

        return bin.leaderboard(measurement, readingObj) // save data for leaderboard for enrolled measurement
        .then(function(){
            readings = helper.getRangeReadings(readingObj, measurement.repeat_within_seconds); //get all required readings

            if(_.isEmpty(readings)) { //No reading for range
                infraction = infraction + 1;
                throw new Error('No readings date range found for ' +  measurement.Measurement.name + ' via MM Id / Service : ' + measurement.id + ' / ' + serviceName);
            }

            if(serviceName == 'survey'){
                return bin.surveyAlert(measurement, readings, infraction);
            }

            return bin.isAPIDataOutofBound(readings, measurement.upperbound, measurement.lowerbound, measurement.sensitivity, infraction); // check outofbound status of meassurement
        })
        .spread(function(respOutofBound, readingToUpdate, newInfraction){
            infraction = newInfraction;
            isOutOfBound = respOutofBound;
            latestReading = readingToUpdate;
            return bin.updateAndReset(measurement, readingToUpdate.value, readingToUpdate.date);
        })
        .then(function(updateStatus){
            var eventData;

            if(updateStatus === false){
                infraction = infraction + 1;
                throw new Error('Reset of Measurement ' + measurement.id + ' was failed');
            }

            if(isOutOfBound === true){
                logger.warn('Measurement Out of bound  ' + measurement.id + ' with ' + latestReading.value);
                if(infraction >= measurement.sensitivity){
                    infraction = 0;
                    if(measurement.Monitor.notify){
                        var readingValue = helper.removeFractionalZero(latestReading.value);
                        var readingUnit = units.getUnit(measurement.Measurement.name, 'en_US') || '';
                        emails.forEach(function(email){
                            bin.sendOutOfRangeEmail(email, measurement.Monitor.patient_code, new Date(), measurement.Monitor.description, readingValue, readingUnit);
                        });
                    }
                }
                eventData = { out_of_bound: true, readings: readings.length };
            }
            else {
                infraction = 0;
                eventData = { readings: readings.length };
            }
            return bin.setInfraction(measurement, infraction)
            .then(function(){
                return models.Event.createDataRecieveEvent(measurement.id, eventData);
            });
        });
    })
    .then(function(){
      return true;
    })
    .catch(function(e){
        logger.error(e);
        infraction = e && e.infraction ? e.infraction : infraction;
        if(infraction >= measurement.sensitivity){
            infraction = 0; //reset infraction value if email is send
            if(measurement.Monitor.notify){
                emails.forEach(function(email){
                    var today = new Date();
                    var yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    bin.sendMissedEmail(email, measurement.Monitor.patient_code, yesterday, false, measurement.Monitor.description);
                });
            }
        }
        return bin.setInfraction(measurement, infraction)
        .then(function(){
            var eventData = { missed: true };
            return models.Event.createDataRecieveEvent(measurement.id, eventData);
        })
        .then(function(){
            return e;
        })
        .catch(function(err){
            logger.error(err);
            console.log(err);
        });
    });
};
