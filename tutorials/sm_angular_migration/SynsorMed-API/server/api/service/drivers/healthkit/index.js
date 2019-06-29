'use strict';

var masterAdapter = require('../base/master-adapter');
var _ = require('lodash');
var units = require('../base/units');
var Q = require('q');

var getLastSyncDate = function(oauthData){
     if(!oauthData) return false;
     return  (oauthData.oauthModelInstance && oauthData.oauthModelInstance.last_sync) ? oauthData.oauthModelInstance.last_sync : false ;
};

// function to format data before upload
exports.formatData = function(data, oldData){
    var deferred = Q.defer();
       deferred.resolve(data);
    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData){
    var deferred = Q.defer();
    var fetchDays = oauthData.days ? oauthData.days : 3;
    var lastSyncTime = getLastSyncDate(oauthData);
    var response = {};
    if(!_.isEmpty(oauthData.steps)){
        var data = filterSteps(oauthData.steps);
        var final = {};
        var days = 0;
        _.forEach(data, function(val, key){
              if(days >= fetchDays) return;
              final[key] = val;
              days++;
        });
        response.Steps = final;
    }
    // if(!_.isEmpty(oauthData.weight)){
    //   //prevent the Weight for now
    //   //returns["Weight (lb)"] = filterWeight(oauthData.weight, fetchDays);
    // }
    if(!_.isEmpty(oauthData.pulse)){
      response['Heart Rate (bpm)'] = filterHeartrate(oauthData.pulse, fetchDays);
    }

    if(!_.isEmpty(oauthData.temperature)){
        response['temperature'] = filterTemperature(oauthData.temperature, fetchDays);
    }

    if(!_.isEmpty(oauthData.breath)){
        response['breath (bpm)'] = filterBreath(oauthData.breath, fetchDays);
    }

    var results = masterAdapter.buildAdapter(response, 'Healthkit', 'Apple Healthkit data for last 30 days.', lastSyncTime);
    deferred.resolve(results);
    return deferred.promise;
};

// Common filter method for heartrate and breath
var filterData = function(data, fetchDays){
    if(data === undefined) return false;
    var returns = {};
    var days = [];
    data.forEach(function(val){
        if(days.length >= fetchDays) return;
        val['quantity'] = parseInt(val['quantity']);
        var tmpKey = units.getFormattedDate(val['endDate']);
        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
        returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
    });
    return returns;
};

//filter the steps data from Healthkit app
var filterSteps = function(data){
  if(data === undefined) return false;
  var returns = {};
  data.forEach(function(val){
      var tmpKey = units.getFormattedDate(val['endDate']);
      if(returns[tmpKey]){
        returns[tmpKey] = val['quantity'] + returns[tmpKey];
      } else {
        returns[tmpKey] = val['quantity'];
      }
  });
  return returns;
};

//filter the weight data from Healthkit app
var filterWeight = function(data, fetchDays){
  if(data === undefined) return false;
  var returns = {};
  var days = 0;
  data.forEach(function(val){
      if(days >= fetchDays) return;
      val['quantity'] = val['quantity'].toFixed(2);
      var tmpKey = units.getFormattedDate(val['endDate']);
      if(!returns[tmpKey]){
        returns[tmpKey] = val['quantity'];
        days++;
      } else if(val > returns[tmpKey]) {
        returns[tmpKey] = val['quantity'];
      }
  });
  return returns;
};

//filter the beats data from Healthkit app
var filterHeartrate = function(data, fetchDays){
    return filterData(data, fetchDays);
};

// filter temperature data from Healthkit app
var filterTemperature = function(data, fetchDays){
    if (!data) return false;
    var response = {};
    var days = [];
    data.forEach(function(val){
        if(days.length >= fetchDays) return;
        var temperature = parseFloat((val['quantity']).toFixed(2));
        var tmpKey = units.getFormattedDate(val['endDate']);
        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
        response[units.getFormattedDateTime(val['endDate'])] = temperature;
    });
    return response;
};

//filter breath data from healthkit app
var filterBreath = function(data, fetchDays){
    return filterData(data, fetchDays);
};

module.exports = exports;
