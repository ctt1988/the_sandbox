angular.module('synsormed.services.cmiParser', [
    'ngCordovaBluetoothLE'
])
.service('synsormed.services.cmiParser.CMI', [
    '$q',
	'$timeout',
	'$rootScope',
    '$cordovaBluetoothLE',
    function($q, $timeout, $rootScope, $cordovaBluetoothLE){

		var dataPoints = [];
    var rejectTimeout = null;
    var sdkMeasurements = ["oxygen saturation"];

		    var getAvgPoints = function(){
            var spoSum = 0;

            dataPoints.forEach(function(dataPoint){
                spoSum = spoSum + parseFloat(dataPoint.spo2);
            });

            return {
                spo2: Math.round(spoSum/dataPoints.length)
            }
        };

        var disconnectFromDevice = function(address, service, characteristic, measurementName){
          var defer = $q.defer();

            if(sdkMeasurements.includes(measurementName)){
              console.log("*** About to try to disconnect via SDK");
              var success = function(data){
                defer.resolve(data);
              }

              var fail = function(data){
                defer.reject(data);
              }

              sdkPlugin.CMI_POD1W_Disconnect(success,fail);

            }else{
              $cordovaBluetoothLE.disconnect({
                  address: address
              })
              .then(function(result) {
                  defer.resolve(result);
              },function(err){
                  defer.reject(err);
              });
            }

            return defer.promise;

        }

        var unsubscribeFromDevice = function(address, service, characteristic, measurementName) {
            var defer = $q.defer();

            if(sdkMeasurements.includes(measurementName)){
              console.log("*** About to try to unsubscribe via SDK");
              var success = function(unsubscribeData){
                return disconnectFromDevice(address, service, characteristic, measurementName)
                .then(function(disconnectData){
                  console.log("*** Successfully disconnected and unsubscribed from CMI_POD1W_Unsubscribe");
                  defer.resolve(unsubscribeData);
                })
                .catch(function(err){
                  defer.reject(err);
                })
                
              }

              var fail = function(data){
                defer.reject(data);
              }

              sdkPlugin.CMI_POD1W_Unsubscribe(success,fail);

            }else{
              $cordovaBluetoothLE.unsubscribe({
                  address: address,service: service,
                  characteristic: characteristic, timeout: 10000
              })
              .then(function(result) {
                  defer.resolve(result);
              },function(err){
                  defer.reject(err);
              });
            }

            return defer.promise;
        };

        var subscribeToChar = function(address, service, characteristic, measurementName){
            var weightTimeout;
            var receivedData = null;
            var defer = $q.defer();
            measurementName = measurementName ? measurementName.toLowerCase() : false;
            console.log('measurementName is '+measurementName);

            //At this point, we need to decide to subscribe via BLE or SDK plugin
            if(sdkMeasurements.includes(measurementName)){
              //The CMI type device is one of the SDK type
              console.log("*** The CMI measurementName is of SDK type so subscribing via SDK");
              var success = function(data){
                console.log("*** the data we are getting back from CMI_POD1W_Subscribe is: " + data);
                receivedData = true;
                var dataToresolve = false;
                var timestamp = (new Date()).toISOString();
                //create a JSON object from data received
                data = JSON.parse(data);
                if(dataPoints.length >= 4){
                  var avgPoint = getAvgPoints(dataPoints);   
                  dataToresolve = {
                    spo2: [{
                      quantity: avgPoint.spo2, endDate: timestamp
                    }],
                    pulse: [{
                      quantity: data.pulse, endDate: timestamp
                    }]
                  };
                  dataPoints = [];
                }
                else{
                 if(data.SpO2 != 0) {
                    dataPoints.push({ spo2: data.SpO2 });
                    console.log("The datapoints at this point is: " + JSON.stringify(dataPoints));
                  }
                }
                if(dataToresolve){
                  console.log('************Data to resolve is************* ');
                  console.log(JSON.stringify(dataToresolve));
                  console.log('Got all SPO2 SynsorTrack data now unsubscribing');
                  unsubscribeFromDevice(address, service, characteristic, measurementName)
                  .then(function(){
                    console.log('Unsubscribed from SynsorTrack now resolving');
                    defer.resolve(dataToresolve);
                    dataToresolve = false;
                  })
                  .catch(function(err){
                    console.log('SynsorTrack unsubscribe err '+ JSON.stringify(err));
                    defer.reject(err);
                  });
                }
              }//End of Successfunction

              var fail = function(data){
                console.log("*** The failure from CMI_POD1W_Subscribe: " + data);
              }

              sdkPlugin.CMI_POD1W_Subscribe(success, fail);

              var checkingForData = $timeout(function(){
                if(receivedData){

                }else{
                  defer.reject("Timout waiting for subscription data from CMI_POD1W_Subscribe");
                }
              },5000)

            }else{
              $cordovaBluetoothLE.subscribe({
                  address: address,
                  service: service,
                  characteristic: characteristic,
                  timeout: 120000, // 120 seconds
                  subscribeTimeout: 120000
              })
              .then(function(obj){}, defer.reject, function(obj){
                if(rejectTimeout)  $timeout.cancel(rejectTimeout);

                rejectTimeout = $timeout(function(){
                  unsubscribeFromDevice(address, service, characteristic, measurementName)
                  .then(function(){
                    defer.reject({timeout: true});
                    dataToresolve = false;
                  })
                  .catch(defer.reject);
                  }, 60000); // reject if no response from 60s

                console.log('*************************Now getting thigs***************************');
                console.log(JSON.stringify(obj));
                console.log('********************************************');
                //Don't print the result each time because the PC-100 sends waveform info for SPO2 at 50Hz.
                if(!obj || obj.status != 'subscribedResult') return;
                var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                console.log("The bytes at this point is: " + JSON.stringify(bytes));
                $rootScope.SynsorTrackDataLength = dataPoints.length;
                var commandToken = bytes[2], commandLength=bytes[3] ,contentType = bytes[4];
                var timestamp = (new Date()).toISOString();
                var dataToresolve = false;

                console.log("The command Token is: " + commandToken);
                console.log("The commandLength is: " + commandLength);
                console.log("The contentType is: " + contentType);
                //This means BP is ready
                if(measurementName && (measurementName == 'blood pressure' || measurementName == 'heartrate') && commandToken == 67 && commandLength == 7 && contentType == 1){
                  console.log("*******The BP is finished!!! data="+ bytes[6] +"/"+ bytes[8]);
                  dataToresolve = {
                    'blood pressure':[{
                        quantity: bytes[6] + '/' + bytes[8], endDate: timestamp
                    }],
                      pulse: [{
                        quantity: bytes[9], endDate: timestamp
                      }]
                  };
                }

                else if(measurementName && measurementName == 'weight'){
                  console.log('Need to take data from bytes');
                  console.log(JSON.stringify(bytes));
                  console.log('****************************');
                  if(weightTimeout) clearTimeout(weightTimeout); //Stop the old timeout because we have a new datapoint
                  weightTimeout = null;
                  var temp1 = bytes[1] & 0x3f;
                  var temp2 = bytes[2] & 0xff;
                  var kgWeight =  ((temp1 << 8) + temp2)/10;
                  var lbWeight = kgWeight / 0.453592;
                  lbWeight = lbWeight.toFixed(1);
                  console.log('****LB weight is: ' + lbWeight);
                  weightTimeout = setTimeout(function(){
                    console.log("did't got readings. Now resolving final data");
                    console.log('final weight is '+lbWeight);
                    dataToresolve = {
                      weight: [{
                        quantity: lbWeight, endDate: timestamp
                      }]
                    }
                    if(rejectTimeout)  $timeout.cancel(rejectTimeout);
                    unsubscribeFromDevice(address, service, characteristic, measurementName)
                    .then(function(){
                      console.log('Unsubscribed from SynsorTrack now resolving');
                      defer.resolve(dataToresolve);
                      dataToresolve = false;
                    })
                    .catch(function(err){
                      console.log('SynsorTrack unsubscribe err '+ JSON.stringify(err));
                      defer.reject(err);
                    });

                  }, 500);
                }
                //This means SPO2 data is ready
                else if (measurementName && (measurementName == 'oxygen saturation' || measurementName == 'heartrate') && commandToken == 83){
                  if(dataPoints.length >= 3){
                    var avgPoint = getAvgPoints(dataPoints);
                    console.log('Got all SPO2 SynsorTrack data now unsubscribing');
                    dataToresolve = {
                      spo2: [{
                        quantity: avgPoint.spo2, endDate: timestamp
                      }],
                      pulse: [{
                        quantity: bytes[6], endDate: timestamp
                      }]
                    };
                    dataPoints = [];
                  }
                  else{
                   if(bytes[5] != 0) {
                      dataPoints.push({ spo2: bytes[5] });
                      console.log("The datapoints at this point is: " + JSON.stringify(dataPoints));
                    }
                  }
                }

                else if(measurementName && measurementName == 'glucose' && commandToken == 115){
                  console.log('*****************Here glucose command found************************');
                  console.log(JSON.stringify(bytes));
                  dataToresolve = {
                    glucose: [{
                      quantity: bytes[7], endDate: timestamp
                    }]
                  };
                }

                if(dataToresolve){
                  console.log('************Data to resolve is************* ');
                  console.log(JSON.stringify(dataToresolve));
                  if(rejectTimeout) $timeout.cancel(rejectTimeout); //Stop the reject timeout
                  if(weightTimeout) clearTimeout(weightTimeout); //Stop the old timeout
                  unsubscribeFromDevice(address, service, characteristic, measurementName)
                  .then(function(){
                    console.log('Unsubscribed from SynsorTrack now resolving');
                    defer.resolve(dataToresolve);
                    dataToresolve = false;
                  })
                  .catch(function(err){
                    console.log('SynsorTrack unsubscribe err '+ JSON.stringify(err));
                    defer.reject(err);
                  });
                }
              })
              .catch(defer.reject);

            }

            return defer.promise;
        };

        return {
            subscribeToChar: subscribeToChar
        };
    }
]);
