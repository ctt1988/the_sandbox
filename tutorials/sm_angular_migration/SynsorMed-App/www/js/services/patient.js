angular.module('synsormed.services.patient', [
    'synsormed.services.error',
    'synsormed.env'
])
.service('synsormed.services.patient.PatientService', [
    'localStorageService',
    '$http',
    '$q',
    'synsormed.services.error.http',
    'synsormed.env.urlBase',
    function (localStorageService, $http, $q, HttpError, urlBase) {
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }
        return {
            getProviderStatus: function (providerId) {
                var deferred = $q.defer();
                $http.get(urlBase.env + '/v1/rest/status/provider/' + providerId, {}, {timeout: 5000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(function (err) {
                    deferred.reject(new HttpError({
                        code: err.status,
                        message: err.data
                    }));
                });
                return deferred.promise;
            }
        };
    }
]);
