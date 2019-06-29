angular.module('synsormed.components.network', [])
    .service('synsormed.components.network.NetworkConnectionService', [
        'localStorageService',
        function (localStorageService) {
        return {
            isHighBandwidth: function () {
                var status;
                if(!window.Connection) { Connection = {}; } //Stub for development
                if(localStorageService.get('network_status') !== undefined && localStorageService.get('network_status') !== null) {
                    return JSON.parse(localStorageService.get('network_status'));
                } else {
                    status = navigator.connection.type;
                }
                return status === Connection.WIFI || status === Connection.ETHERNET;
            }
        };
    }]);
