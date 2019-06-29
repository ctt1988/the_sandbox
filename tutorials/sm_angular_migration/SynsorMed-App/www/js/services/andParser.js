angular.module('synsormed.services.andParser', [
    'ngCordovaBluetoothLE'
])
.service('synsormed.services.andParser.And', [
    '$q',
    '$timeout',
    '$rootScope',
    '$cordovaBluetoothLE',
    function($q, $timeout, $rootScope, $cordovaBluetoothLE){

        var dataPoints = [];

        var getAvgPoints = function(){
            var spoSum = 0, pulseSum = 0, weightSum = 0;
            var dataLength = dataPoints.length;

            dataPoints.forEach(function(dataPoint){
                // spoSum = spoSum + parseFloat(dataPoint.spo2);
                // pulseSum = pulseSum + parseFloat(dataPoint.pulse);
                weightSum = weightSum + parseFloat(dataPoint.weight);
            });
            console.log("*** We think the avg weight is: " + Math.round(weightSum/dataLength) );
            return {
                // spo2: Math.round(spoSum/dataLength),
                // pulse: Math.round(pulseSum/dataLength)
                weight: Math.round(weightSum/dataLength)
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

        var readChar = function(address, service, characteristic, deviceName){
            var defer = $q.defer();
            console.log("*** I am about to try to read a characteristic");
            var timestamp = (new Date()).toISOString();
            defer.resolve({
                            weight: [{
                                quantity: 170,
                                endDate: timestamp
                            }]
                        });
            // $cordovaBluetoothLE.read({
            //     address: address,
            //     service: service,
            //     characteristic: characteristic
            // })
            // .then(function(successObj){
            //     console.log("**** succesfully read char: " + JSON.stringify(successObj));
            //     var bytes = $cordovaBluetoothLE.encodedStringToBytes(successObj.value);
            //     console.log('************ read data ***************');
            //     console.log(JSON.stringify(bytes));
            //     defer.resolve("170");
            // },function(failureObj){
            //     console.log("*** failed to read char: " + JSON.stringify(failureObj));
            // });
            return defer.promise;
        }

        function toHexString(byteArray) {
            return Array.from(byteArray, function(byte) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join('')
        }

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
                console.log('*********And get subscribedResult');
                console.log(JSON.stringify(obj));
                if(!obj || obj.status != 'subscribedResult') return;

                var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                console.log('************getting data***************');
                console.log(JSON.stringify(bytes));
                console.log("*** the toHexString is: " + toHexString(bytes));
                bytes = toHexString(bytes);


                $rootScope.noninDataLength = dataPoints.length;
                if(dataPoints.length == 1){
                    var timestamp = (new Date()).toISOString();
                    var avgPoint = getAvgPoints(dataPoints);
                    console.log('Got all And data now unsubscribing');
                    unsubscribeFromDevice(address, service, characteristic)
                    .then(function(){
                        console.log('Unsubscribed from And now resolving');
                        dataPoints = [];
                        defer.resolve({
                            weight: [{
                                quantity: avgPoint.weight,
                                endDate: timestamp
                            }]

                        });
                    })
                    .catch(function(err){
                        console.log('And unsubscribe err');
                        console.log(JSON.stringify(err));
                        defer.reject(err);
                    });

                }
                else{
                    console.log("*** hex weight is: " + bytes[4] + bytes[5] + bytes[2] + bytes[3]);
                    var hexString = bytes[4] + bytes[5] + bytes[2] + bytes[3];
                    var floatWeight = parseInt(hexString,16)/10;
                    console.log("**** the float weight is: " + floatWeight);
                    
                    // dataPoints.push({
                    //     weight: bytes[3] + bytes[2]
                    // });
                    var timestamp = (new Date()).toISOString();
                    // var avgPoint = getAvgPoints(dataPoints);
                    console.log('Got all And data now unsubscribing');
                    unsubscribeFromDevice(address, service, characteristic)
                    .then(function(){
                        console.log('Unsubscribed from And now resolving');
                        //dataPoints = [];
                        defer.resolve({
                            weight: [{
                                quantity: floatWeight,
                                endDate: timestamp
                            }]

                        });
                    })
                    .catch(function(err){
                        console.log('And unsubscribe err');
                        console.log(JSON.stringify(err));
                        defer.reject(err);
                    });
                }
            })
            .catch(defer.reject);
            return defer.promise;
        };

        return {
            subscribeToChar: subscribeToChar,
            readChar: readChar
        };
    }
]);
