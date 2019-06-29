angular.module('synsormed.services.network_providers', [])
    .service('synsormed.services.NetworkProviderService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {

            getProviders: function (to, id, type) {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + 'rest/networks')
                .then(function (resp) {
                  deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
          };
        }]);
