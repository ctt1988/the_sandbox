'use strict';

var Q = require('q');
var _ = require('lodash');
var servicelist = require('../../components/servicemap/servicelist');

exports.getAuthDriver = function(version){
      if(version === 1){
        return require('./oauthv1/auth');
      }
      else if(version === 2){
        return require('./oauthv2/auth');
      }
      else if(version === 0){
        return require('./raw/auth');
      }
      else if(version === 3){
          return require('./oauthv3/auth');
      }
};

exports.getUserDetails = function(serviceId, oauthData, measurementName){
  var deferred = Q.defer();
  var service = servicelist.getService(serviceId);

  if(_.isEmpty(service)){
    deferred.reject('Service not found');
    return deferred.promise;
  }

  var AuthDriver = exports.getAuthDriver(service.version);
  var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

  switch (service.version) {
    case 1:
      AuthDriver.getUserProfile(serviceId, oauthData)
      .then(deferred.resolve)
      .catch(deferred.reject);
      break;
    case 2:
      AuthDriver.getUserProfile(serviceId, oauthData, callbackUrl, measurementName)
      .then(deferred.resolve)
      .catch(deferred.reject);
      break;
    case 3:
    case 0:
      AuthDriver.getUserProfile(serviceId, oauthData)
      .then(deferred.resolve)
      .catch(deferred.reject);
      break;
  }

  return deferred.promise;

};

exports.formatData = function(serviceId, oauthData, oldData){
    var deferred = Q.defer();
    var service = servicelist.getService(serviceId);

    if(_.isEmpty(service)) deferred.reject('Service not found');

    var AuthDriver = exports.getAuthDriver(service.version);

    switch (service.version) {
      case 0:
        AuthDriver.formatData(serviceId, oauthData, oldData)
        .then(deferred.resolve)
        .catch(deferred.reject);
        break;
      default:
         deferred.resolve(oauthData);
    }
    return deferred.promise;
};
