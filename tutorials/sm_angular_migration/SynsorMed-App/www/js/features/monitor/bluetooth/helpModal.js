'use strict';

angular.module('synsormed.controllers.monitor.helpModal', [
    'synsormed.services.oauth',
    'synsormed.services.monitor',
    'synsormed.controllers.monitor.nonin',
    'synsormed.controllers.monitor.and',
    'synsormed.controllers.monitor.fdk',
    'synsormed.controllers.monitor.devices',
    'synsormed.controllers.monitor.synsortrack',
    'synsormed.controllers.monitor.eclipse'
])
.controller('helpModalController', [
    '$scope',
    '$window',
    '$modal',
    'helpReason',
    '$modalInstance',
    'synsormed.services.oauth.OauthService',
    'synsormed.services.healthkit.HealthkitService',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.monitor.MonitorMeasurementService',
    function($scope, $window, $modal, helpReason, $modalInstance, OauthService, HealthkitService, MonitorServicesService, MonitorMeasurementService){


        $scope.helpTitle = null;
        $scope.helpText = null;

        $scope.ok = function(){
            $modalInstance.close('reload');
        };

        switch(helpReason){
            case "connect":
                $scope.helpTitle = "Connectivity Issue";
                $scope.helpText = "There has been an issue connecting to your device. Please turn off or stop using your devices for 10 seconds and then click the button below to retry";
            break;
            default:
                $scope.helpTitle = "Synsormed Support";
                $scope.helpText = "Please call Synsormed Support";
        };


    }
]);
