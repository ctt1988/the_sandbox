'use strict';

var Q = require('q');
var _ = require('lodash');
var filterStatusData = require('./filterStatusData');
var filterStepsData = require('./filterStepsData');
var masterAdapter = require('../base/master-adapter');

// function to format data before upload
exports.formatData = function(data, oldData){
    var deferred = Q.defer();
    var newData = oldData ? (typeof oldData == 'string' ? JSON.parse(oldData) : oldData) : {};
    if(!data && !data.length) deferred.resolve(oldData);

    if(!_.isEmpty(data.status)){
        newData.status = newData.status ? newData.status : [];
        var statusData = newData.status.concat(data.status);
        newData.status = statusData;
    }

    if(!_.isEmpty(data.steps)){
        newData.steps = newData.steps ? newData.steps : [];
        var stepsData = newData.steps.concat(data.steps);
        newData.steps = stepsData;
    }

    deferred.resolve(newData);
    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData){
    var fetchDays = oauthData.days ? oauthData.days : 3;
    var lastSyncTime = false;
    var response = {};
    var status = [];
    var steps = [];

    if(!_.isEmpty(oauthData.status)) status.push(filterStatusData(oauthData.status, fetchDays, oauthData.firstDate, oauthData.secondDate));
    if(!_.isEmpty(oauthData.steps)) steps.push(filterStepsData(oauthData.steps, fetchDays));
    return Q.all(status)
    .then(function(output){
        response['status'] = output[0];
        response['steps'] = steps[0];
        return masterAdapter.buildAdapter(response, 'Survey', 'Survey data for last 30 days.', lastSyncTime);
    });
};

module.exports = exports;
