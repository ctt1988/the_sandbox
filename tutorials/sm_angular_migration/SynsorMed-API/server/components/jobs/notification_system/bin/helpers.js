'use strict';

var moment = require('moment');
var _ = require('lodash');
var logger = require('logger');
var units = require('../../../../api/service/drivers/base/units');

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
    var start = moment().subtract(repeatInterval <= 86400 ? 86400 : repeatInterval, 'seconds');
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

exports.getReadingsForKey = function(data, key){
    key = units.getDateFromString(key);
    var response = false;
    _.forEach(data, function(value, date){
        var currDate = units.getDateFromString(date);
        if(key == currDate){
            response = value;
            return false;
        }
    });
    return response;
};

exports.getRandomRecord = function(data){
    if(_.isEmpty(data)) return false;
    return data[Math.floor((Math.random() * data.length))];
};
