angular.module('synsormed.services.adminInsight', [])
    .service('synsormed.services.adminInsight.InsightService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            getGlobalInsights : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/admin/global',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getAdminUsers : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/admin/adminuser',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getOrgCreatorUsers : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/admin/OrgCreatoruser',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getAllOrganizations : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/practice',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getOrganizationStatistics : function(id){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/practice/' +id+ '/statistics',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getProviderStatistics : function(id){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/provider/' +id+ '/statistics',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            saveLicense : function(id, licenseCount){
              var deferred = $q.defer();
              $http.put(env.apiBaseUrl + 'rest/insights/admin/' +id,{
                      licenseCount:licenseCount
              },{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getOrganization: function(id){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/admin/' +id,{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            checkLicenseExpiration: function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/insights/admin/',{timeout:10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            }
        }
    }])
    .factory('synsormed.services.Socket', [
        '$q',
        '$injector',
        function($q, $injector){
          console.log('**********************in portal socket')
          var socket = io(window.Caireview.apiUrl);
          return {
            on: function (eventName, callback) {
              socket.on(eventName, callback);
            }
          };
        }]);
