'use strict';

var units = require('../base/units');
var _ = require('lodash');
var logger = require('logger');
var moment = require('moment');

/** parse the results from fitbit API to a mobile consumable code **/

var keyIndex = {};
    keyIndex['sleep-minutesAsleep'] = 'Minutes asleep';
    keyIndex['activities-steps'] = 'Steps';
    keyIndex['user'] = 'General Details';
    keyIndex['body-weight'] = 'Body Weight';
    keyIndex['sleeps'] = 'Sleep';
    keyIndex['weight'] = 'Weight';
    keyIndex['sessions'] = 'Steps';
    keyIndex['summary'] = 'Steps';

//temp store for user data  and units
var userData = null;

module.exports.getLastSyncDate = function(results){
  var isDevice = Object.keys(results[2]).length || false;
  var gretestSynDate = 0;
  if(isDevice){
      gretestSynDate = moment.unix(results[2].lastSyncTime);
  }
  else{
     _.forEach(results, function(result){
          var key = Object.keys(result)[0];
          switch (key) {
              case 'sleeps':
                var gretestInRecord = units.getGreatestDate(result[key], 'startTime');
                    gretestSynDate = (gretestInRecord > gretestSynDate) ? gretestInRecord : gretestSynDate;
               break;
              case 'summary':
                var gretestInRecordStep = units.getGreatestDate(result[key], 'startTime', 'steps');
                    gretestSynDate = (gretestInRecordStep > gretestSynDate) ? gretestInRecordStep : gretestSynDate;
              break;
          }
      });
  }
  return gretestSynDate ? gretestSynDate : false;
};

module.exports.parse = function(results, days, timeStamps){
   var response = {};
   _.forEach(results, function(val){
        var key = Object.keys(val)[0], tmp;
        //parse different type of data
        switch(key){
            case 'user' :
                userData = val[key]; //store user details
            break;

            case 'sleeps' :
            tmp = parseSleepData(val[key], 'duration', days, timeStamps);
            break;

            case 'weight' : //currently not needed
            //tmp = transformLog(val[key], 'weight', days, timeStamps);
            break;

            case 'summary': //steps
            tmp = transformActivity(val['summary'], days, timeStamps);
            break;
        }

        //some valid data was parsed
        if(!_.isEmpty(tmp)){
            var resp_key = keyIndex[key];     //get custom name from keyIndex
                resp_key = (typeof resp_key === 'undefined') ? key : resp_key; //decide if we can use it

            //get unit for data
            if((key === 'body-weight' || key === 'weight') && userData != null){
                resp_key = units.embedUnit(resp_key, 'weight', userData.weightUnit);

                if(userData.weightUnit == 'en_US'){  //if standard for US are in use then convert metric data to US
                    tmp = _.mapValues(tmp, function(val){
                        return (Math.round(val * 220.462) / 100);
                    });
                }
                else if(userData.weightUnit == 'en_UK'){ //if standard for UK are in use then convert metric data to UK
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
    return exports.parse(results, days, false);
};


/** transform a series of activity to avg **/
var transformActivity = function(data, days, timeStamps){
    if(!data) return false;
    var returns = {}, lastTime = {};
    data = _.filter(data, function(val){ //remove all data which is null
        return val['steps'] != 0;
    });
    days = days || 3;
    data = (data.length > days) ? data.slice(data.length - days) : data;

    logger.debug(':::::: Parsing Misfit Data  ::::::::');
    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val.date);
        console.log(tmpKey, val['steps']);
        if(!returns[tmpKey]){
            returns[tmpKey] = val['steps'];
            lastTime[tmpKey] = tmpKey;
        }
        else if(tmpKey  == lastTime[tmpKey]) {
            //adding same date data
            returns[tmpKey] += val['steps'];
            lastTime[tmpKey] = tmpKey;
        }
        else{
            returns[tmpKey] = val['steps'];
        }
    });
    return returns;
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
    var returns = {}, lastTime = {};
    days = days || 3; // select only three latest dates
    data = (data.length > days) ? data.slice(data.length - days) : data;
    logger.debug(':::::: Parsing Misfit Data  ::::::::');

    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val.startTime);
        val[key] = parseFloat((val[key] / 3600).toFixed(2)); //seconds to hrs

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
