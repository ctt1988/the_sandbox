angular.module('synsormed.services.report', [])
.service('synsormed.services.ReportService', ['$http', '$q', 'env', '$window', function ($http, $q, env, $window) {
    return {
        getComplianceReport : function(){
            var deferred = $q.defer();
            $http.get(env.apiBaseUrl + 'rest/report/compliance/',{cache:false}).then(function (resp) {
                deferred.resolve(resp.data);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        searchUser : function(keyword){
            var deferred = $q.defer();
            $http.get(env.apiBaseUrl + 'rest/report/summary/search?keyword='+keyword, {cache:false}).then(function (resp) {
                deferred.resolve(resp.data);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        getSummaryReport : function(monitorId){
            var deferred = $q.defer();
            $http.get(env.apiBaseUrl + 'rest/report/summary?monitorId='+monitorId, {cache:false}).then(function (resp) {
                deferred.resolve(resp.data);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        getPdfToken: function(monitorId){
            var deferred = $q.defer();
            $http.get(env.apiBaseUrl + 'file/pdf/token?monitorId='+monitorId, {cache:false}).then(function (resp) {
                deferred.resolve(resp.data);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        downLoadPdf: function(token, monitorId){
            $window.open(env.apiBaseUrl + 'file/pdf/'+token + '/' +monitorId);
        }
    }
}]);
