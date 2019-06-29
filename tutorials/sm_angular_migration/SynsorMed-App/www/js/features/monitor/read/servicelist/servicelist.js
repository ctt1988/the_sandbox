'use strict';

angular.module('synsormed.controllers.monitor.serviceList', [
    'synsormed.services.oauth',
    'synsormed.services.monitor',
    'synsormed.controllers.monitor.nonin',
    'synsormed.controllers.monitor.and',
    'synsormed.controllers.monitor.fdk',
    'synsormed.controllers.monitor.devices',
    'synsormed.controllers.monitor.synsortrack',
    'synsormed.controllers.monitor.eclipse'
])
.controller('serviceListModalController', [
    '$scope',
    '$window',
    '$modal',
    'monitor',
    'measurementMap',
    '$modalInstance',
    'synsormed.services.oauth.OauthService',
    'synsormed.services.healthkit.HealthkitService',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.monitor.MonitorMeasurementService',
    function($scope, $window, $modal, monitor, measurementMap, $modalInstance, OauthService, HealthkitService, MonitorServicesService, MonitorMeasurementService){

        $scope.healthData = {
            data : null,
            service : null
        };

        $scope.ok = function(){
            $modalInstance.dismiss();
        };

        HealthkitService.checkAvailable()
        .then(function(data){
            $scope.healthkitAvailable = true;
        })
        .catch(function(err){
            $scope.healthkitAvailable = false;
        })

        $scope.checkAvailable = function(service){
            return (service && service.name.toLowerCase() == 'healthkit' && !$scope.healthkitAvailable) ? false : true;
        };

        MonitorServicesService
        .getServicesForMonitor(monitor.id, measurementMap.measurementId)
        .then(function(services){
            $scope.services = services;
            return MonitorServicesService.getConnectedService(monitor.id)
        })
        .then(function(serviceName){
            $scope.$emit("wait:stop");
            for(var i = 0; i < $scope.services.length; i++){
                for(var j = 0; j < serviceName.length; j++){
                    if($scope.services[i].name == serviceName[j].service_name){
                        $scope.services[i].connected = serviceName[j];
                    }
                }
            }
        })
        .catch(function(e){
            $scope.services = [];
            $scope.$emit("notification:error", "Unable to find any services");
            $scope.$emit("wait:stop");
        });


        var connectHealthkit = function(){
            HealthkitService.performAuth()
            .then(function(data){
                if(data === true){
                    $scope.$emit('wait:start');
                    HealthkitService.readData()
                    .then(function(data){
                        $scope.$emit("wait:stop");
                        $scope.healthData.data = data;
                        $scope.healthData.service = 'healthkit';
                        $modalInstance.close({'service_name': 'healthkit', 'oauth_data': data});
                        $scope.$emit('notification:success', 'Synsormed Connected');
                    })
                    .finally(function(){
                        $scope.$emit("wait:stop");
                        $scope.refreshList();
                    });
                }
                else {
                    $modalInstance.close(false);
                }

            })
            .catch(function(e){
                console.log(e);
                $scope.$emit('notification:error', 'Healthkit Connect Failed');
            });
        };

        var bluetoothServiceAuth = function(service){
            var serviceName = service.name.toLowerCase();
            console.log("*** at thispoint, the service is: " + JSON.stringify(service));

            var templateUrl = 'js/features/monitor/read/servicelist/devices/devices.html';
            var controller = 'bluetoothDeviceController';
            if(serviceName == 'nonin'){
                templateUrl = 'js/features/monitor/read/nonin/nonin.html'
                controller = 'bluetoothNoninDeviceController'
            }
            else if (serviceName == 'fdk'){
                templateUrl = 'js/features/monitor/read/fdk/fdk.html'
                controller = 'bluetoothFdkDeviceController'
            }
            else if (serviceName == 'and'){
                templateUrl = 'js/features/monitor/read/and/and.html'
                controller = 'bluetoothAndDeviceController'
            }
            else if (serviceName == 'synsortrack'){
                templateUrl = 'js/features/monitor/read/synsortrack/synsortrack.html'
                controller = 'bluetoothSynsorTrackDeviceController'
            }
            else if(serviceName == 'eclipse'){
                templateUrl = 'js/features/monitor/read/eclipse/eclipse.html'
                controller = 'bluetoothEclipseController'
            }

            var modalInstance = $modal.open({
                templateUrl: templateUrl,
                controller: controller,
                resolve: {
                    metaData: function(){
                        return service.metaData;
                    },
                    measurementName: function(){
                        return measurementMap.name;
                    }
                }
            });

            modalInstance.result
            .then(function(oauthData){
                $modalInstance.close({'service_name': serviceName, 'oauth_data': oauthData});
                $scope.$emit('notification:success', serviceName.charAt(0).toUpperCase() + serviceName.substr(1).toLowerCase() + ' Connected');
            })
            .catch(function(err){
                console.log(err);
                var sname = (!!serviceName) ? serviceName.charAt(0).toUpperCase() + serviceName.substr(1).toLowerCase() : '';
                $scope.$emit('notification:error', (service.display || sname) + ' Connect Failed');
            });
        };

        var connectService = function(service){
            var oauthData = OauthService.getStoredService();
            var selectedService = service;

            if(!_.isEmpty(oauthData)){
                if(!!oauthData.name && !!oauthData.data && oauthData.name == selectedService.name){
                    $scope.healthData.data = oauthData.data;
                    $scope.healthData.service = oauthData.name;
                    $scope.$emit('notification:success', 'Synsormed Connected');
                    return;
                }
            }

            if(selectedService.name === 'healthkit'){ //if service is healthkit
                return connectHealthkit();
            }
            // need plugin https://github.com/apache/cordova-plugin-inappbrowser.git to work
            var ref = $window.open(selectedService.apiUrl + '?monitorId=' + monitor.id +'&measurementMapId=' +measurementMap.id, '_blank', 'location=no,enableviewportscale=yes');
            var metaContent = "width=device-width, initial-scale=1.0, maximum-scale=1.0";
            var scriptMetaInsert = 'var meta = document.querySelector("meta[name=viewport]");' +
            'if(meta){' +
            'meta.parentNode.removeChild(meta);' +
            '}' +
            'meta = document.createElement("meta");' +
            'meta.setAttribute("name","viewport");' +
            'meta.setAttribute("content","' + metaContent + '");'

            ref.addEventListener('loadstop', function(event) {
                ref.executeScript({ code: scriptMetaInsert }, function(value){
                    if(OauthService.hasUrl(event.url, selectedService.callback)) {
                        $scope.$emit('notification:success', 'Synsormed Connect Success');
                        $modalInstance.close(true);
                        ref.close();
                        MonitorMeasurementService
                        .setOauthDataForMeasurement(monitor.id, measurementMap.id, {'service_name': service.name})
                        .then(function(data){
                            $scope.$emit("wait:stop");
                            $scope.$emit("notification", {
                                type: 'success',
                                message: "Synsormed Connected"
                            });
                            $modalInstance.close(true);
                        })
                        .finally(function(){
                            $scope.$emit("wait:stop");
                            $scope.refreshList();
                        });
                    }
                });
            });
        };

        $scope.startOauth = function(service){
            var serviceData = $scope.services[service];
            var serviceName = service.name.toLowerCase();
            var bluetoothServices = ['c5', 'eclipse', 'nonin', 'synsortrack', 'and', 'fdk'];
            $scope.isConnected = service.connected;

            if( (bluetoothServices.indexOf(serviceName) != -1) && service.version == '0'){
                 return bluetoothServiceAuth(service);
            }
            else if(service.name.toLowerCase() == 'synsormed' && service.version == '3'){
                $scope.$emit('wait:start');
                var serviceURL = service.apiUrl + '?monitorId=' + monitor.id +'&measurementMapId=' +measurementMap.id ;
                OauthService.localOauth(serviceURL)
                .then(function(){
                     $scope.$emit("wait:stop");
                     $modalInstance.close(true);
                     $scope.$emit('notification:success', 'Synsormed Connected');
                })
                .finally(function(err){
                    $scope.$emit("wait:stop");
                    $scope.refreshList();
                });
            }
            else{
                if(!$scope.isConnected){     //check if already connected
                    return connectService(service);
                }
                else {
                    $scope.$emit('wait:start');
                    MonitorMeasurementService
                    .setOauthDataForMeasurement(monitor.id, measurementMap.id, {'service_name': service.name})
                    .then(function(data){
                        $scope.$emit("wait:stop");
                        $scope.$emit("notification", {
                            type: 'success',
                            message: "Synsormed Connected"
                        });
                    })
                    .finally(function(){
                        $scope.$emit("wait:stop");
                        $modalInstance.close(true);
                        $scope.refreshList();
                    });
                }
            }
        };
    }
]);
