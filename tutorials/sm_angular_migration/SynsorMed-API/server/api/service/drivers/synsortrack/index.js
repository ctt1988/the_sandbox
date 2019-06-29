'use strict';
var Q = require('q');
var _ = require('lodash');
var logger = require('logger');
var units = require('../base/units');
var masterAdapter = require('../base/master-adapter');
var glucose_key = 'Glucose (' + units.getUnit('blood glucose', 'en_US') + ')';

var getLastSyncDate = function(oauthData){
    if(!oauthData) return false;
    return  (oauthData.oauthModelInstance && oauthData.oauthModelInstance.last_sync)
    ? oauthData.oauthModelInstance.last_sync : false ;
};

exports.formatData = function(latestReadings, oldData){
    console.log('**********Latest reading***********', latestReadings);
    console.log('**********Old reading***********', oldData);
    var deferred = Q.defer();
    var newData = oldData ? (typeof oldData == 'string' ? JSON.parse(oldData) : oldData) : {};
    latestReadings = latestReadings || {};
    if(latestReadings.weight){
        newData.weight = newData.weight
        ? newData.weight.concat(latestReadings.weight)
        : latestReadings.weight;
        newData.weight = _.uniqBy((newData.weight || []), 'endDate');
    }
    if(latestReadings.spo2){
        newData.spo2 = newData.spo2
        ? newData.spo2.concat(latestReadings.spo2)
        : latestReadings.spo2;
        newData.spo2 = _.uniqBy((newData.spo2 || []), 'endDate') ; //unique time
    }
    if(latestReadings['blood pressure']){
        console.log('***********************IN LATEST BLOOD PRESSURE************************');
        newData['blood pressure'] = newData['blood pressure']
        ? newData['blood pressure'].concat(latestReadings['blood pressure'])
        : latestReadings['blood pressure'];
        newData['blood pressure'] = _.uniqBy((newData['blood pressure'] || []), 'endDate') ; //unique time
    }
    if(latestReadings['glucose']){
        newData['glucose'] = newData['glucose']
        ? newData['glucose'].concat(latestReadings['glucose'])
        : latestReadings['glucose'];
        newData['glucose'] = _.uniqBy((newData['glucose'] || []), 'endDate') ; //unique time
    }
    if(latestReadings['pulse']){
        newData['pulse'] = newData['pulse']
        ? newData['pulse'].concat(latestReadings['pulse'])
        : latestReadings['pulse'];
        newData['pulse'] = _.uniqBy((newData['pulse'] || []), 'endDate') ; //unique time
    }
    deferred.resolve(newData);
    return deferred.promise;
};

exports.profile = function(oauthData){
    var deferred = Q.defer();
    var lastSyncTime = getLastSyncDate(oauthData);
    var response = {};
    var fetchDays = oauthData.days ? oauthData.days : 3;
    if(!_.isEmpty(oauthData.weight)){
        oauthData.weight = oauthData.weight.reverse();
        response['Weight (lbs)'] = filterWeight(oauthData.weight, fetchDays, true);
    }
    if(!_.isEmpty(oauthData.spo2)){
        oauthData.spo2 = oauthData.spo2.reverse();
        response['oxygen saturation'] = filterOxySaturation(oauthData.spo2, fetchDays);
    }
    if(!_.isEmpty(oauthData['blood pressure'])){
        console.log('*****************In BP********************');
        response['Blood Pressure'] = parseBPData(oauthData['blood pressure'], fetchDays);
    }
    if(!_.isEmpty(oauthData['glucose'])){
        response[glucose_key] = parseGlucoseData(oauthData['glucose'], fetchDays);
    }
    if(!_.isEmpty(oauthData['pulse'])){
        response['Heart Rate (bpm)'] = filterPulse(oauthData['pulse'], fetchDays);
    }
    var results = masterAdapter.buildAdapter(response, 'Oxygen Saturation', 'Oxygen data for last 30 days.', lastSyncTime);
    deferred.resolve(results);
    return deferred.promise;
};

var filter = function(data, fetchDays, allowPrecisionValue, allowParse){
    console.log('********fetchDays********', fetchDays);
    if(data === undefined) return false;
    var response = {};
    var days = [];
    //Do not reverse the data because we want to get the most recent days of data
    //data.reverse();
    _.forEach(data, function(val){
        var dayKey = units.getFormattedDate(val['endDate']);
        var tmpKey = units.getFormattedDateTime(val['endDate']);
        console.log('********dayKey********', dayKey);
        console.log('********tmpKey********', tmpKey);
        if(days.indexOf(dayKey)==-1) days.push(dayKey);
        if(days.length > fetchDays) return;
        if(allowParse)
        val['quantity'] = allowPrecisionValue ? parseFloat(parseFloat(val['quantity']).toFixed(2)) : parseInt(val['quantity']);
        console.log(tmpKey, val['quantity']);
        response[tmpKey]= val['quantity'];
    });
    console.log('********response********', response);
    return response;
};

var filterWeight = function(data, fetchDays, allowPrecisionValue){
    logger.debug(':::::: Parsing Weight data :::::::');
    return filter(data, fetchDays, allowPrecisionValue);
};

var filterOxySaturation = function(data, fetchDays, allowPrecisionValue){
    logger.debug(':::::: Parsing Oxygen Saturation data :::::::');
    return filter(data, fetchDays, allowPrecisionValue, true);
};

var parseBPData = function(data, fetchDays, allowPrecisionValue){
    logger.debug(':::::: Parsing BP Data  ::::::::');
    return filter(data, fetchDays, allowPrecisionValue);
};

var parseGlucoseData = function(data, fetchDays, allowPrecisionValue){
    logger.debug(':::::: Parsing Glucose Data  ::::::::');
    return filter(data, fetchDays, allowPrecisionValue);
};
var filterPulse = function(data, fetchDays, allowPrecisionValue){
    logger.debug(':::::: Parsing Pulse Data  ::::::::');
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

module.exports = exports;
