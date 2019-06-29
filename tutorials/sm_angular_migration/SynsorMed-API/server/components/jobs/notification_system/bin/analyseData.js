'use strict';

var Q = require('q');
var moment = require('moment');
var logger = require('logger');
var helpers = require('./helpers');
var isOutOfBound = require('../../../../rules/monitor').isOutOfBound;
var units = require('../../../../api/service/drivers/base/units');

/**
 * analyseData for all measurements
 * @param readingObj, object, collection of readings where key is date
 * @param lowerbound, integer, lower range of reading
 * @param upperbound, integer, upper range of reading
 * @param repeat_within_seconds, timestamp, time interval
 * @param days, integer, days for which data will be fetched
 * @return object, contains records and latest readings
 */
var analyseData = function(readingObj, lowerbound, upperbound, repeat_within_seconds, days){
    days = days || 14;
    var startDate =  moment().subtract(days, 'days').startOf('day');
    var endDate =  moment();
    logger.debug('Reading from '+startDate.toString()+' to '+endDate.toString());
    var response = {};
    var records = [];
    var sum = 0, max = 0, min = 0, count = 0;

    for (var date = startDate; date.isBefore(endDate); date.add(1, 'days')){
         var currentReading = helpers.getReadingsForKey(readingObj, date);
         var temp = {};
             temp.date = units.getDateFromString(date);
             temp.reading = currentReading ? currentReading : null;
             temp.isMissed = !currentReading;
             temp.isOutOfBound = currentReading ? isOutOfBound(upperbound, lowerbound, currentReading) : false;
         records.push(temp);
         if(typeof currentReading != 'string') currentReading = currentReading.toString();
         if(currentReading && currentReading.indexOf('/') === -1){
              currentReading = parseFloat(currentReading);
              sum +=  currentReading;
              max = (currentReading > max) ? currentReading : max;
              min = min ? (currentReading < min ? currentReading : min) : currentReading;
              count++;
         }

    }
    response.days = days;
    response.records = records;
    response.average = (sum && count) ? parseFloat((sum/count).toFixed(2)) : null;
    response.max = max || null;
    response.min = min || null;
    response.rangeReading = helpers.getRangeReadings(readingObj, repeat_within_seconds);
    return response;
};



module.exports = function(readingObj, repeat_within_seconds, measurementName, lowerbound, upperbound){
    var defer = Q.defer();
    switch (measurementName.toLowerCase()) {
        case 'blood pressure':
        case 'glucose':
        case 'heartrate':
        case 'sleep':
        case 'steps':
        case 'temperature':
        case 'weight':
        case 'oxygen flow':
            defer.resolve(analyseData(readingObj, lowerbound, upperbound, repeat_within_seconds));
        break;
    }
    return defer.promise;
};
