'use strict';
var Q = require('q');
var _ = require('lodash');
var units = require('../base/units');
var masterAdapter = require('../base/master-adapter');

var getLastSyncDate = function(oauthData){
    if(!oauthData) return false;
    return  (oauthData.oauthModelInstance && oauthData.oauthModelInstance.last_sync)
    ? oauthData.oauthModelInstance.last_sync : false ;
};

var filterWeight = function(data, fetchDays, allowPrecisionValue){
    console.log("*** The data iin filterWeight: " + JSON.stringify(data));
    if(data === undefined) return false;
    var response = {};
    var days = [];
    _.forEach(data, function(val){
        var dayKey = units.getFormattedDate(val['endDate']);
        var tmpKey = units.getFormattedDateTime(val['endDate']);
        if(days.indexOf(dayKey)==-1) days.push(dayKey);
        if(days.length > fetchDays) return;
        val['quantity'] = allowPrecisionValue ? parseFloat(parseFloat(val['quantity']).toFixed(2)) : parseInt(val['quantity']);
        response[tmpKey]= val['quantity'];
    });
    return response;
};

exports.formatData = function(latestReadings, oldData){
    var deferred = Q.defer();
    var newData = oldData ? (typeof oldData == 'string' ? JSON.parse(oldData) : oldData) : {};
    latestReadings = latestReadings || {};
    if(latestReadings.weight){
        newData.weight = newData.weight
        ? newData.weight.concat(latestReadings.weight)
        : latestReadings.weight;
        newData.weight = _.uniqBy((newData.weight || []), 'endDate') ; //unique time
    }
    deferred.resolve(newData);
    return deferred.promise;
};

exports.profile = function(oauthData){
    console.log("*** in the profile for AND and oauthData is: " + JSON.stringify(oauthData));
    var deferred = Q.defer();
    var lastSyncTime = getLastSyncDate(oauthData);
    var response = {};
    var fetchDays = oauthData.days ? oauthData.days : 3;
    if(!_.isEmpty(oauthData.weight)){
        oauthData.weight = oauthData.weight.reverse();
        response['weight'] = filterWeight(oauthData.weight, fetchDays);
    }
    var results = masterAdapter.buildAdapter(response, 'Weight', 'Weight data for last 30 days.', lastSyncTime);
    console.log("*** the results leaving the profile: " + JSON.stringify(results));
    deferred.resolve(results);
    return deferred.promise;
};

module.exports = exports;
