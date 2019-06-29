angular.module('synsormed.controllers.monitor.fdk', [
    'ngCordovaBluetoothLE',
    'synsormed.services.bluetooth',
    'synsormed.services.noninParser'
])
.controller('bluetoothFdkDeviceController', [
    '$scope',
    'metaData',
    'measurementName',
    '$modalInstance',
    '$cordovaBluetoothLE',
    'synsormed.services.noninParser.Nonin',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    function($scope, metaData, measurementName, $modalInstance, $cordovaBluetoothLE, Nonin, BluetoothService, BluetoothStorageService){

        var targetDevices = metaData ? (metaData.devices || []) : [];
        var targetServices = metaData ? (metaData.services || []) : [];
        console.log("*** At this point, targetDevices are: " + JSON.stringify(targetDevices) + " and targetServices are: " + JSON.stringify(targetServices));
        $scope.devices = [];
        $scope.connected = BluetoothStorageService.getConnectedDevices() || {};

        $scope.$watch('searching', function(value){ // Change btn name during search device
            $scope.scanBtn = value ? 'Scanning...' : 'Start Scan';
        });

        $scope.moveFromPreScan = function(){
            $scope.bleScanScreen = true;
            $scope.getDevices();
        };

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

        

        var connectDevice = function(address, deviceName){
            $scope.waiting = true;
            var params = {address: address, timeout: BluetoothService.timeout, useResolve: true};

            BluetoothService.connectDevice(params)
            .then(function(connection){
                if(connection.status != 'connected'){
                    $scope.waiting = false;
                    $scope.$emit('notification:error', 'Connecting to device failed.');
                    return false;
                }
                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
                $scope.connected[address] = true;
                console.log("**** Before readFdkData, we want the following targetServices: " + JSON.stringify(targetServices));
                return BluetoothService.readFdkData(address, deviceName, targetServices, measurementName);
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

                console.log('FDK final data is');
                console.log(JSON.stringify(totalData));

                if(!isError){
                     //$scope.$emit('notification:success', 'Service data fetched');
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
            /***** Hard Coding target device for now ****/
            //targetDevices = ['A&D_UC-352BLE'];
            $scope.searching = true;
            BluetoothService.initialize({ request: true }) // plugin initialized
            .then(function(){
                return BluetoothService.searchDevices(targetDevices,targetServices); //search for devices
            })
            .then(function(searchedDevices){
                searchedDevice = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                $scope.devices = searchedDevice;
                $scope.searching = false;
                console.log("*** the searched Devices are: " + JSON.stringify(searchedDevice));
                if($scope.devices.length){
                    console.log("**** There was a matching device");
                    var currentDevice = $scope.devices[0];
                    connectDevice(currentDevice.address, currentDevice.name);
                }
            })
            .catch(function(err){
                $scope.searching = false;
                if(err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                console.log(JSON.stringify(err));
            });
        };


        $scope.getDevices();

    }]);
