angular.module('synsormed.services.noninParser', [
    'ngCordovaBluetoothLE'
])
.service('synsormed.services.noninParser.Nonin', [
    '$q',
    '$timeout',
    '$rootScope',
    '$cordovaBluetoothLE',
    function($q, $timeout, $rootScope, $cordovaBluetoothLE){

        var dataPoints = [];

        var getAvgPoints = function(){
            var spoSum = 0, pulseSum = 0;
            var dataLength = dataPoints.length;

            dataPoints.forEach(function(dataPoint){
                spoSum = spoSum + parseFloat(dataPoint.spo2);
                pulseSum = pulseSum + parseFloat(dataPoint.pulse);
            });

            return {
                spo2: Math.round(spoSum/dataLength),
                pulse: Math.round(pulseSum/dataLength)
            }
        };

        var unsubscribeFromDevice = function(address, service, characteristic) {
            var defer = $q.defer();
            $cordovaBluetoothLE.unsubscribe({
                address: address,service: service,
                characteristic: characteristic, timeout: 10000
            })
            .then(function(result) {
                defer.resolve(result);
            },function(err){
                defer.reject(err);
            });
            return defer.promise;
        };

        var subscribeToChar = function(address, service, characteristic, deviceName){
            var defer = $q.defer();
            console.log("*** the service I am looking for: " + service);
            console.log("*** the characteristic I am looking for: " + characteristic);
            $cordovaBluetoothLE.subscribe({
                address: address,
                service: service,
                characteristic: characteristic,
                timeout: 20000, // 20 seconds
                subscribeTimeout: 20000
            })
            .then(function(obj){}, defer.reject, function(obj){
                console.log('*********Nonin get subscribedResult');
                console.log(JSON.stringify(obj));
                if(!obj || obj.status != 'subscribedResult') return;

                var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                console.log('************getting data***************');
                console.log(JSON.stringify(bytes));
                $rootScope.noninDataLength = dataPoints.length;
                if(dataPoints.length == 5){
                    var timestamp = (new Date()).toISOString();
                    var avgPoint = getAvgPoints(dataPoints);
                    console.log('Got all nonin data now unsubscribing');
                    unsubscribeFromDevice(address, service, characteristic)
                    .then(function(){
                        console.log('Unsubscribed from Nonin now resolving');
                        dataPoints = [];
                        defer.resolve({
                            spo2: [{
                                quantity: avgPoint.spo2,
                                endDate: timestamp
                            }],
                            pulse: [{
                                quantity: avgPoint.pulse,
                                endDate: timestamp
                            }],

                        });
                    })
                    .catch(function(err){
                        console.log('Nonin unsubscribe err');
                        console.log(JSON.stringify(err));
                        defer.reject(err);
                    });

                }
                else{
                    dataPoints.push({
                        spo2: bytes[7],
                        pulse: bytes[8] + bytes[9]
                    })
                }
            })
            .catch(defer.reject);
            return defer.promise;
        };

        return {
            subscribeToChar: subscribeToChar
        };
    }
]);
