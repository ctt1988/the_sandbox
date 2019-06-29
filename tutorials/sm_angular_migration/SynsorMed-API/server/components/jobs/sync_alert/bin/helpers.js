'use strict';

var _ = require('lodash');
var moment = require('moment');
var logger = require('logger');

exports.getRangeReadings = function(readingObj){
    var readings = [];
    var start = moment().subtract(86400, 'seconds');
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
