'use strict';

angular.module('synsormed.services.notify', [
])
.service('synsormed.services.NotifyService', [
    '$q',
    'env',
    '$http',
    function($q, env, $http){
        return {
            sendPushNotificationToMonitor: function(monitorId, message){
                var params = {
                    monitorId: monitorId,
                    message: message
                };
                return $http.post(env.apiBaseUrl + 'rest/notification/monitor', params, {timeout: 30000})
                .then(function (resp) {
                    return resp.data;
                });
            },
            sendPushNotificationToEncounter: function(encounterId, message){
                var params = {
                    encounterId: encounterId,
                    message: message
                };
                return $http.post(env.apiBaseUrl + 'rest/notification/encounter', params, {timeout: 30000})
                .then(function (resp) {
                    return resp.data;
                });
            }
        };
    }
]);
