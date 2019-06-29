'use strict';

var servicelist = require('../../../components/servicemap/servicelist');
var Q = require('q');
var _ = require('lodash');
var logger = require('logger');

//get required driver to run the service
var getDriver = function(serviceId){
    if(!servicelist.isServiceAvailable(serviceId)){ return false; }
    return require('../drivers/' + serviceId + '/index');
};


//start oauth process
exports.beginOauth = function(serviceId, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .run(callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject('Driver not found');
    }

    return deferred.promise;

};

//get profile from a service
exports.getUserProfile = function(serviceId, oauthData){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .profile(oauthData)
        .then(function(results){
            //update lastSync field in oauth monitor token
            oauthData.oauthModelInstance.setLastSyncDate(results.lastSyncTime)
            .then(function(data){
                results.lastSyncTime = data ? data.last_sync : (oauthData.oauthModelInstance.last_sync || false);
                deferred.resolve(results);
                logger.debug('Updated last sync time for monitor token id '+oauthData.oauthModelInstance.id);
            })
            .catch(function(e){
                deferred.reject(e);
                logger.debug('Error while updating last sync time for monitor token id ' +oauthData.oauthModelInstance.id);
            });
        })
        .catch(deferred.reject);

    } else {
      deferred.reject('Driver not found');
    }

    return deferred.promise;

};


//get access token
exports.getAccessToken = function(serviceId, token, verifier, secret){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .getAccessToken(token, verifier, secret)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject('Driver not found');
    }

    return deferred.promise;

};


module.exports = exports;
