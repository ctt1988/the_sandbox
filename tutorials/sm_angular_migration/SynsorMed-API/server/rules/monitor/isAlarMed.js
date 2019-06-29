'use strict';

var _ = require('lodash');

/**
 * Calculate the alarm status
 * @param prevReading , Object , prev latest reading
 * @param latestReading , Object , Date when last recorded
 * @return Boolean
 */

 var checkForNewAlarm = function(lastAlarms, latestAlarm, date){
     var response = [];
     var currentAlarm = Object.keys(latestAlarm);
     _.forEach(lastAlarms, function(lastAlarm){
         var lastAlarmValue = lastAlarm.value;
         var prevAlarms = Object.keys(lastAlarmValue);
         var latestUnique = currentAlarm.length > prevAlarms.length ?
                            _.difference(currentAlarm, prevAlarms) :
                            _.difference(prevAlarms, currentAlarm) ;

         if(latestUnique.length) response.push({date: date, value: latestAlarm});
     });
     return response;
 };

 module.exports = function(latestAlarms, lastAlarms){
     var newAlarms = [];
      if(!latestAlarms || !lastAlarms) return newAlarms;
      latestAlarms = _.filter(latestAlarms, function(record){
          return (!record.value.Cleared);
      });
      if(!lastAlarms.length) return latestAlarms;
     _.forEach(latestAlarms, function(record){
         var latestAlarm = record.value;
         if(!lastAlarms.length) return;
         var newData = checkForNewAlarm(lastAlarms, latestAlarm, record.date);
         if(newData.length) newAlarms = newAlarms.concat(newData);
     });
    return newAlarms;
 };
