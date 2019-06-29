'use strict';

var Q = require('q');
var _ = require('lodash');
var logger = require('logger');
var units = require('../base/units');
var getData = require('./fetchData');
var masterAdapter = require('../base/master-adapter');
var glucoseKey = 'Glucose (' + units.getUnit('blood glucose', 'en_US') + ')';

exports.formatData = function(data){ // function to format data before upload
    var deferred = Q.defer();
       deferred.resolve(data);
    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData){
    var deferred = Q.defer();
    var fetchDays = oauthData.days ? oauthData.days : 3;
    var response = {};
    if(!oauthData.monitor_id) {
        var results = masterAdapter.buildAdapter(response, 'SynsorMed', 'SynsorMed service data for last 30 days.', false);
        deferred.resolve(results);
        return deferred.promise;
    }

    getData(oauthData.monitor_id, 'synsormed')
    .then(function(result){
        var data = result.data;
        var lastSyncDate = result.syncDate;
        logger.debug(':::::: Parsing SynsorMed Data  ::::::::');
        if(!_.isEmpty(data.steps)){
            response.Steps = filterSteps(data.steps, fetchDays);
        }
        if(!_.isEmpty(data.weight)){
            response['Weight (lbs)'] = filterWeight(data.weight, fetchDays);
        }
        if(!_.isEmpty(data.glucose)){
            response[glucoseKey] = filterGlucose(data.glucose, fetchDays);
        }
        if(!_.isEmpty(data['blood pressure'])){
            response['Blood Pressure'] = parseDateData(data['blood pressure'], fetchDays);
        }
        if(!_.isEmpty(data['temperature'])){
            response['temperature'] = parseTemperature(data['temperature'], fetchDays);
        }
        if(!_.isEmpty(data['caloric intake'])){
            response['caloric intake'] = parseCaloricIntake(data['caloric intake'], fetchDays);
        }
        if(!_.isEmpty(data['heartrate'])){
            response['Heart Rate (bpm)'] = parseHeartRate(data['heartrate'], fetchDays);
        }
        if(!_.isEmpty(data['peak flow rate'])){
            response ['Peak Flow Rate (L/min)'] = parsePeakFlow(data['peak flow rate'], fetchDays);
        }
        if(!_.isEmpty(data['oxygen saturation'])){
            response ['oxygen saturation'] = parseOxygenSaturation(data['oxygen saturation'], fetchDays);
        }
        var results = masterAdapter.buildAdapter(response, 'SynsorMed', 'SynsorMed service data for last 30 days.', lastSyncDate);
        deferred.resolve(results);
    })
    .catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
};

var filterSteps = function(data, fetchDays){
    if(!data) return false;
    var response = {};
    var days = [];
    logger.debug(':::::: Parsing Steps Data  ::::::::');
    data.reverse();
    data.forEach(function(val){
        if(days.length >= fetchDays) return;
        val['value'] = parseInt(val['value']);
        var tmpKey = units.getFormattedDate(new Date(val['endDate']));
        console.log(tmpKey, val['value']);
        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
        response[tmpKey] = response[tmpKey] ? response[tmpKey] + val['value'] : val['value'];
    });
    return response;
};

var filter =  function(data, fetchDays){
    if(!data) return false;
    var response = {};
    var days = [];
    data.reverse();
    data.forEach(function(val){
        if(days.length >= fetchDays) return;
        var tmpKey = units.getFormattedDateTime(new Date (val['endDate']));
        response[tmpKey] = val['value'];
        console.log(tmpKey, val['value']);
        var day = units.getFormattedDate(new Date (val['endDate']));
        if(days.indexOf(day) == -1) days.push(day);
    });
    return response;
};

var filterWeight = function(data, fetchDays){
    logger.debug(':::::: Parsing Weight Data  ::::::::');
     return filter(data, fetchDays);
};

var filterGlucose = function(data, fetchDays){
    logger.debug(':::::: Parsing Glucose Data  ::::::::');
     return filter(data, fetchDays);
};

var parseDateData = function(data, fetchDays){
    logger.debug(':::::: Parsing BP Data  ::::::::');
    return filter(data, fetchDays);
};

var parseTemperature = function(data, fetchDays){
    logger.debug(':::::: Parsing Temperature Data  ::::::::');
    return filter(data, fetchDays);
};

var parseCaloricIntake = function(data, fetchDays){
    logger.debug(':::::: Parsing Caloric Intake Data  ::::::::');
    return filter(data, fetchDays);
};

var parseHeartRate = function(data, fetchDays){
    logger.debug(':::::: Parsing Heart reate data ::::::');
    return filter(data, fetchDays);
};

var parsePeakFlow = function(data, fetchDays){
    logger.debug(':::::: Parsing Peak Flow data :::::::');
    return filter(data, fetchDays);
};

var parseOxygenSaturation = function(data, fetchDays){
    logger.debug(':::::: Parsing Oxygen Saturation data :::::::');
    return filter(data, fetchDays);
};

module.exports = exports;
