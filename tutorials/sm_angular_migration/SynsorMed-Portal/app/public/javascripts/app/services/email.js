angular.module('synsormed.services.email', [])
    .service('synsormed.services.EmailService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {

            sendCodeEmail: function (to, id, type) {
                var deferred = $q.defer();

                var data = { 'email': to, 'id': id};
                var url = type == 'encounter' ? '/mailer/encounter' : '/mailer/monitor';

                $http.post(env.apiBaseUrl + url, data)
                .then(function (resp) {
                  deferred.resolve(resp.data);
                }).catch(deferred.reject);

                return deferred.promise;
            }
          };
        }]);
