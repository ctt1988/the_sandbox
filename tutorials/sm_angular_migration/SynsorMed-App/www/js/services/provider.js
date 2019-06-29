angular.module('synsormed.services.provider', [
    'synsormed.services.error',
    'synsormed.env'
])
    .service('synsormed.services.provider.ProviderService', [
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
                listWaitingPatients: function (providerId) {

                    // Set StartDate to today's date 12am
                    var startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);

                    var deferred = $q.defer();
                    $http.get(urlBase.env + '/v1/rest/provider/' + providerId + '/worklist', {
                        params: {
                            date: startDate.toISOString(),
                            waiting: true
                        }
                    }, {timeout: 5000}).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },
                getWorkList: function (providerId) {
                    var deferred = $q.defer();
                    var startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    $http.get(urlBase.env + '/v1/rest/provider/' + providerId + '/worklist', {
                        params: {
                            date: startDate.toISOString()
                        }
                    }, {timeout: 5000}).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },
                getCallToken: function (providerId) {
                    return $http.get(urlBase.env + '/v1/rest/provider/' + providerId + '/token',{ timeout: 5000 }).then(function (resp) {
                        return resp.data;
                    });
                },
                dropToken: function (providerId) {
                    return $http.delete(urlBase.env + '/v1/rest/provider/' + providerId + '/token').then(function (resp) {
                        return resp.data;
                    });
                }
            };
        }
    ])
