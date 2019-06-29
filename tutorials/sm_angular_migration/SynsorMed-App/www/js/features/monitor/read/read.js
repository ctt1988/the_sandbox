angular.module('synsormed.controllers.monitor.read', [
    'synsormed.services.user',
    'synsormed.services.oauth',
    'synsormed.services.monitor',
    'synsormed.services.location',
    'synsormed.services.syncData',
    'synsormed.services.subscription',
    'synsormed.controllers.monitor.nonin',
    'synsormed.controllers.monitor.and',
    'synsormed.controllers.monitor.fdk',
    'synsormed.controllers.monitor.serviceList',
    'synsormed.controllers.monitor.synsortrack.linking'
])
    .controller('MonitorReadController', [
        '$scope',
        '$interval',
        '$modal',
        '$rootScope',
        '$location',
        '$window',
        'synsormed.services.user.UserService',
        'synsormed.services.user.UserModel',
        'synsormed.services.oauth.OauthService',
        'synsormed.services.monitor.MonitorMeasurementService',
        'synsormed.services.monitor.MonitorServicesService',
        'synsormed.services.healthkit.HealthkitService',
        'synsormed.services.oauth.OauthDataManagementService',
        '$q',
        'localStorageService',
        'synsormed.services.monitor.MonitorDocumentService',
        'synsormed.services.location.locationService',
        'synsormed.services.syncData.c5',
        'synsormed.services.syncData.eclipse',
        'synsormed.services.syncData.healthkit',
        'synsormed.services.subscription.subscribeLostDevices',
        'synsormed.services.awake.awakeService',
        'synsormed.services.bluetooth.BluetoothService',
        'synsormed.services.bluetooth.BluetoothStorageService',
        function ($scope, $interval, $modal, $rootScope, $location, $window, UserService, UserModel, OauthService, MonitorMeasurementService, MonitorServicesService, HealthkitService, OauthDataManagementService, $q, localStorageService, MonitorDocumentService, locationService, c5, eclipse, healthkit, subscribeLostDevices, awakeService, BluetoothService, BluetoothStorageService) {
            var isTimerStart = null;

            var modalInstance = false;
            $scope.isConnected = false;
            var deviceNeeded = false;
            var targetDevices = [];
            var targetServices = [];
            var measurementName = "";
            var availMeasurement = [];
            var availMeasurements = [];
            $rootScope.availableDevice = false;
            var searchingInProgress = false;

            $rootScope.allAvailableDevices = [];
            $rootScope.bleDriver = "don1";

            var cleanUpFunc = $rootScope.$on('start:transferring', function (event, args) {
                modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/synsortrack/linking.html',
                    controller: 'bluetoothSynsorTrackLinkingDeviceController',
                    backdrop: 'static',
                    resolve: {
                        deviceName: function () {
                            return args.deviceName;
                        }
                    }
                });
                modalInstance.result //reload the monitor list
                    .then(function (oauthData) {
                        if (!oauthData) {
                            $scope.$emit("notification", {
                                type: 'danger',
                                message: "Error in Fetching Data!"
                            });
                            return;
                        }
                        else if (typeof oauthData == 'object') {
                            MonitorMeasurementService //update this data with monitor
                                .setOauthDataForMeasurement($scope.monitor.id, availMeasurement.id, oauthData)
                                .then(function (data) {
                                    $scope.$emit("notification", {
                                        type: 'success',
                                        message: "Data Fetched Successfully"
                                    });
                                    $scope.$emit('wait:stop');
                                    $scope.refreshList();
                                })
                                .catch(function (err) {
                                    if (err.status == 422) {
                                        $scope.$emit("notification", {
                                            type: 'danger',
                                            message: err.data
                                        });
                                    }
                                    $scope.$emit('wait:stop');
                                    $scope.refreshList();
                                    // $scope.Timer = $interval(function(){
                                    //                     var nowTime = $scope.getDevices();
                                    //                 }, 5000);
                                });
                        }
                    });
                // modalInstance.result.finally(function(){
                //     $scope.$emit('wait:stop');
                // });
            });

            $scope.$on('$destroy', function () {
                if (isTimerStart) {
                    $interval.cancel(isTimerStart);
                }
                cleanUpFunc();
            });

            $scope.$on('stop:tranferring', function () {
                return modalInstance.dismiss();
            });

            $rootScope.$on('get:devices', function (event, args) {
                $scope.devices = args.searchedDevice;
            });

            var isEnabled = window.cordova ? window.cordova.plugins.backgroundMode.isEnabled() : true;
            if (!isEnabled) {
                cordova.plugins.backgroundMode.setDefaults({
                    title: 'Receiving bluetooth data.',
                    text: 'Receiving bluetooth data.'
                });
                cordova.plugins.backgroundMode.enable();  // Enable background mode
            }

            var c5Connection = function (c5ConnectionStatus) {
                _.forEach($scope.measurements, function (measurement) {
                    if (c5ConnectionStatus && measurement && measurement.serviceName && (measurement.serviceName.toLowerCase() == 'c5' || measurement.serviceName.toLowerCase() == 'eclipse')) {
                        measurement.availableDevice = true;
                    } else if (!c5ConnectionStatus && measurement && measurement.serviceName && (measurement.serviceName.toLowerCase() == 'c5' || measurement.serviceName.toLowerCase() == 'eclipse')) {
                        measurement.availableDevice = false;
                    }
                });
            }

            var eclipseConnection = function (eclipseConnectionStatus) {
                _.forEach($scope.measurements, function (measurement) {
                    if (eclipseConnectionStatus && measurement && measurement.serviceName && measurement.serviceName.toLowerCase() == 'eclipse') {
                        measurement.availableDevice = true;
                    } else if (!eclipseConnectionStatus && measurement && measurement.serviceName && measurement.serviceName.toLowerCase() == 'eclipse') {
                        measurement.availableDevice = false;
                    }
                });
            }

            $scope.services = [];
            $scope.measurements = [];
            $scope.monitor = UserService.getUser();
            $scope.healthkitAvailable = false;
            $scope.healthData = {
                data: null,
                service: null
            };

            var endTimer = moment().add('12', 'hours');

            $interval(function () {
                var nowTime = moment();
            }, 120000);


            $scope.$emit("wait:start");
            MonitorDocumentService.educationAvailable()
                .then(function (isAvailable) {
                    $scope.isEducationAvailable = isAvailable;
                    if (isAvailable) {
                        return MonitorDocumentService
                            .getDocuments($scope.monitor.id)
                            .then(function (documents) {
                                $scope.$emit("wait:stop");
                                $scope.documents = [];
                                documents.forEach(function (document) {
                                    $scope.documents = $scope.documents.concat(document.files);
                                });
                            });
                    }
                    else {
                        $scope.$emit("wait:stop");
                    }
                })
                .catch(function (e) {
                    $scope.$emit("wait:stop");
                    $scope.$emit('notification:error', 'Server Error');
                });

            HealthkitService //check if Healthkit is available or not on start up
                .checkAvailable()
                .then(function () {
                    $scope.healthkitAvailable = true;
                })
                .catch(function (err) {
                    $scope.healthkitAvailable = false;
                })

            var setAutoFetchCode = function (autoFetch, serviceName) {
                var monitorCode = autoFetch ? $scope.monitor.code : false;
                if (autoFetch) {
                    switch (serviceName) {
                        case 'healthkit':
                            healthkit.init();
                            break;

                        case 'c5':
                            c5.init();
                            break;

                        case 'eclipse':
                            eclipse.init();
                            break;

                        default:
                            console.log("** Could not setAutoFetchCode for serviceName: " + serviceName);
                    }
                }
                else {
                    healthkit.stopTracking();
                    c5.stopTracking();
                    eclipse.stopTracking();
                }
                UserService.setAutoFetchCode(monitorCode);
            };

            //setAutoFetchCode($scope.monitor.autoFetch);

            $scope.$watch('monitor.autoFetch', function (newVal, oldVal) { //watch to update autoFetch of monitor
                if (newVal !== oldVal) {
                    $scope.$emit("wait:start");
                    $scope.monitor.autoFetch = newVal;
                    $scope.monitor.save(false).then(function (user) {
                        $scope.$emit('notification:success', 'Auto Fetch Updated');
                        $scope.$emit("wait:stop");
                        setAutoFetchCode(newVal);
                    }).catch(function (err) {
                        $scope.$emit('notification:error', 'Server Error');
                    });
                }
            });

            var isServiceConnected = function (serviceName) {
                if (!$scope.measurements) return false;
                return $scope.measurements.some(function (measurement) {
                    return (measurement.serviceName != null && measurement.serviceName.toLowerCase() == serviceName);
                });
            };

            $scope.refreshList = function () {
                $scope.$emit("wait:start");
                MonitorMeasurementService     //get all the measurements
                    .getMeasurementsForMonitor($scope.monitor.id)
                    .then(function (measurements) {
                        var oldMeasurements = angular.copy($scope.measurements);
                        oldMeasurements.forEach(function (oldMeasurement) {
                            if ((oldMeasurement.serviceName && (oldMeasurement.serviceName.toLowerCase() == "synsortrack" || oldMeasurement.serviceName.toLowerCase() == "nonin")) && oldMeasurement.oauthAvailable && oldMeasurement.availableDevice) {
                                measurements.forEach(function (measurement, index) {
                                    if ((measurement.serviceName && (measurement.serviceName.toLowerCase() == "synsortrack" || measurement.serviceName.toLowerCase() == "nonin")) && measurement.oauthAvailable && oldMeasurement.id == measurement.id) {
                                        measurement.availableDevice = true;
                                    }
                                })
                            }
                        });
                        $scope.measurements = measurements;
                        var oauthAvailable = true;
                        $scope.measurements.forEach(function (measurement) {
                            console.log("*** Here is data for the measurement during refresh: " + JSON.stringify(measurement));
                            if (measurement.name.toLowerCase() == 'status') $scope.patientStatusMeasurement = measurement;
                            if (measurement.serviceName && measurement.serviceName.toLowerCase() == 'synsormed') $scope.synsormedServiceConnected = measurement;
                            if (!measurement.oauthAvailable) {
                                oauthAvailable = false;
                                return false;
                            }
                            //if ((measurement.serviceName && (measurement.serviceName.toLowerCase() == "synsortrack" || measurement.serviceName.toLowerCase() == "nonin")) && measurement.oauthAvailable) {
                            if (measurement.serviceName && measurement.oauthAvailable) {
                                $scope.isConnected = true;
                                measurement.availableDevice = true;
                                measurementName = measurement.name;
                                var isExists = _.find(availMeasurements, function (measure) {
                                    return measure.id == measurement.id;
                                });
                                isExists = isExists || [];
                                if (!isExists.length) {
                                    availMeasurements.push(measurement)
                                }
                                // MonitorServicesService
                                //     .getServicesForMonitor(measurement.monitorId, measurement.measurementId)
                                //     .then(function (services) {
                                //         $scope.services = services;
                                //         services.forEach(function (service) {
                                //             if (service.display && (service.display.toLowerCase() == 'synsortrack' || service.display.toLowerCase() == 'nonin')) {
                                //                 targetDevices = service.metaData ? (service.metaData.devices || []) : [];
                                //                 targetServices = service.metaData ? (service.metaData.services || []) : [];
                                //                 deviceNeeded = false;
                                //                 var deviceName = service.metaData ? (service.metaData.devices[0] || []) : [];
                                //                 if ($scope.devices && $scope.devices[0].name == deviceName) {
                                //                     measurement.availableDevice = true;
                                //                 }
                                //                 else {
                                //                     measurement.availableDevice = false;
                                //                 }
                                //             }
                                //         });
                                //     })
                                //     .catch(function (err) {
                                //         console.log('err', err)
                                //     });
                            }
                        });

                        if (isServiceConnected('c5')) {
                            subscribeLostDevices.start($scope.monitor, 'c5');
                            setAutoFetchCode($scope.monitor.autoFetch, 'c5');
                        } else if (isServiceConnected('eclipse')) {
                            subscribeLostDevices.start($scope.monitor, 'eclipse');
                            setAutoFetchCode($scope.monitor.autoFetch, 'eclipse');
                        }

                        $scope.oauthAvailable = oauthAvailable ? true : false;
                        $scope.$emit("wait:stop");
                        if ($rootScope.c5ConnectionStatus) c5Connection($rootScope.c5ConnectionStatus);
                        if ($rootScope.eclipseConnectionStatus) eclipseConnection($rootScope.eclipseConnectionStatus);
                    })
                    .catch(function (e) {
                        $scope.measurements = [];
                        $scope.$emit("notification:error", "Unable to load measurements");
                        $scope.$emit("wait:stop");
                    });
            }

            $scope.helpModal = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/autoFetchHelp.html',
                    controller: 'HelpModalController'
                });
            };

            $scope.unlinkService = function () {
                $location.path('/patient/connect');
            };

            $scope.goToDocumentsPage = function () {
                $location.path('/monitor/documents');
            };

            $scope.goToSynsormedService = function () {
                $location.path('/serviceprovider/synsormed');
            };

            $scope.servicesList = function (measurementMap) {
                if (isTimerStart) $interval.cancel(isTimerStart);
                $scope.$emit('wait:start');
                var modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/servicelist/servicelist.html',
                    controller: 'serviceListModalController',
                    resolve: {
                        monitor: function () {
                            return $scope.monitor;
                        },
                        measurementMap: function () {
                            return measurementMap;
                        }
                    }
                });
                modalInstance.result //reload the monitor list
                    .then(function (oauthData) {
                        if (!oauthData) {
                            $scope.$emit("notification", {
                                type: 'danger',
                                message: "Synsormed Connect Failed"
                            });
                            return;
                        }
                        else if (typeof oauthData == 'object') {
                            var updateOnly = oauthData.service_name.toLowerCase() == 'synsortrack';
                            MonitorMeasurementService //update this data with monitor
                                .setOauthDataForMeasurement($scope.monitor.id, measurementMap.id, oauthData, updateOnly)
                                .then(function (data) {
                                    var serviceName = oauthData.service_name;
                                    $scope.$emit("notification", {
                                        type: 'success',
                                        message: (serviceName.charAt(0).toUpperCase() + serviceName.substr(1).toLowerCase()) + " Connected"
                                    });
                                    $scope.$emit('wait:stop');
                                    $scope.refreshList();
                                    // isTimerStart = $interval(function(){
                                    //     if(!searchingInProgress){
                                    //         var nowTime = $scope.getDevices();
                                    //     }
                                    // }, 5000);
                                    //window.location.reload(true);
                                })
                                .catch(function (err) {
                                    if (err.status == 422) {
                                        $scope.$emit("notification", {
                                            type: 'danger',
                                            message: err.data
                                        });
                                    }
                                    $scope.$emit('wait:stop');
                                    $scope.refreshList();
                                });
                        }
                        else if (oauthData == true) {
                            $scope.$emit("notification", {
                                type: 'success',
                                message: "Synsormed Connected"
                            });
                            $scope.$emit('wait:stop');
                            $scope.refreshList();
                        }
                    });
                modalInstance.result.finally(function () {
                    $scope.$emit('wait:stop');
                });
            };

            //update healthkit data
            var updateHealthkitData = function (monitor, measurements) {
                var promises = [];
                var uploadDataToServer = function (measurementMap) {
                    return HealthkitService
                        .performAuth()
                        .then(function (data) {
                            if (data === true) {
                                return HealthkitService.readData().then(function (readings) {
                                    return MonitorMeasurementService.setOauthDataForMeasurement(monitor.id, measurementMap.id, {
                                        'service_name': 'healthkit',
                                        'oauth_data': readings
                                    }, true);
                                });
                            } else {
                                return false;
                            }
                        });
                };
                measurements.forEach(function (measurement) {
                    if (measurement.serviceName != null && measurement.serviceName.toLowerCase() == 'healthkit') {
                        promises.push(uploadDataToServer(measurement));
                    }
                });
                return $q.all(promises);
            };


            // update healthkit data
            $scope.syncHealthKitData = function (monitor, measurements, autoSync) {
                monitor = monitor ? monitor : $scope.monitor;
                measurements = measurements ? measurements : $scope.measurements;
                if (!monitor || !measurements || !autoSync) return;

                $rootScope.healthkitSyncing = true;
                updateHealthkitData(monitor, measurements)
                    .then(function (data) {
                        var showSuccessMsg = data.every(function (val) { return !!val });
                        var showPermissionErrMsg = data.every(function (val) { return !val });

                        if (data.length && showSuccessMsg) {
                            $scope.$emit('notification:success', 'Healthkit data uploaded');
                        }
                        if (data.length && showPermissionErrMsg) {
                            $scope.$emit('notification:error', 'Healthkit permission denied');
                        }
                        $scope.refreshList();
                        $rootScope.healthkitSyncing = false;
                    })
                    .catch(function () {
                        $scope.$emit('notification:error', 'Healthkit data syncing failed');
                        $rootScope.healthkitSyncing = false;
                    });
            };

            $scope.checkConnectedService = isServiceConnected;

            $scope.showSyncBar = function () {
                return (isServiceConnected('and') || isServiceConnected('synsortrack') || isServiceConnected('nonin') || isServiceConnected('healthkit') || isServiceConnected('c5') || isServiceConnected('eclipse'));
            };

            $scope.getSyncableServices = function () {
                var connectedServices = [];
                var healthkitConnected = isServiceConnected('healthkit');
                var c5Connected = isServiceConnected('c5');
                var noninConnected = isServiceConnected('nonin');
                var synsortrackConnected = isServiceConnected('synsortrack');
                var eclipseConnected = isServiceConnected('eclipse');
                var andConnected = isServiceConnected('and');

                if (healthkitConnected) connectedServices.push('Healthkit');
                if (c5Connected) connectedServices.push('C5');
                if (noninConnected) connectedServices.push('Nonin');
                if (synsortrackConnected) connectedServices.push('SynsorTrack');
                if (eclipseConnected) connectedServices.push('Eclipse');
                if (andConnected) connectedServices.push('AnD');

                $scope.c5Conn = c5Connected;
                $scope.noninConnected = noninConnected;
                $scope.healthkitConnected = healthkitConnected;
                $scope.synsortrackConnected = synsortrackConnected;
                $scope.eclipseConn = eclipseConnected;
                $scope.andConn = andConnected;
                return connectedServices.toString();
            }

            $scope.syncC5Data = function (autoSyncC5) {
                if (!autoSyncC5) return;
                //c5.startSync($scope.monitor);
                c5.sync();
            };

            $scope.syncEclipseData = function (autoSyncEclipse) {
                if (!autoSyncEclipse) return;
                //eclipse.startSync($scope.monitor);
                eclipse.sync();
            };

            $scope.syncDeviceForService = function (serviceName) {
                var deviceMeasurement = false;
                var deviceMeasurements = [];
                $scope.measurements.forEach(function (measurement) {
                    if (measurement && measurement.serviceName && measurement.serviceName.toLowerCase() == serviceName) {
                        deviceMeasurements.push(measurement);
                    }
                });
                if (!deviceMeasurements.length) return;

                var indicatorModel = $modal.open({
                    templateUrl: 'js/features/monitor/read/indicators/indicators.html',
                    controller: ['$scope', function ($scope) {
                        $scope.indicators = deviceMeasurements;
                        $scope.selectIndicator = function (selectedMeasurement) {
                            indicatorModel.close(selectedMeasurement);
                        }
                        $scope.ok = function () {
                            indicatorModel.dismiss();
                        }
                    }]
                });
                indicatorModel.result
                    .then(function (selectedMeasurement) {
                        deviceMeasurement = selectedMeasurement;
                        if (!deviceMeasurement) return;
                        MonitorServicesService
                            .getServicesForMonitor($scope.monitor.id, deviceMeasurement.measurementId)
                            .then(function (services) {
                                var deviceService;
                                services.forEach(function (service) {
                                    if (service.name.toLowerCase() == serviceName) {
                                        console.log("*** I am setting deviceService and metadata: " + JSON.stringify(service));
                                        deviceService = service;
                                    }
                                });
                                var controller = 'bluetoothNoninDeviceController';
                                var templateUrl = 'js/features/monitor/read/nonin/nonin.html';

                                if (serviceName == 'synsortrack') {
                                    templateUrl = 'js/features/monitor/read/synsortrack/synsortrack.html';
                                    controller = 'bluetoothSynsorTrackDeviceController';
                                }

                                if (serviceName == 'and') {
                                    templateUrl = 'js/features/monitor/read/and/and.html';
                                    controller = 'bluetoothAndDeviceController';
                                }

                                var modalInstance = $modal.open({
                                    templateUrl: templateUrl,
                                    controller: controller,
                                    resolve: {
                                        metaData: function () {
                                            return deviceService.metaData;
                                        },
                                        measurementName: function () {
                                            return deviceMeasurement.name;
                                        }
                                    }
                                });
                                var displayService = serviceName == 'nonin' ? 'Nonin' : (serviceName == 'synsortrack' ? 'SynsorTrack' : (serviceName == 'and' ? 'AnD' : serviceName));
                                modalInstance.result
                                    .then(function (oauthData) {
                                        $scope.$emit('wait:start');
                                        console.log("**** I am about to send oauth data: " + JSON.stringify(oauthData));
                                        MonitorMeasurementService.setOauthDataForMeasurement($scope.monitor.id, deviceMeasurement.id, {
                                            'service_name': serviceName,
                                            'oauth_data': oauthData
                                        }, true);
                                        $scope.$emit("notification", {
                                            type: 'success',
                                            message: displayService + " Syncing Successfull"
                                        });
                                        $scope.$emit('wait:stop');
                                    })
                                    .catch(function (err) {
                                        $scope.$emit('wait:stop');
                                        $scope.$emit('notification:error', displayService + ' Syncing Failed');
                                    });
                                modalInstance.result.finally(function () {
                                    $scope.$emit('wait:stop');
                                });
                            });
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            };

            $scope.syncServicesData = function () {
                if (isServiceConnected('healthkit')) {
                    $scope.syncHealthKitData(false, false, true);
                }
                if (isServiceConnected('c5')) {
                    $scope.syncC5Data(true);
                }
                if (isServiceConnected('eclipse')) {
                    $scope.syncEclipseData(true);
                }
            };

            $scope.surveyPage = function (measurement) {
                $location.path('/monitor/survey/' + $scope.monitor.id + '/' + measurement.id);
            };

            $scope.contactModal = function (monitor) {
                var modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/contactInfo.html',
                    controller: 'contactInfoController',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                        measurements: function () {
                            return $scope.measurements;
                        }
                    }
                });
            }

            $scope.dataModal = function (monitor) {
                var modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/appDevices.html',
                    controller: 'AppDevicesController',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                        measurements: function () {
                            return $scope.measurements;
                        }
                    }
                });
            }

            var allTargetServices = [];
            var allTargetDevices = [];

            $scope.$emit("wait:start");
            $scope.c5Conn = false;
            console.log("**** Before getting measurements for monitor the id is: " + $scope.monitor.id);
            MonitorMeasurementService //get all the measurements
                .getMeasurementsForMonitor($scope.monitor.id)
                .then(function (measurements) {
                    console.log('measurements:' + JSON.stringify(measurements) + " and length: " + measurements.length);
                    if (!measurements.length) {
                        $scope.$emit("wait:stop");
                        console.log("**** Could not get measurements for monitor ID ****");
                        return;
                    }
                    $scope.measurements = measurements;

                    $scope.connected = BluetoothStorageService.getConnectedDevices() || {};
                    //$scope.measurementName = '';

                    if (!$rootScope.c5ConnectionStatus) $rootScope.c5ConnectionStatus = false;
                    if (!$rootScope.eclipseConnectionStatus) $rootScope.eclipseConnectionStatus = false;
                    $scope.educationCheck = []
                    $scope.measurements
                        .forEach(function (measurement) {
                            if (measurement && measurement.isEducationChecked) {
                                $scope.educationCheck.push(measurement.isEducationChecked);
                                if ($scope.educationCheck.indexOf(true) != 1) {
                                    $scope.iseducation = true;
                                }
                            }
                            console.log('$scope.educationCheck:' + $scope.educationCheck)
                            if (measurement.serviceName && (measurement.serviceName.toLowerCase() == "synsortrack" || measurement.serviceName.toLowerCase() == "nonin") && measurement.oauthAvailable) {
                                //&& measurement.name == 'Blood pressure'
                                $scope.isConnected = true;
                                //availMeasurement = measurement;
                                var isExists = _.find(availMeasurements, function (measure) {
                                    return measure.id == measurement.id;
                                });
                                isExists = isExists || [];
                                if (!isExists.length) {
                                    availMeasurements.push(measurement)
                                }
                                measurementName = measurement.name;
                                MonitorServicesService
                                    .getServicesForMonitor(measurement.monitorId, measurement.measurementId)
                                    .then(function (services) {
                                        $scope.services = services;

                                        $scope.services
                                            .forEach(function (service) {
                                                if (service.display.toLowerCase() == 'synsortrack' || service.display.toLowerCase() == 'nonin') {
                                                    $scope.service = service;
                                                    targetDevices = $scope.service.metaData ? ($scope.service.metaData.devices || []) : [];
                                                    targetServices = $scope.service.metaData ? ($scope.service.metaData.services || []) : [];

                                                    allTargetServices.push(targetServices[0].uuid);
                                                    allTargetDevices.push(targetDevices[0]);
                                                }
                                            });
                                        //$scope.getDevices();
                                    })
                                    .catch(function (err) {
                                        console.log('err', err)
                                    });
                            }
                        });

                    $scope.getDevices = function () {
                        if (!targetDevices || !targetServices) {
                            return;
                        }
                        searchingInProgress = true;
                        $scope.searching = true;
                        BluetoothService.initialize({ request: true }) // plugin initialized
                            .then(function () {
                                return BluetoothService.searchDevices(targetDevices, targetServices, deviceNeeded); //search for devices
                            })
                            .then(function (searchedDevices) {
                                var searchedDevice = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                                $scope.devices = searchedDevice;
                                var targetFound = false;
                                _.forEach(searchedDevice, function (searchedDevice) {
                                    if (targetDevices.indexOf(searchedDevice.name) != -1) {
                                        targetFound = searchedDevice;
                                    }
                                });
                                if (targetFound) {
                                    $scope.measurements
                                        .forEach(function (measurement) {
                                            if ((measurement.serviceName.toLowerCase() == "synsortrack" || measurement.serviceName.toLowerCase() == "nonin") && measurement.oauthAvailable) {
                                                $scope.services
                                                    .forEach(function (service) {
                                                        if (service.display.toLowerCase() == 'synsortrack' || service.display.toLowerCase() == 'nonin') {
                                                            var deviceName = service.metaData ? (service.metaData.devices[0] || []) : [];
                                                            if (searchedDevice[0].name == deviceName) {
                                                                measurement.availableDevice = true;
                                                            }
                                                            else {
                                                                measurement.availableDevice = false;
                                                            }
                                                        }
                                                    });
                                            }
                                        });
                                    //$rootScope.availableDevice = true;
                                    //$interval.cancel($scope.Timer);
                                    $scope.connectDevice(targetFound.address, targetFound.name);
                                }
                                else {
                                    $scope.measurements
                                        .forEach(function (measurement) {
                                            measurement.availableDevice = false;
                                        })
                                    $rootScope.availableDevice = false;
                                    searchingInProgress = false;
                                }
                            })
                            .catch(function (err) {
                                searchingInProgress = false;
                                $rootScope.availableDevice = false;
                                $scope.searching = false;
                                if (err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                            });
                    };

                    $scope.connectDevice = function (address, deviceName) {
                        awakeService.keepAwake(); //Keep app awake trying to connect device
                        var params = { address: address, timeout: 10000/*BluetoothService.timeout*/, useResolve: true };
                        BluetoothService.connectDevice(params)
                            .then(function (connection) {
                                if (connection.status != 'connected') {
                                    modalInstance.dismiss();
                                    $scope.$emit('notification:error', 'Connecting to device failed.');
                                    searchingInProgress = false;
                                    return false;
                                }
                                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
                                $scope.connected[address] = true;
                                return BluetoothService.readSynsorTrackData(address, deviceName, targetServices, measurementName);
                            })
                            .then(function (deviceData) {
                                //$modal.close(true);
                                var isError = true;
                                var isDissconnected = false;
                                var totalData = {};
                                if (deviceData && deviceData.length) {
                                    _.forEach(deviceData, function (data) {
                                        if (data && data.state && data.state == 'fulfilled') {
                                            var dataValues = data.value || {};
                                            if (dataValues.measurementNames) {
                                                _.forEach(availMeasurements, function (measurement, index) {
                                                    if (dataValues.measurementNames.indexOf(measurement.name.toLowerCase())) {
                                                        isError = false;
                                                        availMeasurement = measurement;
                                                    }
                                                });
                                            }
                                            _.forEach(dataValues, function (val, ind) {
                                                totalData[ind] = totalData[ind] || [];
                                                totalData[ind] = totalData[ind].concat(val);
                                                if (ind == 'spo2' && val.length && val[0].quantity == 0) {
                                                    isError = 'Please reinsert your finger and try again.';
                                                }
                                            });
                                        }
                                        else {
                                            isDissconnected = data.reason ? (data.reason.message || 'Rejected') : 'Rejected';
                                        }
                                    });
                                }
                                if (isDissconnected == 'Device is disconnected') {
                                    searchingInProgress = false;
                                    return;
                                }
                                if (!isError) {
                                    searchingInProgress = false;
                                    $scope.$emit('notification:success', 'Service data fetched');
                                    modalInstance.close({ 'service_name': 'synsortrack', 'oauth_data': totalData });

                                }
                                else {
                                    var message = (typeof isError == 'string') ? isError : 'Error while fetching data';
                                    modalInstance.dismiss();
                                    searchingInProgress = false;
                                    $scope.$emit('notification:error', message);

                                }
                                // Allow app to sleep again
                                awakeService.allowSleep();
                            })
                            .catch(function (err) {
                                if (modalInstance) {
                                    modalInstance.dismiss();
                                }
                                if (err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                                if (err.error == 'invalidDevice') $scope.$emit('notification:error', 'Invalid SynsorTrack Device');
                                if (err.error != 'enable') BluetoothService.disConnectDevice(params);
                                //$scope.$emit('notification:error', 'Error while connecting to device');
                                searchingInProgress = false;

                                // Allow app to sleep again
                                awakeService.allowSleep();
                            });
                    };

                    // isTimerStart = $interval(function(){
                    //     if(!searchingInProgress){
                    //         var nowTime = $scope.getDevices();
                    //     }
                    // }, 5000);

                    $rootScope.$watch('c5ConnectionStatus', function (val) {
                        c5Connection(val);
                    });

                    $rootScope.$watch('eclipseConnectionStatus', function (val) {
                        eclipseConnection(val);
                    });

                    var autoSync = !localStorageService.get('stopAutoSyncHealthkitData');
                    $scope.syncHealthKitData($scope.monitor, $scope.measurements, autoSync);
                    localStorageService.set('stopAutoSyncHealthkitData', true);

                    if (isServiceConnected('c5') || isServiceConnected('eclipse') || isServiceConnected('healthkit')) {

                        if (isServiceConnected('c5')) {
                            setAutoFetchCode($scope.monitor.autoFetch, 'c5');
                            var autoSyncC5 = !localStorageService.get('stopAutoSyncC5Data');
                            //$scope.syncC5Data(autoSyncC5);  //sync whenever logging in
                            localStorageService.set('stopAutoSyncC5Data', true);
                            subscribeLostDevices.start($scope.monitor, 'c5');
                        } else if (isServiceConnected('eclipse')) {
                            setAutoFetchCode($scope.monitor.autoFetch, 'eclipse');
                            var autoSyncC5 = !localStorageService.get('stopAutoSyncC5Data');
                            //$scope.syncEclipseData(autoSyncC5);  //sync whenever logging in
                            localStorageService.set('stopAutoSyncC5Data', true);
                            subscribeLostDevices.start($scope.monitor, 'eclipse');
                        } else if (isServiceConnected('healthkit')) {
                            setAutoFetchCode($scope.monitor.autoFetch, 'healthkit');
                        }

                        $rootScope.$watch('c5DataString', function (val) {
                            $scope.latestC5Data = angular.copy(val);
                        });

                        $rootScope.$watch('eclipseDataString', function (val) {
                            $scope.latestC5Data = angular.copy(val);
                        });


                    }

                    var oauthAvailable = true;
                    $scope.measurements
                        .forEach(function (measurement) {
                            if (measurement.name.toLowerCase() == 'status') $scope.patientStatusMeasurement = measurement;
                            if (measurement.serviceName && measurement.serviceName.toLowerCase() == 'synsormed') $scope.synsormedServiceConnected = measurement;
                            if (!measurement.oauthAvailable) {
                                oauthAvailable = false;
                                return false;
                            }
                        });
                    $scope.oauthAvailable = !!oauthAvailable;
                    $scope.$emit("wait:stop");
                })
                .catch(function (e) {
                    console.log("*** Error getting measurements: " + JSON.stringify(e));
                    $scope.measurements = [];
                    $scope.$emit("notification:error", "Unable to load measurements");
                    $scope.$emit("wait:stop");
                });

            MonitorServicesService //get all the services
                .getServicesForMonitor($scope.monitor.id)
                .then(function (services) {
                    $scope.services = services;
                    $scope.$emit("wait:stop");
                })
                .catch(function (e) {
                    $scope.services = [];
                    $scope.$emit("notification:error", "Unable to find any services");
                    $scope.$emit("wait:stop");
                });

            var getLocation = function () {
                console.log('********In get location function')
                locationService.getLocation() // update location
                    .then(function (location) {
                        console.log('***location is: ' + JSON.stringify(location));
                        return locationService.updateMonitorLocation($scope.monitor.id, location);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            }

            if (!$rootScope.isLocationTimerStart) {
                $rootScope.isLocationTimerStart = $interval(function () {
                    getLocation();
                }, 1000 * 60 * 60 * 1);
                getLocation();
            }

        }])
    .controller('HelpModalController', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close();
        };
    }])
    .controller('AppDevicesController', [
        '$scope',
        'monitor',
        'measurements',
        '$modalInstance',
        '$modal',
        'synsormed.services.monitor.MonitorMeasurementService',
        'synsormed.services.monitor.MonitorServicesService', function ($scope, monitor, measurements, $modalInstance, $modal, MonitorMeasurementService, MonitorServicesService) {
            $scope.monitor = monitor;
            $scope.measurements = measurements;
            $scope.notification = false;
            $scope.ok = function () {
                $modalInstance.close();
            };

            MonitorServicesService
                .getConnectedService(monitor.data.id)
                .then(function (services) {
                    $scope.serviceMeasurements = [];
                    $scope.services = services;

                    if (!$scope.services.length) {
                        $scope.notLinkedService = 'No service linked.'
                    }
                });

            $scope.selectedService = function (service) {
                $scope.serviceMeasurements = [];
                $scope.service = service;
                _.forEach(measurements, function (indicator) {
                    if (indicator.serviceName && indicator.serviceName.toLowerCase() == service.service_name.toLowerCase()) {
                        $scope.serviceMeasurements.push(indicator);
                    }
                });
                if ($scope.serviceMeasurements) {
                    _.forEach($scope.serviceMeasurements, function (result) {
                        $scope.resultMeasurement = result;
                    });
                    MonitorMeasurementService
                        .fetchData(monitor.data.id, $scope.resultMeasurement.id)
                        .then(function (data) {
                            if (data) {
                                $scope.serviceMeasurements.push(data);
                            }
                            var modalInstance = $modal.open({
                                templateUrl: 'js/features/monitor/read/appIndicators.html',
                                controller: 'AppIndicatorsController',
                                resolve: {
                                    monitor: function () {
                                        return $scope.monitor;
                                    },
                                    measurements: function () {
                                        return $scope.serviceMeasurements;
                                    }
                                }
                            });
                        })
                        .catch(function (error) {
                            console.log('error', error);
                        });
                }
            }
        }])
    .controller('AppIndicatorsController', [
        '$scope',
        'monitor',
        'measurements',
        '$modal',
        '$modalInstance',
        'synsormed.services.monitor.MonitorMeasurementService', function ($scope, monitor, measurements, $modal, $modalInstance, MonitorMeasurementService) {

            var hoursArray = [];
            var hourValue = null;
            $scope.results = [];
            $scope.targetFlowRate = measurements[0].upperbound;

            //Go through each datapoint of hours and put them all in an array
            if (measurements && measurements[1] && measurements[1].extraSeries && measurements[1].extraSeries.hours) {
                _.forEach(measurements[1].extraSeries.hours[0].data, function (dataPoint) {
                    hourValue = parseFloat(dataPoint.extra.reading);
                    //Put all nonzero hour values into the array
                    if (hourValue != 0) {
                        hoursArray.push(hourValue);
                    }
                });
            }

            //Find the least and greatest values in the array to get the delta time
            var lowestHour = _.min(hoursArray);
            var highestHour = _.max(hoursArray);
            var usageTime = highestHour - lowestHour;

            $scope.usageHours = Math.floor(usageTime);
            $scope.usageMinutes = 60 * (usageTime % 1).toFixed(4);


            //Go through each datapoint and find the most recent flow reading
            var mostRecentDate = 0;
            var mostRecentFlowRate = null;
            if (measurements && measurements[1] && measurements[1].series) {
                _.forEach(measurements[1].series[0].data, function (dataPoint) {

                    //Only update the mostRecnt values if the value is nonzero or it's the first datapoint or last datapoint based on date
                    if (parseInt(dataPoint.extra.reading) != 0 && (mostRecentFlowRate == null || Date.parse(dataPoint.extra.date) > mostRecentDate)) {
                        mostRecentDate = Date.parse(dataPoint.extra.date);
                        mostRecentFlowRate = dataPoint.extra.reading;
                    }

                });
            }
            $scope.mostRecentFlowRate = mostRecentFlowRate;


            // _.forEach(measurements, function(measurement){
            //   if(measurement && measurement.extraSeries && measurement.extraSeries.hours){
            //     measurements.push({name:'Hours'});
            //     _.forEach(measurement.extraSeries.hours, function(hours){
            //       $scope.hours = hours;
            //     })
            //   }
            // })
            $scope.monitor = monitor;
            $scope.measurements = measurements;

            $scope.selectedMeasurement = function (measurement) {
                var indicator;
                $scope.measurements.forEach(function (indicator) {
                    if (indicator && indicator.name && indicator.name.toLowerCase() == measurement.toLowerCase()) {
                        $scope.measurement = indicator;
                    }
                })
                $scope.results = [];
                if (measurement && measurement.name && measurement.name.toLowerCase() == 'hours') {
                    if ($scope.hours) {
                        angular.forEach($scope.hours, function (value, key) {
                            if (value) {
                                angular.forEach(value, function (value1, key1) {
                                    $scope.results.push({
                                        reading: value1.extra.reading,
                                        date: value1.extra.date
                                    });
                                });
                            }
                        });
                    }
                    var modalInstance = $modal.open({
                        templateUrl: 'js/features/monitor/read/appData.html',
                        controller: 'AppDataController',
                        resolve: {
                            data: function () {
                                return $scope.results;
                            },
                            measurement: function () {
                                return $scope.measurement;
                            }
                        }
                    });
                }
                else {
                    $scope.$emit("wait:start");
                    MonitorMeasurementService
                        .fetchData(monitor.data.id, $scope.measurement.id, 10)
                        .then(function (data) {
                            $scope.$emit("wait:stop");
                            $scope.notification = false;
                            if (data) {
                                angular.forEach(data, function (value, key) {
                                    if (value && value[0] && value[0].data && value[1] && value[1].data) {
                                        angular.forEach(value[0].data, function (value1, key1) {
                                            $scope.results.push({
                                                reading: value1.extra.reading,
                                                date: value1.extra.date
                                            });
                                        });
                                        angular.forEach(value[1].data, function (value2, key2) {
                                            $scope.results[key2].reading1 = value2.extra.reading;
                                        });
                                    }
                                });
                            }
                            var modalInstance = $modal.open({
                                templateUrl: 'js/features/monitor/read/appData.html',
                                controller: 'AppDataController',
                                resolve: {
                                    data: function () {
                                        return $scope.results;
                                    },
                                    measurement: function () {
                                        return $scope.measurement;
                                    }
                                }
                            });
                        })
                        .catch(function (error) {
                            $scope.$emit("wait:stop");
                            if (error.status === 409) {
                                $scope.notification = error.data || 'Service has no readings submitted in the last 30 days for the current measurement';
                            }
                            else if (error.status === 404) {
                                $scope.notification = 'No service linked';
                            }
                            else {
                                $scope.notification = 'No readings available';
                            }
                            $scope.$emit("wait:stop");
                            //  var modalInstance = $modal.open({
                            //      templateUrl: 'js/features/monitor/read/appData.html',
                            //      controller: 'AppDataController',
                            //      resolve: {
                            //          data:function(){
                            //            return error;
                            //          },
                            //          measurement:function(){
                            //            return $scope.measurement;
                            //          }
                            //      }
                            //  });
                        });
                }
            };

            $scope.patientInfo = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'js/features/monitor/read/patientInfo.html',
                    controller: 'patientInfoController',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        }
                    }
                });
            }

            $scope.ok = function () {
                $modalInstance.close();
            };
        }])
    .controller('AppDataController', [
        '$scope',
        'data',
        'measurement',
        '$modal',
        '$modalInstance', function ($scope, data, measurement, $modal, $modalInstance) {

            $scope.allData = data;

            $scope.pagination = {
                page: 1,
                pageSize: 10,
                results: []
            };
            $scope.pageCount = 0;

            // if(data.data){
            //   $scope.error = data.data;
            // }else{
            $scope.pagination.results = $scope.allData.slice(0, $scope.pagination.pageSize);
            updatePageCount();
            //}

            function updatePageCount() {
                $scope.pageCount = Math.ceil($scope.allData.length / $scope.pagination.pageSize);

                $scope.pages = [];
                for (var i = 1; i <= $scope.pageCount; i++) {
                    $scope.pages.push(i);
                }
            }

            $scope.pageTo = function (page) {
                $scope.pagination.page = page;
                var lowerLimit = ($scope.pagination.results.length * (page - 1));
                var upperLimit = ($scope.pagination.results.length * (page - 1)) + $scope.pagination.pageSize;
                var limitData = $scope.allData.slice(lowerLimit, upperLimit);
                $scope.pagination.results = limitData;
            };

            $scope.pageTurn = function (value) {
                if ($scope.pagination.page == 1 && value < 0) {
                    return;
                }
                if ($scope.pagination.page == $scope.pageCount && value > 0) {
                    return;
                }
                $scope.pagination.page = $scope.pagination.page + value;
                $scope.pageTo($scope.pagination.page);
            };

            $scope.measurement = measurement;

            $scope.ok = function () {
                $modalInstance.close();
            };
        }])
    .controller('contactInfoController', [
        '$scope',
        'monitor',
        'measurements',
        '$modalInstance', function ($scope, monitor, measurements, $modalInstance) {
            $scope.monitor = monitor;
            $scope.ok = function () {
                $modalInstance.close();
            };
        }])
    .controller('patientInfoController', [
        '$scope',
        'monitor',
        '$modalInstance', function ($scope, monitor, $modalInstance) {
            $scope.monitor = monitor;
            $scope.ok = function () {
                $modalInstance.close();
            };
        }])
    .filter('tel', function () {
        return function (tel) {
            if (!tel) { return ''; }

            var value = tel.toString().trim().replace(/^\+/, '');

            if (value.match(/[^0-9]/)) {
                return tel;
            }

            var country, city, number;

            switch (value.length) {
                case 10: // +1PPP####### -> C (PPP) ###-####
                    country = 1;
                    city = value.slice(0, 3);
                    number = value.slice(3);
                    break;

                case 11: // +CPPP####### -> CCC (PP) ###-####
                    country = value[0];
                    city = value.slice(1, 4);
                    number = value.slice(4);
                    break;

                case 12: // +CCCPP####### -> CCC (PP) ###-####
                    country = value.slice(0, 3);
                    city = value.slice(3, 5);
                    number = value.slice(5);
                    break;

                default:
                    return tel;
            }

            if (country == 1) {
                country = "";
            }

            number = number.slice(0, 3) + '-' + number.slice(3);

            return (country + " (" + city + ") " + number).trim();
        };
    });
