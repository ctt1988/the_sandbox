'use strict';

var moment = require('moment');
var _ = require('lodash');
var logger = require('logger');
var reader = require('../../../../api/rest/monitor/measurements/reader');
var units = require('../../../../api/service/drivers/base/units');

var uniqReadingObj = function(readingObj){
    var newReading = {};
    var prevReading = null;
    _.forEach(readingObj, function(reading, key){
         if(!prevReading){
             prevReading = reading;
             newReading[key] = reading;
         }
         else if(!_.isEqual(prevReading, reading)){
            newReading[key] = reading;
            prevReading = reading;
         }
    });
    return newReading;
};

module.exports.getPoints = function(readingObj, startDate){
   var points = 0;
   var start = moment(startDate).subtract(1, 'days');
   var end = moment();
   _.forEach(readingObj, function(value, key){
         var currDate = moment(key, 'D MMM YYYY HH:mm:ss');
         if(currDate.isSame(start) || currDate.isBetween(start, end, 'days') ){
             points = points + parseInt(value);
         }
   });
   return points;
};

module.exports.getLatestSerialNumber = function(serialNumbers){
    var response = {};
    _.forEach(serialNumbers, function(serialNumber, key){
        var tempResp = {};
        if(_.isEmpty(response)){
            tempResp[key] = serialNumber;
        }
        else{
             var currDate = units.getUnixFromFormattedDateTime(key);
             var lastDate = units.getUnixFromFormattedDateTime(Object.keys(response)[0]);
             if(currDate >= lastDate) tempResp[key] = serialNumber;
        }
        response = tempResp;
   });
   return response;
};

module.exports.getSerialNumbers = function(results, serviceName){
    if(serviceName.toLowerCase() == 'c5'){
        return reader({name: 'serial number'}, 'c5', results, true);
    }
    else return false;
};

exports.isC5Measurement = function(serviceName){
    return ( serviceName && (serviceName.toLowerCase() == 'c5') );
};

exports.getLatestDecisionReadings = function(readingObjct){
    var latestAlarm = null;
    var lastAlarm = null;
    var readingObj = uniqReadingObj(readingObjct);
    _.forEach(readingObj, function(n, key){
        var currDate = moment(key, 'D MMM YYYY HH:mm:ss');
        if(latestAlarm && (latestAlarm.date < currDate)){
            lastAlarm = latestAlarm;
            latestAlarm =  {date: currDate.unix(), value: n};
        }
        else if(lastAlarm && (lastAlarm.date < n) ){
            lastAlarm = {date: currDate.unix(), value: n};
        }
        if(!latestAlarm) latestAlarm =  {date: currDate.unix(), value: n};
    });
    return {latestAlarms: (latestAlarm ? [latestAlarm] : []), lastAlarms: (lastAlarm ? [lastAlarm] : [])};
};

exports.getDecisionReadings = function(readingObjct, repeatInterval){
    var latestAlarm = null;
    var lastAlarm = null;
    var readingObj = uniqReadingObj(readingObjct);
    var start = moment().subtract(repeatInterval <= 86400 ? 86400 : repeatInterval, 'seconds').startOf('day');
    var end = moment();
    var latestDataCount = 0;
    _.forEach(readingObj, function(n, key){
        var currDate = moment(key, 'D MMM YYYY HH:mm:ss');
        if(currDate.isSame(start) || currDate.isBetween(start, end, 'seconds')){
            latestDataCount++;
            if(latestAlarm && (latestAlarm.date < currDate)){
                lastAlarm = latestAlarm;
                latestAlarm =  {date: currDate.unix(), value: n};
            }
            else if(lastAlarm && (lastAlarm.date < n) ){
                lastAlarm = {date: currDate.unix(), value: n};
            }
            if(!latestAlarm) latestAlarm =  {date: currDate.unix(), value: n};
        }
    });
  return {latestAlarms: (latestAlarm ? [latestAlarm] : []), lastAlarms: (lastAlarm ? [lastAlarm] : []), latestCount: latestDataCount};
};

exports.getExtraData = function(results, serviceName){
    if(serviceName.toLowerCase() == 'c5'){
        return reader({name: 'alarms'}, 'c5', results, true);
    }
    else return false;
};

exports.getMeasurementData = function(readingObj, serviceName){
    if(serviceName.toLowerCase() == 'c5'){
        var response = {};
        _.forEach(readingObj, function(reading, key){
            if(reading && reading['oxygen flow']) response[key] = reading['oxygen flow'];
        });
        return response;
    }
    else return readingObj;
};

exports.getRangeReadings = function(readingObj, repeatInterval){
    var readings = [];
    /*if we are readings for day or less, get last 24 hours readings
    get reading based on `repeatInterval`*/
    var start = moment().subtract(repeatInterval <= 86400 ? 86400 : repeatInterval, 'seconds').startOf('day');
    logger.warn('Setting start from 07:01 to 00:00 (min), to track readings without time component like steps');
    var end = moment();
    logger.debug('Reading From : ' + start.toString() + ' To : ' + end.toString());
    _.forEach(readingObj, function(n, key){
        var currDate = moment(key, 'D MMM YYYY HH:mm:ss');
        if(currDate.isSame(start) || currDate.isBetween(start, end, 'seconds')){
            logger.debug('Selected : ' + currDate.toString() + ' reading ' + n);
            readings.push({date: currDate.unix(), value: n});
        }
    });

    return readings;
};
/**
*function to remove fractional part if contain zero.
*@param orginalValue value could be integer or float
*@return integer value if fractional part contains zero else original value
*/
exports.removeFractionalZero = function(orginalValue){
    if(!orginalValue) return false;
    if(isNaN(orginalValue)) return false;
    var ValueInt = parseInt(orginalValue);
    return (orginalValue - ValueInt) != 0 ? orginalValue : ValueInt;
};
