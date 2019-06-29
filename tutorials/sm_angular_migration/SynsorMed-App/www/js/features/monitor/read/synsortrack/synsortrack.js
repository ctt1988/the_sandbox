angular.module('synsormed.controllers.monitor.synsortrack', [
    'ngCordovaBluetoothLE',
    'synsormed.services.awake',
    'synsormed.services.bluetooth'
])
.controller('bluetoothSynsorTrackDeviceController', [
    '$scope',
    '$rootScope',
    'metaData',
    '$modalInstance',
    'measurementName',
    '$cordovaBluetoothLE',
    'synsormed.services.awake.awakeService',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    function($scope, $rootScope, metaData, $modalInstance, measurementName, $cordovaBluetoothLE, awakeService, BluetoothService, BluetoothStorageService){
        console.log('Measurement --------******',measurementName)
        $scope.initialMsg = 'Please ensure the unit is powered on BEFORE pressing next.';
        $scope.instructionMsg = '';
        var deviceNeeded = false;

        var targetDevices = metaData ? (metaData.devices || []) : [];
        var targetServices = metaData ? (metaData.services || []) : [];

        if(measurementName && measurementName.toLowerCase() == 'weight'){
           $scope.initialMsg = 'Please stand on the scale AFTER pressing next.';
           $scope.instructionMsg = 'Please remain standing on the scale until weight is recorded.';
           deviceNeeded = 1;
           targetServices = metaData ? (metaData.weightServices || []) : [];
        }
        else if(measurementName.toLowerCase() == 'blood pressure')
           $scope.instructionMsg = 'Please press the button to inflate the cuff.';
        else if(measurementName.toLowerCase() == 'oxygen saturation' || measurementName.toLowerCase() == 'heartrate')
           $scope.instructionMsg = 'Please keep your finger in the device.';

        $scope.measurementName = measurementName;
        $scope.devices = [];
        $scope.connected = BluetoothStorageService.getConnectedDevices() || {};

        $scope.$watch('searching', function(value){ // Change btn name during search device
            $scope.scanBtn = value ? 'Scanning...' : 'Start Scan';
        });

        $scope.ok = function(){
            $cordovaBluetoothLE.isScanning()
            .then(function(result){
                if(result.isScanning){
                    $cordovaBluetoothLE.stopScan();
                }
                $modalInstance.dismiss();
            })
            .catch(function(){
                $modalInstance.dismiss();
            });
        };

        $scope.connectDevice = function(address, deviceName){
            awakeService.keepAwake(); //Keep app awake trying to connect device
            $scope.gettingData = true;
            var params = {address: address, timeout: 60000/*BluetoothService.timeout*/, useResolve: true, deviceName: deviceName};

            BluetoothService.connectDevice(params)
            .then(function(connection){
                console.log("*** Return from connectDevice: " + JSON.stringify(connection));
                if(connection.status != 'connected'){
                    $scope.gettingData = false;
                    $scope.$emit('notification:error', 'Connecting to device failed.');
                    return false;
                }
                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
                $scope.connected[address] = true;
                console.log('targetServices here check');
                console.log(JSON.stringify(targetServices));
                console.log('********Now reading SynsorTrackDataLength data');
                //return $modalInstance.close({});
                return BluetoothService.readSynsorTrackData(address, deviceName, targetServices, measurementName, true);
            })
            .then(function(deviceData){
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

                console.log("*** The totalData we are going to close modal with is: " + JSON.stringify(totalData));
                $modalInstance.close(totalData);
            })
            // .then(function(deviceData){
            //     console.log('******************Got data***********************');
            //     console.log(JSON.stringify(deviceData));
            //     $scope.gettingData = false;
            //     var isError = true;
            //     var totalData = {};
            //     console.log('**************deviceData is here************');
            //     console.log(JSON.stringify(deviceData));
			// 	if(deviceData && deviceData.length){
			// 	    _.forEach(deviceData, function(data){
			// 			 if(data && data.state && data.state == 'fulfilled'){
            //                 isError = false;
			// 				var dataValues = data.value || {};
			// 				_.forEach(dataValues, function(val, ind){
			// 					totalData[ind] = totalData[ind] || [];
			// 					totalData[ind] = totalData[ind].concat(val);
            //                     console.log('ind is '+ind);
            //                     console.log('val is '+JSON.stringify(val));
            //                     if(ind == 'spo2' && val.length && val[0].quantity == 0){
            //                         isError = 'Please reinsert your finger and try again.';
            //                     }
			// 				});
			// 		     }
			// 		});
			// 	}
			// 	console.log('SynsorTrack final data is ' + JSON.stringify(totalData));
            //     console.log('check value of isError ');
            //     console.log(isError);
            //     if(!isError){
            //          $scope.$emit('notification:success', 'Service data fetched');
            //          $modalInstance.close(totalData);
            //     }
            //     else{
            //         var message = (typeof isError == 'string') ? isError : 'Error while fetching data';
            //         $scope.$emit('notification:error', message);
            //     }
            //     // Allow app to sleep again
            //     awakeService.allowSleep();
            // })
            .catch(function(err){
                console.log('**************Got Errorr********************');
                console.log(JSON.stringify(err));
                $scope.gettingData = false;
                //disconnect if there is an error
                BluetoothService.disconnect(params);
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                if(err.error == 'invalidDevice') $scope.$emit('notification:error', 'Invalid SynsorTrack Device');
                if(err.error != 'enable') BluetoothService.disConnectDevice(params);
                $scope.$emit('notification:error', 'Error while connecting to device');
                // Allow app to sleep again
                awakeService.allowSleep();
            });
        };

        $scope.getDevices = function(){
            $scope.searching = true;
            BluetoothService.initialize({ request: true }) // plugin initialized
            .then(function(){
                return BluetoothService.searchDevices(targetDevices,targetServices, deviceNeeded); //search for devices
            })
            .then(function(returnedDevices){
                console.log("*** search devices before filtering: " + JSON.stringify(returnedDevices));
                searchedDevice = BluetoothService.filterDevices(returnedDevices); // Devices may be repeated filter them
                $scope.devices = searchedDevice;
                $rootScope.$emit('get:devices', {
                    searchedDevice : searchedDevice
                });
                $scope.searching = false;
                var targetFound = false;
                console.log("*** the searchedDevice after filterDevices is: " + JSON.stringify(searchedDevice));
                _.forEach(searchedDevice, function(searchedDevice){
                    if(targetDevices.indexOf(searchedDevice.name) != -1){
                        targetFound = searchedDevice;
                    }
                });
                console.log('*******Value of target found is ');
                console.log(JSON.stringify(targetFound));
                console.log('********************************');
                if(targetFound){
                   $rootScope.availableDevice = true;
                   $scope.connectDevice(targetFound.address, targetFound.name);
                }
                else{
                    $rootScope.availableDevice = false;
                }
            })
            .catch(function(err){
                $scope.searching = false;
                $rootScope.availableDevice = false;
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                console.log(JSON.stringify(err));
            });
        };

        //$scope.getDevices();

        $scope.moveFromPreScan = function(){
            $scope.bleScanScreen = true;
            $scope.getDevices();
        };

        $scope.$on('$destroy', function() {
            // Allow app to sleep again
            awakeService.allowSleep();
        });
    }
]);
