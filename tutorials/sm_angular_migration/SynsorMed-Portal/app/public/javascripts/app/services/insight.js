angular.module('synsormed.services.insight', [])
    .service('synsormed.services.InsightService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            countEncounters: function (providerId,days) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + 'rest/encounter/count',{ providerId : providerId , days : days }).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getProviderInsights : function(providerId){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/provider/'+ providerId).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getPracticeInsights : function(practiceId){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/practice/'+ practiceId,{cache:false}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getPracticeInsightSeries : function(practiceId,days){
              days = days || 7;
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/series/practice/'+ practiceId + '/' + days,{cache:false}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getPracticeCCMInsights : function(practiceId,days){
              days = days || 7;
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/practice/'+ practiceId + '/ccm/' + days,{cache:false}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getSurveyResponseInsights : function(practiceId){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/series/practice/'+ practiceId + '/survey',{cache:false}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getLeaderboardInsights: function(practiceId){
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + 'rest/insights/practice/'+ practiceId + '/leaderboard/',{cache:false}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        }
    }]);
