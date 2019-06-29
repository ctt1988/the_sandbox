angular.module('synsormed.services.worklist', [])
.service('synsormed.services.WorklistService', ['$http', 'env', function ($http, env) {
    return {
        fetchWorklist: function (providerId, date) {
            if(isNaN(date)) date = new Date();
            date.setHours(0, 0, 0, 0);
            return $http.get(env.apiBaseUrl + 'rest/provider/' + providerId + '/worklist?date=' + date.toISOString())
            .then(function (resp) {
                return resp.data;
            });
        },
        fetchOnlinePatients: function(providerId, date){
            if(isNaN(date)) date = new Date();
            date.setHours(0, 0, 0, 0);
            return $http.get(env.apiBaseUrl + 'rest/provider/' + providerId + '/worklist?date=' + date.toISOString() + '&waiting=' + true)
            .then(function (resp) {
                return resp.data;
            });
        },
        pingServer: function(){
            return $http.post(env.apiBaseUrl + 'log/web');
        },
        getQuickBloxDetails: function(providerId){
            return $http.get(env.apiBaseUrl + 'rest/provider/' + providerId + '/quickBloxDetails')
            .then(function (resp) {
                return resp.data;
            });
        },
        getEncounterQuickBoxDetails: function(encounterId){
            return $http.get(env.apiBaseUrl + 'rest/encounter/' + encounterId + '/quickBloxDetails')
            .then(function (resp) {
                return resp.data;
            });
        }
    };
}]);
