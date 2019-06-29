angular.module('synsormed.services.parser.eclipse', [
    'ngCordovaBluetoothLE'
])
.service('synsormed.services.parser.EclipseParserStorageService', [
    'localStorageService',
    function(localStorageService){
        return {
            getDeviesToUnlink: function(){
                return (localStorageService.get('synsormed:eclipse:unlink:devices') || []);
            },
            setDevicesToUnlink: function(address){
                var prevDevices = this.getDeviesToUnlink();
                if(prevDevices.indexOf(address) == -1) prevDevices.push(address);
                return localStorageService.set('synsormed:eclipse:unlink:devices', prevDevices);
            },
            removeUnsubscribedDevice: function(address){
                var devices = this.getDeviesToUnlink();
                var addressIndex = devices.indexOf(address);
                if(addressIndex != -1){
                    devices.splice(devices.indexOf(address), 1);
                    return localStorageService.set('synsormed:eclipse:unlink:devices', devices);
                }
                return false;
            },
            isAvailableToUnlink: function(address){
                var devices = this.getDeviesToUnlink();
                var addressIndex = devices.indexOf(address);
                return (addressIndex != -1);
            },
            getLostDevices: function(){
            	var lostDevices = localStorageService.get('synsormed:eclipse:lost:devices');
            	//console.log("**** about to get lost devices: " + JSON.stringify(lostDevices));
                return (lostDevices || {});
            },
            setLostDevices: function(address, info){
                var prevDevices = this.getLostDevices();
                prevDevices[address] = info;
                console.log('*********Now setting lost device');
                return localStorageService.set('synsormed:eclipse:lost:devices', prevDevices);
            },
            removeLostDevice: function(address){
                var prevDevices = this.getLostDevices();
                if(prevDevices[address]) delete prevDevices[address];
                return localStorageService.set('synsormed:eclipse:lost:devices');
            }
        };
    }
])
.service('synsormed.services.parser.EclipseChart',
[
    '$q',
    '$timeout',
    '$rootScope',
    '$cordovaBluetoothLE',
    'synsormed.services.parser.EclipseParserStorageService',
    function($q, $timeout, $rootScope, $cordovaBluetoothLE, ParserStorageService){

        var eclipseDataString = null;
        var currentDataObject = null;
        var destroyEclipseDataString = null;
        var checkAvailableDevices = null;
        var isPulse = false;


        /**
        *Private Function of service to extract key data from raw data
        * @param data, String  , eclipse device raw data
        * @param extractParam, String  , first parameter to split the eclipse data
        * @param extractParamSec, String  , second parameter to split the eclipse data
        * @return key value
        */

        var extractData = function(data, extractParam, extractParamSec){
            if(!data || !extractParam || !extractParamSec) return null;

            var response = null;
            var readingArray = data.split(extractParam); // split eclipse data using param one
            if(readingArray.length > 1){
                if(extractParam == 'ALM:' && extractParamSec == 'F:'){
                  readingArray = readingArray[1].split(extractParamSec);
                  response = (readingArray.length > 0) ? readingArray[0].substr(3,4) : response;
                }
                else{
                  readingArray = readingArray[1].split(extractParamSec); // split eclipse data using param two
                  response = (readingArray.length > 0) ? readingArray[0].replace(/ /g,'') : response; // remove the white spaces if key data is found
                }
            }

            return response;
        };

        /**
        *Function to parse data for eclipse devices
        * @param stringData, String  , raw data coming from eclipse device
        * @return object, parsed data
        */

        var getFlowSettingValue = function(stringData){
      		var E5 = stringData.split("F")[0];//split stringData to find digit 52
      		var alarm = E5.split("ALM")[1];
      		var hex = alarm.split(" ")[2];
      		var flowsettingValue;
      		var hexToBinary;

      		for(var i=1;i<=hex.length;i++){
      			hexToBinary += '0000';
      		}

      		var binary=(hexToBinary + (parseInt(hex, 16)).toString(2)).substr(-8);//converting hex to binary
      		//pulse mode conversion
      		if(binary[0]==1){
      				binary = binary.substr(1);
      				binary = binary.slice(0, -3);
      		}else{
      				binary = binary.substr(5);
      		}
      		switch(binary){ //using switch to calculate the flow setting value from table
      					case "000": flowsettingValue = "0.5";
      							  break;
      					case "001": flowsettingValue = "1.0";
      					  		  break;
      					case "010": flowsettingValue = "1.5";
      							  break;
      					case "011": flowsettingValue = "2.0";
      					  		  break;
      					case "100": flowsettingValue = "2.5";
      							  break;
      					case "101": flowsettingValue = "3.0";
      					  		  break;
      					case "0000":flowsettingValue = "16mL1.0p";
      							  break;
      					case "0001": flowsettingValue = "24mL1.5";
      					  		  break;
      					case "0010": flowsettingValue = "32mL2.0";
      							  break;
      					case "0011": flowsettingValue = "40mL2.5";
      					  		  break;
      					case "0100": flowsettingValue = "48mL3.0";
      							  break;
      					case "0101": flowsettingValue = "56mL3.5";
      					  		  break;
      					case "0110": flowsettingValue = "64mL4.0";
      					  		  break;
      					case "0111": flowsettingValue = "72mL4.5";
      					  		  break;
      					case "1000": flowsettingValue = "80mL5.0";
      					  		  break;
      					case "1001": flowsettingValue = "88mL5.5";
      					  		  break;
      					case "1010": flowsettingValue = "96mL6.0";
      					  		  break;
      					case "1011": flowsettingValue = "128mL7.0";
      					  		  break;
      					case "1100": flowsettingValue = "160mL8.0";
      					  		  break;
      					case "1101": flowsettingValue = "192mL9.0";
      					  		  break;
      					default: flowsettingValue = "0";
      				}
              if(flowsettingValue.indexOf('mL') != -1){
                    isPulse = true;
          			flowsettingValue = flowsettingValue.split("mL")[1] || 0;
          		}else{
                    isPulse = false;
                }
              return flowsettingValue;
        }

        var getStandbyStatus = function(stringData){

          var E5 = stringData.split("F:")[0];//split stringData to find digit 52
          var alarm = E5.split("ALM:")[1];
          var temphex = alarm.split(" ")[0];
          var hex = temphex.slice(-1); //get the last digit

          var binary=('0000' + (parseInt(hex, 16)).toString(2)).substr(-4);//converting hex to binary

          var standyMode = binary[3] == 1 ? true : false; //compare the last bit to see if standby mode is one

          return standyMode;

        }

        var parse = function(stringData){
            if(!stringData) return false;

            var serialNumber = extractData(stringData, 'E5:', 'Hr:') || null;
            var hours = extractData(stringData, 'Hr:', 'ALM:') || '0.0';
            var alarm = extractData(stringData, 'ALM:', 'F:') || '000000';
            var flow = extractData(stringData, 'F:', '%O2:') || '0.0';
            var purity = extractData(stringData, '%O2:', 'BPM:') || '0.0';
            var respiratoryRate = extractData(stringData, 'BPM:', 'BT:') || '00';
            var batteryStatus = extractData(stringData, 'BT:', 'DATE:') || '0';
            var timestamp = extractData(stringData, 'DATE:', '\r\n') || '0.0';

            //the E5 gives alarm value 00 0000 00.  The actual alarm is based in the middle value. Split by spaces and return second value.
            //console.log("*** The alarm at this point is: " + alarm);
            //var alarmArray = alarm.split(" ");
            //alarm = alarmArray[1] || '0000';
            //var flowSetting = alarmArray[2] || '00';
            var flowSetting = getFlowSettingValue(stringData);
            var standbyStatus = getStandbyStatus(stringData);

            return {
                serialNumber : serialNumber,
                hours : hours,
                alarm : alarm,
                flowSetting : flowSetting,
                flow : flowSetting,
                purity : purity,
                respiratoryRate : respiratoryRate,
                batteryStatus : batteryStatus,
                timestamp : timestamp,
                isPulse : isPulse,
                standbyStatus : standbyStatus
            };
        };

        var writeOnDevice = function(address, service, characteristic, dataString){
            var defer = $q.defer();

            var params = {
                address: address,
                service: service,
                characteristic: characteristic,
                type: 'noResponse',
                value: $cordovaBluetoothLE.bytesToEncodedString($cordovaBluetoothLE.stringToBytes(dataString))
            };

            $cordovaBluetoothLE.write(params)
            .then(defer.resolve, defer.reject)
            .catch(defer.reject);

           return defer.promise;
        };

        var writeDotEight = function(address, service, characteristic){
            return writeOnDevice(address, service, characteristic, '.')
            .then(function(dotRes){
                return writeOnDevice(address, service, characteristic, '8')
            })
            .then(function(response){
                return response;
            })
            .catch(function(err){
                return err;
            });
        };

        var discoverInfo = function(address, serviceId, characteristicId){
            var params = {address: address, timeout: 30000}
            var defer = $q.defer();

            return $cordovaBluetoothLE.discover(params)
            .then(function(servicesObj){
                console.log('******* discover info after reconnectWait ************');
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
            .catch(defer.reject);

            return defer.promise;
        };


        var reconnectWait = function(address, service, characteristic, deviceName){

          var params = {address: address, useResolve: true};
          console.log("*** Going to open a reconnect request and wait for device to come back");
          $cordovaBluetoothLE.reconnect(params)
          .then(function(data){

            console.log("*** Successfully reconnected: " + JSON.stringify(data));
            return discoverInfo(address, service, characteristic)
            .then(function(){
              subscribeToChar(address, service, characteristic, deviceName);
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
            var defer = $q.defer();
            $cordovaBluetoothLE.disconnect({address: address})
            .then(function(obj) {
                defer.resolve(obj);
            }, function(obj) {
                defer.reject(obj);
            })
            .catch(defer.reject)
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
              var fullLengthResponse = 62;
              console.log('*************** About to subscribe device ****************** and service: ' + service + " and char: " + characteristic + " and address: " + address);

              writeDotEight(address,service,'0003CDD2-0000-1000-8000-00805F9B0131');
              $cordovaBluetoothLE.subscribe({
                  address: address,
                  service: service,
                  characteristic: characteristic,
                  timeout: 33000 // 33 seconds
              })
              .then(function(obj){
                  console.log("************Subscribe Auto Unsubscribe : " + JSON.stringify(obj));
              },
              function(obj){
                console.log("*** There was an error with subscription. Message: " + obj.message);
                if(obj.message.includes("disconnected")){ //This means that the subscription stopped because the connection was lost

                      console.log('******************* Device lost *************************');
                      console.log("***** the object: " + JSON.stringify(obj));

                       eclipseDataString = null;
                       ParserStorageService.setLostDevices(obj.address, {service: obj.service, characteristic: obj.characteristic}); // push in lost devices
                       // $rootScope.$emit('c5DeviseLost', [{
                       //     flow: "0.0",
                       //     purity: "0.0",
                       //     timestamp: moment().toISOString()
                       // }]); // upload data with empty data points

                       //$rootScope.eclipseDataString = null; //no latest data;
                       //Tell the rootscope that the eclipse is disconnected so that read.js can change color of status icon
                       //$rootScope.eclipseConnectionStatus = false;

                      //reconnectWait(obj.address, service, characteristic, deviceName);


                    };
                defer.reject;
              },
              function(obj){
              		//console.log("*****the obj after subscribe is: " + JSON.stringify(obj));
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
                          eclipseDataString = null;
                          return false;
                      }

                      if(destroyEclipseDataString) {
                         $timeout.cancel(destroyEclipseDataString);
                         destroyEclipseDataString = null;
                      }
                      //This is the old way that we used to determine if the subscription was broken. New way is to wait for the subscription to error.
                      // destroyEclipseDataString = $timeout(function(){

                      //     console.log('*******************Device lost*************************');
                      //     console.log("***** the object: " + JSON.stringify(obj));

                      //      eclipseDataString = null;
                      //      ParserStorageService.setLostDevices(obj.address, {service: obj.service, characteristic: obj.characteristic}); // push in lost devices
                      //      $rootScope.$emit('eclipseDeviseLost', [{
                      //          flow: "0.0",
                      //          purity: "0.0",
                      //          timestamp: moment().toISOString()
                      //      }]); // upload data with empty data points

                      //      $rootScope.eclipseDataString = null; //no latest data;
                      //      $rootScope.eclipseConnectionStatus = 'disconnected';
                      //      disconnecFromDevice(obj.address);
                      // }, 60000); //empty eclipseDataString if data is not coming from last one minute

                      ParserStorageService.removeLostDevice(obj.address); // pop from lost device if device is subscribed

                       if(obj && obj.status == 'subscribedResult') {
                           //console.log("Got a subscribedResult: " + JSON.stringify(obj));

                           var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
                           var stringversion = String.fromCharCode.apply(null, new Uint8Array(bytes));
                           data = data.concat(stringversion); //Everytime we get a result, add to data string
                           //console.log("Data at this point is: " + data);
                           if(data.indexOf("\r\n") > -1){ //Check to see if the full cycle is complete by looking for /r/n
                               dataArray = data.split("\r\n");
                               for(i=0;i<dataArray.length;i++){ //go through each of the strings
                                   var firstChars = dataArray[i].substr(0,2);
                                   if((dataArray[i].length > fullLengthResponse) && (firstChars == "E5")){ //We have at least 45 characters, this is a full response
                                       console.log("****I think we have a full cycle. The length is: " + dataArray[i].length);
                                       timestamp = new Date();
                                       dataArray[i] = dataArray[i].concat(" DATE:"+timestamp.toISOString()); //Put timestamp with data
                                       console.log("The full cycle is: " + dataArray[i]);
                                       data = ""; //Now that we have our full cycle, clear data variable
                                       eclipseDataString = dataArray[i];
                                       var parsedeclipseDataString = parse(eclipseDataString);
                                       console.log("**** the parsed datastring is: " + JSON.stringify(parsedeclipseDataString));
                                       $rootScope.eclipseConnectionStatus = parsedeclipseDataString.standbyStatus == false ? true : false; //Don't show status as connected if in standby
                                       $rootScope.$emit('checkAlarm', parsedeclipseDataString); // check alarm
                                       $rootScope.eclipseDataString = parsedeclipseDataString;
                                       currentDataObject = obj;
                                       defer.resolve(dataArray[i]);
                                   }
                               }

                           }
                       }
                       else if (obj.status == "subscribed") {
                           console.log('***************Status is subscribed done**************');
                           //Now that subscriptiion is done, you have to send an 8 to the correct char to get the data to start flowing
                           writeDotEight(address,service,'0003CDD2-0000-1000-8000-00805F9B0131');
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

            return defer.promise;
        };

        var getConnectedDeviceData = function(){
            if(eclipseDataString && currentDataObject){
                var parsedData = parse(eclipseDataString);
                return {data: parsedData, info: currentDataObject};
            }
            return false;
        };

        var getEclipseData = function(address, service, characteristic, deviceName){
            var defer = $q.defer();
             if(eclipseDataString && $rootScope.eclipseConnectionStatus){
                 console.log('Device is already subscribed.');
                 defer.resolve(eclipseDataString);
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
             getEclipseData: getEclipseData,
             getConnectedDeviceData: getConnectedDeviceData
        };
    }
]);
