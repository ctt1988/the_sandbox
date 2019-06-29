'use strict';

var Q = require('q');
var _ = require('lodash');
var bin = require('./index');
var models = require('models');
var helper = require('./helpers');

var checkAlarms = function(extraData, measurement, emails, serviceName, latestSN){
    var defer = Q.defer();

    var infraction = measurement.infraction;
    if(!extraData || _.isEmpty(extraData)){
        infraction = infraction + 1;
        defer.reject({infraction: infraction, message: 'No alert data found for MeasurementMonitor ' + measurement.id});
        return defer.promise;
    }

    var extraReadings = helper.getDecisionReadings(extraData, measurement.repeat_within_seconds);

    if(_.isEmpty(extraReadings.latestAlarms)){
        infraction = infraction + 1;
        defer.reject({infraction: infraction, message: 'No current readings found for ' + measurement.Measurement.name + ' via MM Id / Service : ' + measurement.id + ' / ' + serviceName});
        return defer.promise;
    }

    var valueDate = null;
    var newAlarms = null;

    _.forEach(extraReadings.latestAlarms, function(record){
        valueDate = record.date;
    });

    var latestAlarms = extraReadings.latestAlarms ? extraReadings.latestAlarms : [];
    var lastAlarms = extraReadings.lastAlarms ? extraReadings.lastAlarms : [];

    Q.all([
        bin.isAlarmChanged(latestAlarms, lastAlarms),
        models.Event.createDataRecieveEvent(measurement.id, {
            readings: extraReadings.latestCount || 0
        })
    ])
    .spread(function(results){
        newAlarms = results;
        return bin.updateAndReset(measurement, latestAlarms, valueDate, latestSN, lastAlarms);
    })
    .then(function(){
        if(!_.isEmpty(newAlarms)){
            infraction = infraction + 1;
            if(infraction >= measurement.sensitivity){
                infraction = 0;
                if(measurement.Monitor.notify){
                    emails.forEach(function(email){
                        var today = new Date();
                        var yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        bin.sendAlarmChangeMail(email, measurement.Monitor.patient_code,  measurement.Monitor.description, yesterday, newAlarms);
                    });
                }
            }
            bin.setInfraction(measurement, infraction).then(defer.resolve).catch(defer.reject);
        }
        else{
          defer.resolve(true);
        }
    })
    .catch(defer.reject);

    return defer.promise;
};

module.exports = function(results, measurement, serviceName, emails){
    var extraData = helper.getExtraData(results, serviceName);
    var serialNumbers = helper.getSerialNumbers(results, serviceName);
    var latestSN = helper.getLatestSerialNumber(serialNumbers);
        latestSN = _.isEmpty(latestSN) ? null : latestSN [Object.keys(latestSN)[0]];
    return checkAlarms(extraData, measurement, emails, serviceName, latestSN);
};
