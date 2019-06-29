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

var filterOxySaturation = function(data, fetchDays, allowPrecisionValue){
    if(data === undefined) return false;
    var response = {};
    var days = [];
    _.forEach(data, function(val){
        var dayKey = units.getFormattedDate(val['endDate']);
        var tmpKey = units.getFormattedDateTime(val['endDate']);
        if(days.indexOf(dayKey)==-1) days.push(dayKey);
        if(days.length > fetchDays) return;
        val['quantity'] = allowPrecisionValue ? parseFloat(parseFloat(val['quantity']).toFixed(2)) : parseInt(val['quantity']);
        console.log(tmpKey, val['quantity']);
        response[tmpKey]= val['quantity'];
    });
    return response;
};

exports.formatData = function(latestReadings, oldData){
    var deferred = Q.defer();
    var newData = oldData ? (typeof oldData == 'string' ? JSON.parse(oldData) : oldData) : {};
    latestReadings = latestReadings || {};
    if(latestReadings.spo2){
        newData.spo2 = newData.spo2
        ? newData.spo2.concat(latestReadings.spo2)
        : latestReadings.spo2;
        newData.spo2 = _.uniqBy((newData.spo2 || []), 'endDate') ; //unique time
    }
    deferred.resolve(newData);
    return deferred.promise;
};

exports.profile = function(oauthData){
    var deferred = Q.defer();
    var lastSyncTime = getLastSyncDate(oauthData);
    var response = {};
    var fetchDays = oauthData.days ? oauthData.days : 3;
    if(!_.isEmpty(oauthData.spo2)){
        oauthData.spo2 = oauthData.spo2.reverse();
        response['oxygen saturation'] = filterOxySaturation(oauthData.spo2, fetchDays);
    }
    var results = masterAdapter.buildAdapter(response, 'Oxygen Saturation', 'Oxygen data for last 30 days.', lastSyncTime);
    deferred.resolve(results);
    return deferred.promise;
};

module.exports = exports;
