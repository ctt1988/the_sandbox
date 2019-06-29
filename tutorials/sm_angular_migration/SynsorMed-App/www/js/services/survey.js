angular.module('synsormed.services.survey', [
    'LocalStorageModule',
    'synsormed.services.user'
])
.service('synsormed.services.survey.SurveyService', [
    'localStorageService',
    '$http',
    '$q',
    'synsormed.services.user.UserService',
    'synsormed.env.urlBase',
    'synsormed.services.error.http',
    function (localStorageService, $http, $q, UserService, urlBase, HttpError) {
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }
        return {
            saveSurveyAnswers: function (encounterId, answers) {
                var deferred = $q.defer();
                $http.post(urlBase.env + '/v1/rest/encounter/' + encounterId + '/answers', answers).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(function (err) {
                    deferred.reject(new HttpError({
                        code: err.status,
                        message: err.data
                    }));
                });
                return deferred.promise;
            },
            getMeasurementSurveyQuestions: function(monitorId, measurementId){
                return $http.get(urlBase.env + '/v1/rest/monitor/'+monitorId+'/measurements/'+measurementId+'/survey/questions', {timeout: 5000})
                .then(function(resp) {
                    return resp.data;
                })
                .catch(function(err){
                    return (new HttpError({
                        code: err.status,
                        message: err.data
                    }));
                });
            },
            saveMeasurementSurveyAnswers: function(monitorId, measurementId, answers){
                return $http.post(urlBase.env + '/v1/rest/monitor/'+monitorId+'/measurements/'+measurementId+'/survey/answers', {answers: answers})
                .then(function(resp) {
                    return resp.data;
                })
                .catch(function(err){
                    return (new HttpError({
                        code: err.status,
                        message: err.data
                    }));
                });
            }
        }
    }
]);
