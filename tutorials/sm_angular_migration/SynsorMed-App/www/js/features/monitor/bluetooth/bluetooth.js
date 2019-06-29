angular.module('synsormed.controllers.monitor.bluetooth', [
    'synsormed.services.user',
    'synsormed.services.monitor',
    'synsormed.services.bluetooth',
    'ui-rangeSlider'
])
.controller('MonitorBluetoothController', [
    '$q',
    '$scope',
    '$rootScope',
    '$route',
    '$location',
    '$modal',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.monitor.MonitorMeasurementService',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    'synsormed.services.user.UserService',
    function ($q, $scope, $rootScope, $route, $location, $modal, MonitorServicesService, MonitorMeasurementService, BluetoothService, BluetoothStorageService, UserService) {
        var user = UserService.getUser();
        console.log("**** user object: " + JSON.stringify(user));
        var modalInstance = false;
        var targetDevices =  null;
        var targetServices  = null;
        var allServiceInfo = null;
        var activeMeasurementId = null;
        var transmittedServices = [];
        var supportedGuideMeasurements = ["weight","oxygen saturation"];
        var deviceMeasurementMap = {
            pod : "oxygen saturation",
            nonin3230 : "oxygen saturation",
            and : "weight",
            fdk : "temperature"
        }
        // var weightMeasurementId;
        // var pulseOxMeasurementId;
        MonitorMeasurementService.getMeasurementsForMonitor(user.id)
        .then(function(measurements){
            
            $scope.measurements = measurements;
            _.forEach($scope.measurements,function(measurement){
                if(measurement.serviceName.toLowerCase().indexOf("survey") == -1){
                    measurement.status = 'Waiting';
                    if(measurement.name.toLowerCase() == 'weight' ){
                        weightMeasurementId = measurement.id;
                    }else if(measurement.name.toLowerCase() == 'oxygen saturation'){
                        pulseOxMeasurementId = measurement.id;
                    }
                }    
            });
            console.log("*** the measurements for this monitor are: " + JSON.stringify(measurements));
        })
        .catch(function(err){
            console.log("*** There was an error with getting getMeasurementsForMonitor: " + JSON.stringify(err));
        });


        var getTargetInfo = function(){
            var defer = $q.defer();

            var devicesToSearchFor = [];
            var servicesToSearchFor = [];
            //Get a list of all services for this monitor
            MonitorServicesService.getConnectedService(user.id)
            .then(function(services){
                console.log("*** result of getConnectedService: " + JSON.stringify(services));
                var serviceList = null;
                _.forEach(services,function(service){
                    //Before gathering info about the service, check that if it has already been transmitted
                    if(transmittedServices && transmittedServices.indexOf(service.service_name) == -1){
                        serviceList = serviceList ? serviceList + "," + service.service_name : service.service_name;
                    }     
                });
                console.log("*** the final list of services with comma are: " + serviceList);
                //Now get the meta data for all services associated with this monitor
                MonitorServicesService.getServicesInfo(user.id, serviceList)
                .then(function(services){
                    console.log("*** the services info is: " + JSON.stringify(services));
                    allServiceInfo = services;
                    //Now that I have the services meta data, I need to parse and put into an array
                    _.forEach(services,function(service){
                        _.forEach(service.meta_data.devices, function(device){
                            devicesToSearchFor.push(device);
                        });
                        _.forEach(service.meta_data.services, function(serviceInfo){
                            servicesToSearchFor.push(serviceInfo);
                        })
                    });
                    var finalTargetInfo = {};
                    finalTargetInfo.targetDevices = devicesToSearchFor;
                    finalTargetInfo.targetServices = servicesToSearchFor;

                    defer.resolve(finalTargetInfo);
                });
            })
            .catch(function(err){
                console.log("**** There was an error getConnectedService: "+ JSON.stringify(err));
                defer.reject(err);
            });

            return defer.promise;
        }

        var allDevicesSynced = function(){

            var allSynced = true;

            _.forEach($scope.measurements,function(measurement){
                console.log("*** the measurement in allDevicesSynced is: " + JSON.stringify(measurement));
                if(measurement.status && measurement.status.indexOf('Waiting') != -1){
                    allSynced = false;
                } 
            });

            return allSynced;
        }



        var transmitData = function(oauthData, serviceName, currentMeasurement){
            $scope.$emit('wait:start');
            console.log("**** I am about to send oauth data: " + JSON.stringify(oauthData));
            console.log("*** at this point, the serviceName is: " + serviceName);
            _.forEach($scope.measurements,function(measurement){
                if(measurement.name.toLowerCase().indexOf(currentMeasurement.toLowerCase()) !== -1){
                    activeMeasurementId = measurement.id;
                }
            });
            console.log("*** the activeMeasurementId: " + activeMeasurementId);
            MonitorMeasurementService.setOauthDataForMeasurement(user.id, activeMeasurementId, {
                'service_name': serviceName,
                'oauth_data': oauthData
            }, true);
            $scope.$emit("notification", {
                type: 'success',
                message: " Syncing Successfull"
            });
            $scope.$emit('wait:stop');
            //Add to transmittedServices array to keep track of which services have been taken care of
            transmittedServices.push(serviceName);
            _.forEach($scope.measurements,function(measurement){
                if(measurement.name.toLowerCase() == currentMeasurement.toLowerCase()){
                    measurement.status = "DONE";
                }
            })

            if(allDevicesSynced()){
                $rootScope.devicesComplete = true;
                $location.path('/monitor/guide');
            }else{
                //All devices have not been synced, so go back to searching
                $scope.getDevices();
            }
            
        }

        $scope.connectDevice = function(address, deviceName, currentMeasurement){
            $scope.waiting = true;
            //address = "wrongaddressfortesting";
            var params = {address: address, timeout: BluetoothService.timeout, useResolve: true, deviceName: deviceName};
            var activeServiceName;

            BluetoothService.connectDevice(params)
            .then(function(connection){
                if(connection.status != 'connected'){
                    $scope.waiting = false;
                    $scope.$emit('notification:error', 'Connecting to device failed.');
                    return false;
                }
                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage

                //for(var key in deviceMeasurementMap){
                    //if(deviceName.toLowerCase() == key){
                        _.forEach($scope.measurements, function(measurement){
                            if(measurement.name.toLowerCase() == currentMeasurement.toLowerCase()){
                                measurement.status = "Getting Data";
                            }
                        })
                    //}
                //}

                // _.forEach($scope.measurements,function(measurement){
                //     if(supportedGuideMeasurements.includes(measurement.name.toLowerCase())){
                //         measurement.status = "Connected";
                //     }
                // })

                //We only want to subscribe to the services that apply to the device that was connected
                _.forEach(allServiceInfo, function(currentService){
                    _.forEach(currentService.meta_data.devices, function(device){
                        if(deviceName.toLowerCase().indexOf(device.toLowerCase()) != -1){
                            targetServices = currentService.meta_data.services;
                        }
                    });
                });

                if(deviceName.toLowerCase().indexOf('pod') !== -1){
                    activeServiceName = 'synsortrack';
                    return BluetoothService.readSynsorTrackData(address, deviceName, targetServices, "oxygen saturation");
                }else if(deviceName.toLowerCase().indexOf('nonin3230') !== -1 ){
                    activeServiceName = 'nonin';
                    return BluetoothService.readNoninData(address, deviceName, targetServices);
                }else if(deviceName.toLowerCase().indexOf('fdk') !== -1 ){
                    activeServiceName = 'fdk';
                    return BluetoothService.readFdkData(address, deviceName, targetServices, "temperature");
                }else{
                    activeServiceName = 'and';
                    return BluetoothService.readAndData(address, deviceName, targetServices);
                }
                
            })
            .then(function(deviceData){
                $scope.waiting = false;
                var isError = false;
                var totalData = {};

                console.log('device data is here');
                console.log(JSON.stringify(deviceData));

                if(deviceData && deviceData.length){
                    _.forEach(deviceData, function(data){
                        if(data && data.state && data.state == 'fulfilled'){
                            var dataValues = data.value || {};
                            _.forEach(dataValues, function(val, ind){
                                totalData[ind] = totalData[ind] || [];
                                totalData[ind] = totalData[ind].concat(val);
                            });
                        }
                        else{
                            isError = isError || true;
                        }
                    });
                }

                console.log('And final data is');
                console.log(JSON.stringify(totalData));

                if(!isError){
                     //$scope.$emit('notification:success', 'Service data fetched');
                     transmitData(totalData,activeServiceName,currentMeasurement);
                }
                else{
                    $scope.$emit('notification:danger', 'Error while fetching data');
                }

            })
            .catch(function(err){
                //There was an issue connecting, so open a modal to help user
                console.log("*** Error connecting, so opening modal for help");
                modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/bluetooth/helpModal.html',
                    controller: 'helpModalController',
                    backdrop: 'static',
                    resolve: {
                        helpReason: function () {
                            return "connect";
                        }
                    }
                });

                modalInstance.result
                .then(function(command){
                    switch(command){
                        case "reload":
                            console.log("**** reloading blutooth screen");
                            $route.reload();
                        break;
                        default:
                            $location.path('/monitor/guide');
                    }
                });
            });
        };

        $scope.getDevices = function(){
            
            $scope.searching = true;
            getTargetInfo()
            .then(function(targetInfo){
                console.log("*** The total target info is: " + JSON.stringify(targetInfo));
                targetDevices = targetInfo.targetDevices;
                targetServices = targetInfo.targetServices;
                return BluetoothService.initialize({ request: true }) // plugin initialized
            })
            .then(function(){
                return BluetoothService.searchDevices(targetDevices,targetServices); //search for devices
            })
            .then(function(searchedDevices){
                searchedDevice = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                $scope.devices = searchedDevice;
                $scope.searching = false;
                console.log("*** the searched Devices are: " + JSON.stringify(searchedDevice));
                if($scope.devices.length){
                    /**** The line below limits use to one device at a time. Cannot work if two devices are scanned***/
                    var currentDevice = $scope.devices[0];
                    _.forEach($scope.devices, function(device){
                        for(var key in deviceMeasurementMap){
                            if(device.name.toLowerCase().indexOf(key) !== -1){
                                console.log("**** There was a matching device");
                                _.forEach($scope.measurements, function(measurement){
                                    if(deviceMeasurementMap[key] == measurement.name.toLowerCase()){
                                        measurement.status = "Scanned";
                                        currentDevice.measurement = measurement.name.toLowerCase();
                                    }
                                })
                            }
                        }
                    });
                    
                    // _.forEach($scope.measurements,function(measurement){
                    //     if(supportedGuideMeasurements.includes(measurement.name.toLowerCase())){
                    //         measurement.status = "Scanned";
                    //     }
                    // })
                    $scope.connectDevice(currentDevice.address, currentDevice.name, currentDevice.measurement);
                }
            })
            .catch(function(err){
                $scope.searching = false;
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                console.log(JSON.stringify(err));
            });
        };

        $scope.onNext = function() {
            //$location.path('/monitor/notify/' + $scope.monitor.id);
            $rootScope.devicesComplete = true;
            $location.path('/monitor/guide');
        };

        $scope.getDevices();
    }
])
