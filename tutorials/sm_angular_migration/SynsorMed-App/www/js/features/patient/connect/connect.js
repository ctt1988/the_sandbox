"use strict";
angular.module('synsormed.controllers.patient.connect', [
    'synsormed.services.user',
    'synsormed.services.oauth',
    'synsormed.services.bluetooth',
    'synsormed.services.parser'
])
.controller('patientConnectController', [
    '$q',
    '$scope',
    '$location',
    'synsormed.services.user.UserService',
    'synsormed.services.oauth.OauthService',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.oauth.OauthDataManagementService',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    'synsormed.services.parser.ParserStorageService',
    function($q, $scope, $location, UserService, OauthService, BluetoothService, OauthDataManagementService, MonitorServicesService, BluetoothStorageService, ParserStorageService){
        $scope.encounter = false;
        $scope.user = UserService.getUser();
        $scope.serviceMetaInfo = {};
        $scope.unsubscribeServiceInfo = {};

        $scope.openApp = function(appInfo, serviceName){
            var platform = window.device.platform.toLowerCase();
            var appName = (appInfo ? appInfo[window.device.platform.toLowerCase()].name : false ) || false;
            var param = (platform == 'android') ? { "application": appName } : appName;
            var sApp = startApp.set(param);

            var appOpened = function(){
                console.log('App is opened');
            };

            var appNotFound = function(reason){
                $scope.$emit("notification:error", serviceName + " app not found");
                console.log(reason);
            };

            sApp.start(appOpened, appNotFound);
        };

        $scope.unLink = function(service){
            $scope.$emit('wait:start');
            if($scope.user.isMonitor){
                if(service.service_name.toLowerCase() == 'c5' && (!_.isEmpty($scope.unsubscribeServiceInfo[service.service_name.toLowerCase()]))){
                    var unsubscribeServiceData = $scope.unsubscribeServiceInfo[service.service_name.toLowerCase()];
                    var subscribedC5Devices = BluetoothStorageService.getSubscribedDevices();
                    _.forEach(subscribedC5Devices, function(deviceAddress){
                            ParserStorageService.setDevicesToUnlink(deviceAddress); // set in local storage to unlink
                            BluetoothStorageService.popSubscribedDevices(deviceAddress);
                    });
                }

                MonitorServicesService.unlinkOauthToken($scope.user.id, service.id)
                .then(function(){
                    OauthService.removeService(service.service_name)
                    $scope.refreshList();
                    $scope.$emit('wait:stop');
                })
                .catch(function(err){
                    console.log('unlink error');
                    console.log(JSON.stringify(err));
                    $scope.$emit('notification:error', 'Device Unlinking Failed');
                    $scope.$emit('wait:stop');
                });


            }
            else {
                OauthService.unlinkEncounter($scope.user.id)
                .then(function(){
                    OauthService.clearStoredService();
                    $scope.$emit('notification:success', 'Device Unlink Successful');
                    $scope.$emit('wait:stop');
                    $scope.connectedService = false;
                })
                .catch(function(err){
                    $scope.$emit('notification:error', 'Device Unlinking Failed');
                    $scope.$emit('wait:stop');
                });
            }
        };

        $scope.refreshList = function(){
            MonitorServicesService
            .getConnectedService($scope.user.id)
            .then(function(data){
                $scope.$emit("wait:stop");
                $scope.connectedService = data;
            })
            .catch(function(){
                $scope.connectedService = false;
            });
        };

        $scope.unLinkEncounter = function(){
            $scope.$emit('wait:start');
            OauthService
            .unlinkEncounter($scope.user.id)
            .then(function(data){
                OauthService.clearStoredService();
                $scope.$emit('notification:success', 'Device Unlink Successful');
                $scope.$emit('wait:stop');
                $location.path('/logout');
            })
            .catch(function(err){
                console.error(err);
                $scope.$emit('notification:error', 'Device Unlinking Failed');
                $scope.$emit('wait:stop');
            })
        };

        var getServiceNames = function(services){
            var names = [];
            _.forEach(services, function(service){
                names.push(service.service_name);
            });
            return names;
        };

        if($scope.user.isMonitor){
            $scope.$emit("wait:start");
            $scope.encounter = false;
            MonitorServicesService
            .getConnectedService($scope.user.id)
            .then(function(data){
                $scope.connectedService = data;
                var services = getServiceNames(data);
                return MonitorServicesService.getServicesInfo($scope.user.id, services);
            })
            .then(function(servicesInfo){
                _.forEach(servicesInfo, function(serviceInfo){
                     var serviceAppInfo = (serviceInfo.meta_data ? serviceInfo.meta_data.appInfo : false) || false;
                     $scope.serviceMetaInfo[serviceInfo.name] = serviceAppInfo;
                     if(serviceInfo.name == 'c5'){
                         var info = (serviceInfo.meta_data ? serviceInfo.meta_data.services : false) || false;
                         $scope.unsubscribeServiceInfo[serviceInfo.name.toLowerCase()] = info;
                     }
                });
                $scope.$emit("wait:stop");
            })
            .catch(function(){
                $scope.connectedService = false;
                $scope.$emit("wait:stop");
            });
        }
        else {
            $scope.encounter = true;
        }
}]);
