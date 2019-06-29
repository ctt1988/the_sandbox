'use strict';
angular.module('synsormed.services.service_provider', [])
.service('synsormed.services.service_provider.Synsormed', [
    'localStorageService',
    '$q',
    '$http',
    'synsormed.env.urlBase',
    function (localStorageService, $q, $http, urlBase) {
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }
        return {
            getMeasurements: function(code){
                var deferred = $q.defer();
                $http.get(urlBase.env + '/v1/rest/serviceProvider/synsormed?patientCode='+code, {timeout:10000})
                .then(function (resp) {
                    deferred.resolve(resp.data);
                })
                .catch(deferred.reject);
                return deferred.promise;
            },
            createEntry : function(monitorId, data, serviceName){
                var deferred = $q.defer();
                var packet = {
                    monitorId: monitorId, data: data, serviceName: serviceName
                };
                $http.post(urlBase.env + '/v1/rest/serviceProvider/synsormed', packet, {timeout:10000})
                .then(function (resp) {
                    deferred.resolve(resp.data);
                })
                .catch(deferred.reject);
                return deferred.promise;
            }
        };
    }
]);
