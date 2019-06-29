angular.module('synsormed.controllers.monitor.devices', [
    'ngCordovaBluetoothLE',
    'synsormed.services.bluetooth',
    'synsormed.services.parser'
])
.controller('bluetoothDeviceController', [
    '$scope',
    'metaData',
    '$modalInstance',
    '$cordovaBluetoothLE',
    'synsormed.services.parser.Chart',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    'synsormed.services.syncData.Support',
    'synsormed.services.syncData.c5',
    function($scope, metaData, $modalInstance, $cordovaBluetoothLE, chartParser, BluetoothService, BluetoothStorageService, syncSupport, c5Sync){
        var targetDevices = metaData ? (metaData.devices || []) : [];
        var targetServices = metaData ? (metaData.services || []) : [];
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
            $scope.waiting = true;
            var params = {address: address, timeout: BluetoothService.timeout, useResolve: true};

            console.log("*** The params before calling connectDevice: " + JSON.stringify(params));

            BluetoothService.connectDevice(params)
            .then(function(connection){
                if(connection.status != 'connected'){
                    $scope.waiting = false;
                    $scope.$emit('notification:error', 'Connecting to device failed.');
                    return false;
                }
                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
                $scope.connected[address] = true;
                return BluetoothService.readData(address, deviceName, targetServices);
            })
            .then(function(deviceData){
                $scope.waiting = false;
                var isError = false;
                var totalData = [];

                if(deviceData && deviceData.length){
                    _.forEach(deviceData, function(data){
                        if(data && data.state && data.state == 'fulfilled' && data.value.length){
                            totalData.push(chartParser.parse(data.value));
                        }
                        else{
                            isError = isError || true;
                        }
                    });
                }

                if(!isError){
                     $scope.$emit('notification:success', 'Service data fetched');
                     $modalInstance.close(totalData);
                }
                else{
                    $scope.$emit('notification:danger', 'Error while fetching data');
                }

            })
            .catch(function(err){
                $scope.waiting = false;
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                if(err.error == 'invalidDevice') $scope.$emit('notification:error', 'Invalid C5 Device');
            });
        };

        $scope.getDevices = function(){
            $scope.searching = true;
            BluetoothService.initialize({ request: true }) // plugin initialized
            .then(function(){
                return BluetoothService.searchDevices(targetDevices,targetServices); //search for devices
            })
            .then(function(searchedDevices){
                searchedDevice = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                $scope.devices = searchedDevice;
                $scope.searching = false;
            })
            .catch(function(err){
                $scope.searching = false;
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                console.log(JSON.stringify(err));
            });
        };

        $scope.getDevices();
    }]);
