angular.module('synsormed.services.practice', [
    'LocalStorageModule'
])
    .service('synsormed.services.PracticeService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            changeOrgStatus: function(orgid, active){
            var deferred = $q.defer();
            $http.put(env.apiBaseUrl + 'rest/practice/' + orgid + '/active',{'active':active}, {timeout: 10000}).then(function (resp) {
                deferred.resolve(resp.data);
            }).catch(deferred.reject);
              return deferred.promise;
            },
            getPractice: function (id) {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/practice/' + id).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            savePractice: function (practice) {
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/practice/' + practice.id, practice).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            registerPractice: function (registrationInformation) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/register', registrationInformation).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        }
    }])
