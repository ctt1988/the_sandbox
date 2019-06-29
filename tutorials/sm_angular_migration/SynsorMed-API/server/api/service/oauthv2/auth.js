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
exports.beginOauth = function(serviceId, callbackUrl, callback, sessionTokenId){

    var driver = getDriver(serviceId);

    if(driver !== false){

      callbackUrl = driver.run(callbackUrl, sessionTokenId);

      callback(callbackUrl);

    } else {
      return false;
    }

};

/**
 * get profile from a service
 *
 *  oauthData.modelInstance : used to updated the Oauth Info chnage like access token,
 *  new changes will be updated to this modelInstance
 *
 * oauthData.days : Days for which records will be parsed
 *
 */
exports.getUserProfile = function(serviceId, oauthData, callbackUrl, measurementName){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .profile(oauthData, callbackUrl, measurementName)
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
exports.getAccessToken = function(serviceId, code, callbackUrl, state){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .getAccessToken(code, callbackUrl, state)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject('Driver not found');
    }

    return deferred.promise;

};


//check if oauth data is expired or not
exports.expireCheck = function(serviceId, oauthData, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .expireCheck(oauthData, callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject('Driver not found');
    }

    return deferred.promise;

};



module.exports = exports;
