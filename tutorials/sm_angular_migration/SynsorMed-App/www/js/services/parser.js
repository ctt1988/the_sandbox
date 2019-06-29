angular.module('synsormed.services.parser', [
    'ngCordovaBluetoothLE'
])
.service('synsormed.services.parser.ParserStorageService', [
    'localStorageService',
    function(localStorageService){
        return {
            getDeviesToUnlink: function(){
                return (localStorageService.get('synsormed:c5:unlink:devices') || []);
            },
            setDevicesToUnlink: function(address){
                var prevDevices = this.getDeviesToUnlink();
                if(prevDevices.indexOf(address) == -1) prevDevices.push(address);
                return localStorageService.set('synsormed:c5:unlink:devices', prevDevices);
            },
            removeUnsubscribedDevice: function(address){
                var devices = this.getDeviesToUnlink();
                var addressIndex = devices.indexOf(address);
                if(addressIndex != -1){
                    devices.splice(devices.indexOf(address), 1);
                    return localStorageService.set('synsormed:c5:unlink:devices', devices);
                }
                return false;
            },
            isAvailableToUnlink: function(address){
                var devices = this.getDeviesToUnlink();
                var addressIndex = devices.indexOf(address);
                return (addressIndex != -1);
            },
            getLostDevices: function(){
            	var lostDevices = localStorageService.get('synsormed:c5:lost:devices');
            	//console.log("**** about to get lost devices: " + JSON.stringify(lostDevices));
                return (lostDevices || {});
            },
            setLostDevices: function(address, info){
                var prevDevices = this.getLostDevices();
                prevDevices[address] = info;
                console.log('*********Now setting lost device');
                return localStorageService.set('synsormed:c5:lost:devices', prevDevices);
            },
            removeLostDevice: function(address){
                var prevDevices = this.getLostDevices();
                if(prevDevices[address]) delete prevDevices[address];
                return localStorageService.set('synsormed:c5:lost:devices');
            }
        };
    }
])
.service('synsormed.services.parser.Chart',
[
    '$q',
    '$timeout',
    '$rootScope',
    '$cordovaBluetoothLE',
    'synsormed.services.parser.ParserStorageService',
    function($q, $timeout, $rootScope, $cordovaBluetoothLE, ParserStorageService){

        var c5DataString = null;
        var currentDataObject = null;
        var destroyC5DataString = null;
        var checkAvailableDevices = null;


        /**
        *Private Function of service to extract key data from raw data
        * @param data, String  , c5 device raw data
        * @param extractParam, String  , first parameter to split the c5 data
        * @param extractParamSec, String  , second parameter to split the c5 data
        * @return key value
        */

        var extractData = function(data, extractParam, extractParamSec){
            if(!data || !extractParam || !extractParamSec) return null;

            var response = null;
            var readingArray = data.split(extractParam); // split c5 data using param one
            if(readingArray.length > 1){
                readingArray = readingArray[1].split(extractParamSec); // split c5 data using param two
                response = (readingArray.length > 0) ? readingArray[0].replace(/ /g,'') : response; // remove the white spaces if key data is found
            }

            return response;
        };

        /**
        *Function to parse data for c5 devices
        * @param stringData, String  , raw data coming from c5 device
        * @return object, parsed data
        */

        var parse = function(stringData){
            if(!stringData) return false;

            var serialNumber = extractData(stringData, 'SN:', 'Hr:') || null;
            var hours = extractData(stringData, 'Hr:', 'ALM:') || '0.0';
            var alarm = extractData(stringData, 'ALM:', 'F:') || '000000';
            var flow = extractData(stringData, 'F:', '%O2:') || '0.0';
            var purity = extractData(stringData, '%O2:', 'DATE:') || '0.0';
            var timestamp = extractData(stringData, 'DATE:', '\r\n') || '0.0';

            return {
                serialNumber : serialNumber,
                hours : hours,
                alarm : alarm,
                flow : flow,
                purity : purity,
                timestamp : timestamp
            };
        };

        var stringToBytes = function(string){
          var array = new Uint8Array(string.length);
          for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
          }
          return array.buffer;
        };

        var writeOnDevice = function(address, service, characteristic, dataString){
            var defer = $q.defer();


            // if($rootScope.bleDriver == 'don'){

            //   var data = new Uint8Array(1);
            //   data[0] = 0x8;

            //   ble.writeWithoutResponse(address,
            //     service,
            //     characteristic,
            //     stringToBytes(dataString),
            //     function(data){
            //       console.log("*** Wrote to device successfully: " + data);
            //       defer.resolve(data);
            //     },
            //     function(err){
            //       console.log("*** There was an issue writing to device: " + err);
            //       defer.reject(err);
            //     });

            // };

            if($rootScope.bleDriver != 'don'){
              var params = {
                  address: address,
                  service: service,
                  characteristic: characteristic,
                  type: 'noResponse',
                  value: $cordovaBluetoothLE.bytesToEncodedString($cordovaBluetoothLE.stringToBytes(dataString))
              };
              console.log("*** about to write to the device with address: " + address + " and service: " + service + " and characteristic: " + characteristic);
              $cordovaBluetoothLE.write(params)
              .then(defer.resolve, defer.reject)
              .catch(defer.reject);
            }
           return defer.promise;
        };

        var writeDotEight = function(address, service, characteristic){
            console.log("*** Staring the write dot eight function ***");
            return writeOnDevice(address, service, characteristic, '.8')
            // .then(function(dotRes){
            //     console.log("**** Successfully wrote the dot, now writing the 8***");
            //     return writeOnDevice(address, service, characteristic, '8')
            // })
            // .then(function(response){
            //     console.log("***** Successfully wrote the dot and the 8 *****");
            //     return response;
            // })
            .catch(function(err){
                console.log("***** there was an error when trying to write the dot and maybe the eight: " + JSON.stringify(err));
                return err;
            });
        };

        var closeDevice = function(address){

          console.log("*** Inside closeDevice");

          var defer = $q.defer();

          $cordovaBluetoothLE.close({address: address})
          .then(function(obj){

            console.log("*** Successfully closed BLE connection: " + JSON.stringify(obj));
            defer.resolve(obj);

          },
          function(err){

            console.log("*** Failed to close BLE connection: " + JSON.stringify(err));
            defer.reject(err);

          })
          .catch(defer.reject());


          return defer.promise;

        };

        var discoverInfoForIos = function(address, serviceId, characteristicId){
            var params = {address: address, timeout: 10000}
            params.services = ["0003CDD0-0000-1000-8000-00805F9B0131"];
            console.log("***Going to check for isDiscovered");
            $cordovaBluetoothLE.isDiscovered(params)
            .then(function(data){
                console.log("*** The success of isDiscovered msg: " + JSON.stringify(data));

            },
            function(err){
                console.log("*** The fail of isDiscovered msg: " + JSON.stringify(err));

            });
            var defer = $q.defer();
            console.log("*** About to try to find services in IOS with following params: " + JSON.stringify(params));
            $cordovaBluetoothLE.services(params)
            .then(function(serviceObj){
                console.log('*******Services are ************');
                console.log(serviceObj);
                console.log('********************************');
                var services = serviceObj ? serviceObj.services : [];
                if(services.indexOf(serviceId) == -1) return defer.reject({error:'invalidDevice', message:'Service Not Found'});
                params.service = serviceId;

                return $cordovaBluetoothLE.characteristics(params);
            })
            .then(function(characteristicsObj){
                console.log('*******characteristics are ************');
                console.log(characteristicsObj);
                console.log('********************************');
                var characteristics = characteristicsObj ? characteristicsObj.characteristics : [];
                characteristics = _.filter(characteristics, function(characteristic){
                    return (characteristic.uuid == characteristicId);
                });
                if(!characteristics.length) return defer.reject({error:'invalidDevice', message:'Characteristic Not Found'});
                params.characteristic = characteristicId;

                return $cordovaBluetoothLE.descriptors(params);
            })
            .then(function(descriptorObj){
                console.log('***************Descriptors are ****************');
                console.log(JSON.stringify(descriptorObj));
                return defer.resolve({service: serviceId, characteristic: characteristicId});
            })
            .catch(function(err){
                console.log("*** The error when getting services on ios is: " + JSON.stringify(err));
                defer.reject;
            }
                );

            return defer.promise;
        };



        var discoverInfoForAndroid = function(address, serviceId, characteristicId){
            var params = {address: address, timeout: timeout}
            var defer = $q.defer();

            return $cordovaBluetoothLE.discover(params)
            .then(function(servicesObj){
                console.log('*******discover info ************');
                console.log(JSON.stringify(servicesObj));
                console.log('********************************');
                var services = servicesObj ? servicesObj.services : [];
                services = _.filter(services, function(service){
                    return service.uuid == serviceId;
                });
                if(!services.length) return defer.reject({error:'invalidDevice', message:'Service Not Found'});
                var characteristics = services[0].characteristics || [];
                characteristics = _.filter(characteristics, function(characteristic){
                    return characteristic.uuid == characteristicId;
                });
                if(!characteristics.length) return defer.reject({error: 'invalidDevice', message:'Characteristic Not Found'});
                defer.resolve({service: serviceId, characteristic: characteristicId});
            })
            .catch(function(e){
                console.log("**** Issue with discovering services on Android: " + JSON.stringify(e));
                defer.reject(e);
            });

            return defer.promise;
        };




        var discoverInfo = function(address, serviceId, characteristicId){
            //if( window.device.platform.toLowerCase() == 'ios') return discoverInfoForIos(address, services);
      if( window.device.platform.toLowerCase() == 'ios') return discoverInfoForIos(address, serviceId, characteristicId);
            else return discoverInfoForAndroid(address, serviceId, characteristicId);

        };


        var reconnectWait = function(address, service, characteristic, deviceName){

          var params = {address: address, useResolve: true};
          console.log("*** Going to open a reconnect request and wait for device to come back");
          $cordovaBluetoothLE.reconnect(params)
          .then(function(data){

            console.log("*** Successfully reconnected: " + JSON.stringify(data));
            return discoverInfo(address, service, characteristic)
            .then(function(data){
              console.log("*** successfully discoverInfo in reconnectWait: " + JSON.stringify(data));
              subscribeToChar(address, service, characteristic, deviceName);
            })
            .catch(function(e){
              console.log("**** Failed to discoverInfo in reconnectWait: " + JSON.stringify(e));

            });

          },
          function(data){

            console.log("*** Failed reconnecting not-catch: " + JSON.stringify(data));

          })
          .catch(function(err){

            console.log("*** Failed reconnecting: " + JSON.stringify(err));

          });



        };

        var disconnecFromDevice = function(address){

          console.log("*** Inside disconnectfromDeivce");
            var defer = $q.defer();
            $cordovaBluetoothLE.disconnect({address: address})
            .then(function(obj) {
              console.log("*** Successfully disconnected from device: " + JSON.stringify(obj));
              //console.log("*** Now going to try to close Device");
              //closeDevice(address);
              //reconnectWait(address);
                defer.notify(obj);
            }, function(obj) {
              console.log("*** There was an issue disconnecting from device: " + JSON.stringify(obj));
              console.log("*** Now going to try to close Device");
              closeDevice(address);
                defer.reject(obj);
            });
            //.catch(defer.reject)
            return defer.promise;
        };



        var unsubscribeFromDevice = function(address, service, characteristic) {
            var defer = $q.defer();

            var params = {
                address: address,
                service: service,
                characteristic: characteristic,
                timeout: 10000 // max time for unsubscribe is 10 sec
            };

            $cordovaBluetoothLE.unsubscribe(params)
            .then(function(result) {
                console.log('********************unsubscribe success*********************');
                console.log(JSON.stringify(result));
                defer.resolve(result);
            },function(err){
                console.log('******unsubscribe failure');
                console.log(JSON.stringify(err));
                console.log('*******************************************');
                defer.reject(err);
            });

            return defer.promise;
        };

        var checkForUnsubscribe = function(address, service, characteristic){
            var defer = $q.defer();
            if(ParserStorageService.isAvailableToUnlink(address)){
                unsubscribeFromDevice(address, service, characteristic)
                .then(function(){
                    return disconnecFromDevice(address); // disconnect from device
                })
                .then(function(){
                    ParserStorageService.removeUnsubscribedDevice(address); // remove from storage after unsubscribe
                    defer.resolve({status: 'unsubscribed'});
                })
                .catch(defer.reject);
            }
            else{
                defer.resolve({status: 'subscribed'});
            }

            return defer.promise;
        };

        var subscribeToChar = function(address, service, characteristic, deviceName){
              var defer = $q.defer();
              var response = [];
              var data = "";
              var dataArray = [];
              var timestamp="";
              var fullLengthResponse = 45;
              console.log('*************** About to subscribe device ****************** and service: ' + service + " and char: " + characteristic + " and address: " + address);

              if($rootScope.bleDriver != 'don'){


                writeDotEight(address,service,'0003CDD2-0000-1000-8000-00805F9B0131');
                $cordovaBluetoothLE.subscribe({
                    address: address,
                    service: service,
                    characteristic: characteristic,
                    timeout: 33000 // 33 seconds
                })
                .then(null,
                  function(obj){
                    console.log("*** There was an error with subscription. Message: " + obj.message);
                    $rootScope.c5DataString = null; //no latest data;
                     $rootScope.c5ConnectionStatus = false; //Tell the rootscope that the c5 is disconnected so that read.js can change color of status icon
                     c5DataString = null;

                    if(obj.message.includes("disconnected")){ //This means that the subscription stopped because the connection was lost

                      console.log('******************* Device lost ****************: ' + JSON.stringify(obj));

                       ParserStorageService.setLostDevices(obj.address, {service: obj.service, characteristic: obj.characteristic}); // push in lost devices
                       // $rootScope.$emit('c5DeviseLost', [{
                       //     flow: "0.0",
                       //     purity: "0.0",
                       //     timestamp: moment().toISOString()
                       // }]); // upload data with empty data points

                    };

                    defer.reject;
                },
                function(obj){
                		//console.log("***** Received subscription data: " + JSON.stringify(obj));
                    checkForUnsubscribe(obj.address, obj.service, obj.characteristic)
                    .then(function(result){

                      if($rootScope.allAvailableDevices.indexOf(deviceName) == -1){
                         $rootScope.allAvailableDevices.push(deviceName);
                      }
                      if(checkAvailableDevices){
                        $timeout.cancel(checkAvailableDevices);
                        checkAvailableDevices = null;
                      }
                      checkAvailableDevices = $timeout(function(){
                        var index = $rootScope.allAvailableDevices.indexOf(deviceName);
                        if(index != -1){
                          $rootScope.allAvailableDevices.splice(index,1);
                        }
                      }, 20000);

                        if(result && result.status != 'subscribed'){
                            console.log('*******Device is already unsubscribed. cannot proceed now');
                            c5DataString = null;
                            return false;
                        }

                        if(destroyC5DataString) {
                           $timeout.cancel(destroyC5DataString);
                           destroyC5DataString = null;
                        }

                        /*****************  Disconnect Function for when C5 cannot be found ********/
                        // destroyC5DataString = $timeout(function(){

                        //     console.log('******************* Device lost *************************');
                        //     console.log("***** the object: " + JSON.stringify(obj));

                        //      c5DataString = null;
                        //      ParserStorageService.setLostDevices(obj.address, {service: obj.service, characteristic: obj.characteristic}); // push in lost devices
                        //      $rootScope.$emit('c5DeviseLost', [{
                        //          flow: "0.0",
                        //          purity: "0.0",
                        //          timestamp: moment().toISOString()
                        //      }]); // upload data with empty data points

                        //      $rootScope.c5DataString = null; //no latest data;
                        //      //Tell the rootscope that the c5 is disconnected so that read.js can change color of status icon
                        //      $rootScope.c5ConnectionStatus = 'disconnected';

                        //       return disconnecFromDevice(obj.address)
                        //       .then(function(){
                        //         console.log("*** the disconnect sent a resolve");
                        //       },null,
                        //       function(){
                        //         console.log("*** the disconnect sent a notify. Now ok to issue reconnect wait");
                        //         reconnectWait(obj.address, service, characteristic, deviceName);
                        //       });

                        // }, 90000); //empty c5DataString if data is not coming from last 90 seconds. When the C5 is powered off, it takes between 60-70 seconds for the BT card to totally shut down.


                        ParserStorageService.removeLostDevice(obj.address); // pop from lost device if device is subscribed

                         if(obj && obj.status == 'subscribedResult') {
                             //console.log("*** Got a subscribedResult: " + JSON.stringify(obj));
                             $rootScope.c5ConnectionStatus = true;
                             var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                             var stringversion = String.fromCharCode.apply(null, new Uint8Array(bytes));
                             data = data.concat(stringversion); //Everytime we get a result, add to data string
                             //console.log("Data at this point is: " + data);
                             if(data.indexOf("\r\n") > -1){ //Check to see if the full cycle is complete by looking for /r/n
                                 dataArray = data.split("\r\n");
                                 for(i=0;i<dataArray.length;i++){ //go through each of the strings
                                     var firstChars = dataArray[i].substr(0,2);
                                     if((dataArray[i].length > fullLengthResponse) && (firstChars == "SN")){ //We have at least 45 characters, this is a full response
                                         console.log("****I think we have a full cycle before adding date. The length is: " + dataArray[i].length);
                                         timestamp = new Date();
                                         dataArray[i] = dataArray[i].concat(" DATE:"+timestamp.toISOString()); //Put timestamp with data
                                         console.log("The full cycle is: " + dataArray[i]);
                                         data = ""; //Now that we have our full cycle, clear data variable
                                         c5DataString = dataArray[i];
                                         $rootScope.$emit('checkAlarm', parse(c5DataString)); // check alarm
                                         $rootScope.c5DataString = parse(c5DataString);
                                         currentDataObject = obj;
                                         defer.resolve(dataArray[i]);
                                     }
                                 }

                             }
                         }
                         else if (obj.status == "subscribed") {
                             console.log('*************** Status is: subscription is now started **************');
                             //Now that subscriptiion is done, you have to send an 8 to the correct char to get the data to start flowing
                             //writeDotEight(address,service,'0003CDD2-0000-1000-8000-00805F9B0131');
                         }
                         else {
                             console.log('**********************Unexpected subscribed status');
                         }
                    })
                    .catch(function(err){
                        console.log('Error During Unsubscribe check');
                        console.log(JSON.stringify(err));
                        console.log('******************************');
                        defer.reject(err);
                    });
              });
            }
            return defer.promise;
        };

        var getConnectedDeviceData = function(){
            if(c5DataString && currentDataObject){
                var parsedData = parse(c5DataString);
                return {data: parsedData, info: currentDataObject};
            }
            return false;
        };

        var getC5Data = function(address, service, characteristic, deviceName){
            var defer = $q.defer();
             if(c5DataString && $rootScope.c5ConnectionStatus){
                 console.log('Device is already subscribed.');
                 defer.resolve(c5DataString);
             }
             else{
                 subscribeToChar(address, service, characteristic, deviceName)
                 .then(defer.resolve)
                 .catch(function(err){
                     console.log('Subscribe error is ');
                     console.log(JSON.stringify(err));
                     defer.reject(err) ;
                 });
             }

            return defer.promise;
        };



        return {
             parse: parse,
             subscribeToChar: subscribeToChar,
             writeDotEight: writeDotEight,
             getC5Data: getC5Data,
             getConnectedDeviceData: getConnectedDeviceData
        };
    }
]);
