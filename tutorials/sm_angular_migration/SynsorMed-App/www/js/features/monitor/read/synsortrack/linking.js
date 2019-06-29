angular.module('synsormed.controllers.monitor.synsortrack.linking', [
    'ngCordovaBluetoothLE',
    'synsormed.services.awake',
    'synsormed.services.bluetooth'
])
.controller('bluetoothSynsorTrackLinkingDeviceController', [
    '$scope',
    '$modalInstance',
    'deviceName',
    '$cordovaBluetoothLE',
    'synsormed.services.awake.awakeService',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    function($scope, $modalInstance, deviceName, $cordovaBluetoothLE, awakeService, BluetoothService, BluetoothStorageService){
        console.log('555555555555555555555555555555555')
        $scope.deviceName = deviceName;
        if(deviceName == 'PC-100')
           $scope.instructionMsg = 'Please wait while we gather information from your device.';
    }
]);
