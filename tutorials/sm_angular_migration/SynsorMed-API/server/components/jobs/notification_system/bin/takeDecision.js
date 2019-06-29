'use strict';

var Q = require('q');
var _ = require('lodash');
var units = require('../../../../api/service/drivers/base/units');

var getRecord = function(currentReading, latestReadings){
    if(latestReadings.length){
       var entry = latestReadings[latestReadings.length - 1];
       var diffDays = units.getDateDifferenceInDays(entry.date, currentReading.date);
       if(diffDays == 1){
           latestReadings.push(currentReading);
       }
       else{
           latestReadings = [currentReading];
       }
    }
    else{
        latestReadings.push(currentReading);
    }
    return latestReadings;
};

var getLatestReadings = function(readings){
    var latestMissed = [];
    var latestOutofBound = [];
    var latestCorrect = [];
    _.forEach(readings, function(reading){
        if(reading.isMissed){
            latestMissed = getRecord(reading, latestMissed);
        }
        else if(reading.isOutOfBound){
            latestOutofBound = getRecord(reading, latestOutofBound);
        }
        else{
            latestCorrect = getRecord(reading, latestCorrect);
        }
    });
    return {
             latestMissed: latestMissed,
             latestOutofBound: latestOutofBound,
             latestCorrect: latestCorrect
         };
};

var checkForToday = function(readings){
    if(_.isEmpty(readings)) return false;
    readings = readings.reverse();
    var today = units.getDateFromString();
    var date = units.getDateFromString(readings[0].date);
    return today == date ? readings : false;
};

var getProbability = function(isRegularFromCurrentDay, isOutOfBoundFromCurrentDay, isMissedFromCurrentDay, days){
    var randomNumber = Math.floor((Math.random() * 100) + 1);

    var safeReadingsLength = isRegularFromCurrentDay ? isRegularFromCurrentDay.length : 0;
    var outOfBoundReadingsLength = isOutOfBoundFromCurrentDay ? isOutOfBoundFromCurrentDay.length : 0;
    var missedReadingsLength = isMissedFromCurrentDay ? isMissedFromCurrentDay.length : 0;
    var unsafeReadingsLength = missedReadingsLength + outOfBoundReadingsLength;
    
    var sum = safeReadingsLength > unsafeReadingsLength ? safeReadingsLength : unsafeReadingsLength;
    var probability = parseInt((sum/days)*100);
   return Math.abs(probability - randomNumber);
};

exports.takeDecision = function(data){
    var defer = Q.defer();
    var decision = {};
    if(_.isEmpty(data)) return decision;
    var days = data.days;
    var records = data.records;
    var latestReadings = getLatestReadings(records);
    var isMissedFromCurrentDay = checkForToday(latestReadings.latestMissed);
    var isOutOfBoundFromCurrentDay = checkForToday(latestReadings.latestOutofBound);
    var isRegularFromCurrentDay = checkForToday(latestReadings.latestCorrect);
    decision.latestMissed = latestReadings.latestMissed;
    decision.latestOutofBound = latestReadings.latestOutofBound;
    decision.latestCorrect = latestReadings.latestCorrect;
    decision.max = data.max || null;
    decision.min = data.min || null;
    decision.average = data.average;
    decision.probability = getProbability(isRegularFromCurrentDay, isOutOfBoundFromCurrentDay, isMissedFromCurrentDay, days);
    decision.reason = {
        isMissed : !!isMissedFromCurrentDay,
        isOutOfBound: !!isOutOfBoundFromCurrentDay
    };
    decision.messageOk = !isMissedFromCurrentDay && !isOutOfBoundFromCurrentDay;
    defer.resolve(decision);
  return defer.promise;
};
