'use strict';
var units = require('../base/units');
var _ = require('lodash');
var logger = require('logger');

/** parse the results from fitbit API to a mobile consumable code **/

var keyIndex = {
    'sleep-timeInBed' : 'Sleep',
    'activities-steps' :'Steps',
    'user' : 'General Details',
    'body-weight' : 'Body Weight',
    'weight' : 'Weight',
    'foods-log-caloriesIn' : 'caloric intake'
};

//temp store for user data  and units
var userData = null;

module.exports.getLastSyncDate = function(results){
    var greatestSyncDate = 0;
    if(!results || !results.length) return false;

    if(results[4] && results[4].length){
        var devices = results[4];
        var gretestInRecord = units.getGreatestDate(devices, 'lastSyncTime');
            greatestSyncDate = (gretestInRecord > greatestSyncDate) ? gretestInRecord : greatestSyncDate;
    }
    else{
        _.forEach(results, function(result){
            var key = Object.keys(result)[0];
            switch (key) {
                case 'sleep-timeInBed':
                case 'activities-steps':
                  var gretestInRecord = units.getGreatestDate(result[key], 'dateTime', 'value');
                      greatestSyncDate = (gretestInRecord > greatestSyncDate) ? gretestInRecord : greatestSyncDate;
                break;
                case 'weight':
                  var gretestInRecordW = units.getGreatestDate(result[key], 'date', 'weight');
                      greatestSyncDate = (gretestInRecordW > greatestSyncDate) ? gretestInRecordW : greatestSyncDate;
                break;
                case 'foods-log-caloriesIn' :
                  var gretestInRecordFood = units.getGreatestDate(result[key], 'dateTime', 'value');
                      greatestSyncDate = (gretestInRecordFood > greatestSyncDate) ? gretestInRecordFood : greatestSyncDate;
                break;
            }
        });
    }
    return  greatestSyncDate ? greatestSyncDate : false;
};

module.exports.parse = function(results, days, timeStamps){
    var response = {};

    _.forEach(results, function(val){
        var key = Object.keys(val)[0];
        var tmp = null;

        switch(key){ //parse different type of data
            case 'user' :
                userData = val[key]; //store user details
            break;

            case 'sleep-timeInBed' :
                tmp = parseSleepData(val[key], 'value', days, timeStamps);
            break;

            case 'weight' :
                tmp = transformLog(val[key], 'weight', days, timeStamps, userData.timezone);
            break;

            case 'activities-steps' :
                tmp = transformActivity(val[key], days, timeStamps);
            break;

            case 'foods-log-caloriesIn' :
                tmp = parseCaloriesData(val[key], days, timeStamps);
            break;
        }

        //some valid data was parsed
        if(!_.isEmpty(tmp)){
            //get custom name from keyIndex
            var resp_key = keyIndex[key];
            //decide if we can use it
            resp_key = (typeof resp_key === 'undefined') ? key : resp_key;
            //get unit for data
            if((key === 'body-weight' || key === 'weight') && userData != null){
                resp_key = units.embedUnit(resp_key, 'weight', userData.weightUnit);
                //if standard for US are in use then convert metric data to US
                if(userData.weightUnit == 'en_US'){
                    tmp = _.mapValues(tmp, function(val){
                        return (Math.round(val * 220.462) / 100);
                    });
                    //if standard for UK are in use then convert metric data to UK
                }
                else if(userData.weightUnit == 'en_UK'){
                    tmp = _.mapValues(tmp, function(val){
                        return (Math.round(val * 15.7473) / 100);
                    });
                }

            }
            response[resp_key] = tmp;
        }
    });
    return response;
};

module.exports.parseAll = function(results, days){
    return exports.parse(results, days, true);
};

/** transform a series of activity to avg **/
var transformActivity = function(data, days){
     if(!data) return false;

     days = days || 3;
     data = (data.length > days) ? data.slice(data.length - days) : data;
     data.reverse();
     var response = {};
     data.forEach(function(val){
        var valueAtKey = parseInt(val['value']);
        if(!valueAtKey) return;
        var tmpKey = units.getFormattedDate(val['dateTime']);
        response[tmpKey] = val['value'];
     });
     return response;
};

var parseCaloriesData = function(data, days){
    return transformActivity(data, days);
};

/* Sleep data parser
**
* data        Object    Sleep data
* key         String    Duration in case of sleep
* days        Integer   Number of days
* timeStamps  Boolean   Timestamps
*/
var parseSleepData = function(data, key, days, timeStamps){
    if(!data) return false;

    var returns = {};
    var lastTime = {};
    days = days || 3;
    data = (data.length > days) ? data.slice(data.length - days) : data;
    data.reverse();
    logger.debug(':::::: Parsing Fitbit Data  ::::::::');
    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val['dateTime']);
        //milliseconds to hrs
        val[key] = parseFloat((val[key] / 60).toFixed(2));
        if(!val[key]) return;

        console.log(tmpKey, val[key]);
        if(!returns[tmpKey]){
            returns[tmpKey] = val[key];
            lastTime[tmpKey] = tmpKey;
        }
        else if(tmpKey  == lastTime[tmpKey]) {
            //adding same date data
            returns[tmpKey] += val[key];
            lastTime[tmpKey] = tmpKey;
        }
        else{
            returns[tmpKey] = val[key];
        }
    });
    return returns;
};

var momentTimezone = require('moment-timezone');

/** transform a series of activity to logs **/
var transformLog = function(data, key, days, timeStamps, timezone){
    if(!data) return false;

    days = days || 3;
    data = (data.length > days) ? data.slice(data.length - days) : data;
    data.reverse();
    var response = {};
    data.forEach(function(val){
        var tmpDate = timeStamps ? val['date'] + ' '+ val['time'] : val['date'];
        var tmpKey = momentTimezone.tz(tmpDate, timezone).format();
            tmpKey = units.getFormattedDateTime(tmpKey);
        response[tmpKey] = val[key];
    });
    return response;
};
