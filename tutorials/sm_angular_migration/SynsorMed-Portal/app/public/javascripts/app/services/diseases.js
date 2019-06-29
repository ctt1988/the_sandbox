angular.module('synsormed.services.diseases', [])
    .service('synsormed.services.diseases.DiseasesService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            getDiseases : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/diseases',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            }
        };
    }]);
