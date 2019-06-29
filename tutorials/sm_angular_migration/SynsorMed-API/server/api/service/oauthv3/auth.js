'use strict';
var Q = require('q');
var _ = require('lodash');
var logger = require('logger');
var servicelist = require('../../../components/servicemap/servicelist');

var getDriver = function(serviceId){ //get required driver to run the service
    if(!servicelist.isServiceAvailable(serviceId)){ return false; }
    return require('../drivers/' + serviceId + '/index');
};

exports.getUserProfile = function(serviceId, oauthData){ //get profile from a service
    var deferred = Q.defer();
    var driver = getDriver(serviceId);
    if(!_.isEmpty(driver)){
      driver
        .profile(oauthData)
        .then(function(results){
            if(oauthData && oauthData.oauthModelInstance && oauthData.oauthModelInstance.service_name == 'synsormed'){
                return oauthData.oauthModelInstance.setLastSyncDate(results.lastSyncTime)
                .then(function(data){
                    results.lastSyncTime = data ? data.last_sync : (oauthData.oauthModelInstance.last_sync || false);
                    deferred.resolve(results);
                    logger.debug('Updated last sync time for monitor token id '+oauthData.oauthModelInstance.id);
                })
                .catch(function(e){
                    deferred.reject(e);
                    logger.debug('Error while updating last sync time for monitor token id ' +oauthData.oauthModelInstance.id);
                });
            }
            return deferred.resolve(results);
        })
        .catch(deferred.reject);

    }
    else{
      deferred.reject('Driver not found');
    }
    return deferred.promise;
};

exports.formatData = function(serviceId, oauthData, oldData){
    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){
        driver
        .formatData(oauthData, oldData)
        .then(deferred.resolve)
        .catch(deferred.reject);
    }
    else {
        deferred.reject('Driver not found');
    }

    return deferred.promise;
};

module.exports = exports;
