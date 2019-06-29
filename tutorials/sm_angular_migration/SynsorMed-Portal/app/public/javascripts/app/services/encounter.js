angular.module('synsormed.services.encounter', [
    'LocalStorageModule'
])
    .service('synsormed.services.EncounterService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            createEncounter: function (encounterData) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/rest/encounter', encounterData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            updateEncounter: function (encounterData) {
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/encounter/' + encounterData.id, encounterData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            getEncounter: function (id) {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/encounter/' + id).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            deleteEncounter: function (id) {
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/encounter/' + id).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            pingServer: function(code){
                return $http.post(env.apiBaseUrl + 'log/web/encounter' , {code: code}, {timeout: 5000});
            },

            getProviderStatus: function (providerId) {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + 'rest/status/provider/' + providerId, {}, {timeout: 5000})
                .then(function (resp) {
                    deferred.resolve(resp.data);
                })
                .catch(deferred.reject);
                return deferred.promise;
            },

            // save call duration for an encounter
            logEncounterCallDuration : function(id, seconds){
              var deferred = $q.defer();
              $http.put(env.apiBaseUrl + 'rest/encounter/' + id + '/call/duration', { duration : seconds })
              .then(function (resp) {
                  deferred.resolve(resp.data);
              })
              .catch(deferred.reject);
              return deferred.promise;
            },
        };
    }]);
