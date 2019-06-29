'use strict';

angular.module('synsormed.services.monitor', [
    'LocalStorageModule'
])
    .service('synsormed.services.MonitorService', ['$http', '$q', 'env', function ($http, $q, env) {
        return {
            createMonitor: function (monitorData) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/rest/monitor', monitorData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            updateMonitor: function (monitorData) {
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/monitor/' + monitorData.id, monitorData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getMonitor: function (id) {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/monitor/' + id).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            deleteMonitor: function (id, user, permanentDelete) {
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/monitor/' + id,{
                    params:{
                        permanentDelete: permanentDelete,
                        user: user
                    }
                }).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            resetMonitor: function(id){
              var deferred = $q.defer();
              $http.put(env.apiBaseUrl + '/rest/monitor/' + id).then(function (resp) {
                deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            createAppointment: function(id, appointmentDates){
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/rest/monitor/' + id + '/appointment/offer', appointmentDates).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getAppointment: function(id){
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/monitor/' + id + '/appointment').then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            deleteAppointment: function(id){
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/monitor/' + id + '/appointment').then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getMonitorInsights: function(monitorId, monitorMeasurementId, days, firstDate, secondDate){
              var days = days ? days :'';
              var firstDate = firstDate ? firstDate :'';
              var secondDate = secondDate ? secondDate :'';
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/measurements/' + monitorMeasurementId + '/insights',{
                  params:{
                      days:days,
                      firstDate: firstDate,
                      secondDate: secondDate
                  }
              }).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            unlinkOauthMonitorMeasurement: function(monitorId, monitorMeasurementId){
                var monitorMeasurement = monitorMeasurementId ? monitorMeasurementId :'';
              var deferred = $q.defer();
              $http.delete(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/unlink/' + monitorMeasurement).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            unlinkOauthToken: function(monitorId, oauthId){
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/token/' + oauthId).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        };
    }])
    .service('synsormed.services.MonitorListService', [
        '$http',
        '$q',
        'env',
        function($http, $q, env){
        var selectedUserId = 0;

        return {
            fetchMonitorList: function (providerId, paranoid, profileType, currentPage, pageSize, color, searchFor) {
                return $http.get(env.apiBaseUrl + 'rest/provider/' + providerId + '/monitor', {
                    params:{
                        currentPage:currentPage,
                        pageSize:pageSize,
                        paranoid:paranoid,
                        profileType: profileType,
                        filterColor: color,
                        searchFor: searchFor
                    }
                })
                .then(function (resp) {
                    return resp.data;
                });
            },
            fetchMonitorCount: function(providerId, paranoid, profileType, getCount, color, searchFor){
              return $http.get(env.apiBaseUrl + 'rest/provider/' + providerId + '/monitor', {
                  params:{
                      getCount: getCount,
                      paranoid:paranoid,
                      profileType: profileType,
                      filterColor: color,
                      searchFor: searchFor
                  }
              })
              .then(function (resp) {
                  return resp.data;
              });
            },
            getLastViewedUser: function(){
                return selectedUserId > 0 ? selectedUserId : false;
            },

            setLastViewedUser: function(id){
              selectedUserId = parseInt(id);
            }
        };

    }])
    .service('synsormed.services.MonitorServicesService', [
      '$http',
      '$q',
      'env',
      function($http, $q, env){
        return {
            getServicesForMonitor: function(id, measurementId){
                var deferred = $q.defer();

                $http.get(env.apiBaseUrl + '/rest/monitor/' + id + '/services?measurementId=' + measurementId, {timeout: 5000})
                .then(function (resp) {
                    deferred.resolve(resp.data);
                })
                .catch(deferred.reject);

                return deferred.promise;
            },
            getConnectedService: function(monitorId){
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/services/connected', {timeout: 10000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        };
    }])
    .service('synsormed.services.MonitorMeasurementService', [
      '$http',
      '$q',
      'env',
      function($http, $q, env){
        return {
            setOauthDataForMeasurement: function(monitorId, measurementId, data, oauthUpdateOnly){
                oauthUpdateOnly = oauthUpdateOnly || true;
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/measurements/' + measurementId + '?oauthUpdateOnly=' + oauthUpdateOnly, data, {timeout: 15000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            updateMonitorMeasurements: function(monitorId, measurements){
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/measurements/' , measurements, {timeout: 10000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getMonitorMeasurements: function(monitorId){
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/measurements/' , {timeout: 10000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            deleteMonitorMeasurements: function(monitorId, montiorMeasurementId){
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/monitor/' + monitorId + '/measurements/' + montiorMeasurementId , {timeout: 10000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        };
    }]);
