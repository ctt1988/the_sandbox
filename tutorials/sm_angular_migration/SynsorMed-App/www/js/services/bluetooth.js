angular.module('synsormed.services.bluetooth', [
    'ngCordovaBluetoothLE',
    'LocalStorageModule',
    'synsormed.services.parser',
    'synsormed.services.cmiParser',
    'synsormed.services.noninParser',
    'synsormed.services.andParser',
    'synsormed.services.fdkParser'
])
.service('synsormed.services.bluetooth.BluetoothStorageService', [
    'localStorageService',
    function(localStorageService){
        return {
            getConnectedDevices: function(){
                return ( localStorageService.get('connectedBleDevices') || {} );
            },
            setNewConnectedDevice: function(address, data){
                var connectedDevices = this.getConnectedDevices();
                connectedDevices[address] = data || true;
                return localStorageService.set('connectedBleDevices', connectedDevices);
            },
            popNewConnectedDevice: function(address){
                var devices = this.getConnectedDevices();
                var addressIndex = devices.indexOf(address);
                if(devices.length && addressIndex != -1){
                    devices.splice(devices.indexOf(address), 1);
                    return localStorageService.set('connectedBleDevices', devices);
                }
                return false;
            },
            getSubscribedDevices: function(){
                return (localStorageService.get('synsormed:c5:connected:devices') || []);
            },
            setSubscribedDevices: function(address){
                var prevDevices = this.getSubscribedDevices();
                if(prevDevices.indexOf(address) == -1) prevDevices.push(address);
                return localStorageService.set('synsormed:c5:connected:devices', prevDevices);
            },
            popSubscribedDevices: function(address){
                var devices = this.getSubscribedDevices();
                var addressIndex = devices.indexOf(address);
                if(devices.length && addressIndex != -1){
                    devices.splice(devices.indexOf(address), 1);
                    return localStorageService.set('synsormed:c5:connected:devices', devices);
                }
                return false;
            }
        };
    }
])
.service('synsormed.services.bluetooth.BluetoothService', [
    '$q',
    '$cordovaBluetoothLE',
    'synsormed.services.parser.Chart',
    'synsormed.services.cmiParser.CMI',
    'synsormed.services.noninParser.Nonin',
    'synsormed.services.andParser.And',
    'synsormed.services.fdkParser.Fdk',
    'synsormed.services.bluetooth.BluetoothStorageService',
    function($q, $cordovaBluetoothLE, chartParser, CMI, Nonin, And, Fdk, BluetoothStorageService){
        var timeout = 30000; //30 seconds
        //These are the device names that need to coneect via SDK plugin instead of BLE plugin
        var sdkDeviceNames = ["POD"];

        var discoverInfoForIos = function(address, serviceId, characteristicId){
            var params = {address: address, timeout: timeout}
            var defer = $q.defer();
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
				   console.log("*** Error with discovering services on IOS: " + JSON.stringify(err));
				   defer.reject(err);
				   
				   });
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
            .catch(defer.reject);
            return defer.promise;
        };




        var discoverInfo = function(address, serviceId, characteristicId){
            //if( window.device.platform.toLowerCase() == 'ios') return discoverInfoForIos(address, services);
			if( window.device.platform.toLowerCase() == 'ios') return discoverInfoForIos(address, serviceId, characteristicId);
            else return discoverInfoForAndroid(address, serviceId, characteristicId);
        };



        var readData = function(address, deviceName, targetServices){
            var defer = $q.defer();
            var promises = [];
            _.forEach(targetServices, function(targetService){
                var disCoveredInfo = null;
                var targetServiceId = targetService.uuid;
                var subscribeCharId = targetService.characteristics.subscribe;
                var characteristicId = targetService.characteristics.read;
                var promise = discoverInfo(address, targetServiceId, characteristicId)
                .then(function(info){
                    disCoveredInfo = info;
                    return chartParser.getC5Data(address, targetServiceId, subscribeCharId);
                })
                .then(function(subscribeResponse){
                    console.log('***********subscribed response is given below***********');
                    console.log(JSON.stringify(subscribeResponse));
                    console.log('**********************************************');
                    BluetoothStorageService.setSubscribedDevices(address); // set subscribed device into local storage
                    return subscribeResponse;
                });
                promises.push(promise);
            });
            window.Q.allSettled(promises)
            .then(defer.resolve)
            .catch(function(err){
                console.log(JSON.stringify(err));
                defer.reject({error:'invalidDevice', message:'Invalid C5 Device'});
            });
            return defer.promise;
        };

        var readDeviceData = function(deviceSubscriber, address, deviceName, targetServices, measurementName){
            var defer = $q.defer();
            var promises = [];
            _.forEach(targetServices, function(targetService){
                console.log("*** the current target service is: " + JSON.stringify(targetService));
                var targetServiceId = targetService.uuid;
                var subscribeCharId = targetService.characteristics.subscribe;
                var characteristicId = targetService.characteristics.read;
					  console.log("*** device name is: " + deviceName);
					  if(deviceName && sdkDeviceNames.includes(deviceName)){
					  //If using SDK, don't discoverInfo. It's taken care of by SDK
					  var promise = deviceSubscriber(address, targetServiceId, subscribeCharId, measurementName)
					  .then(function(subscribeResponse){
							return subscribeResponse;
							})
                      .catch(function(err){
                        defer.reject(err);
                      });
					  }else{
					  var promise = discoverInfo(address, targetServiceId, characteristicId)
					  .then(function(info){
							return deviceSubscriber(address, targetServiceId, subscribeCharId, measurementName);
							})
					  .then(function(subscribeResponse){
							return subscribeResponse;
							})
                      .catch(function(err){
                        defer.reject(err);
                      });
					  }
					  
                promises.push(promise);
            });
            window.Q.allSettled(promises)
            .then(function(data){
                //defer.resolve(data[0].value);
                defer.resolve(data);
            })
            .catch(function(err){
                defer.reject(err);
            });
            return defer.promise;
        };

        var readSynsorTrackData = function(address, deviceName, targetServices, measurementName){
             return readDeviceData(CMI.subscribeToChar, address, deviceName, targetServices, measurementName);
        };

        var readNoninData = function(address, deviceName, targetServices){
             return readDeviceData(Nonin.subscribeToChar, address, deviceName, targetServices);
        };

        var readAndData = function(address, deviceName, targetServices){
             return readDeviceData(And.subscribeToChar, address, deviceName, targetServices);
             //return readDeviceData(And.readChar, address, deviceName, targetServices);
        };

        var readFdkData = function(address, deviceName, targetServices, measurementName){
             return readDeviceData(Fdk.subscribeToChar, address, deviceName, targetServices, measurementName);
             //return readDeviceData(And.readChar, address, deviceName, targetServices);
        };

        var initialize = function(params){
            var defer = $q.defer();
            $cordovaBluetoothLE.initialize(params)
            .then(null, defer.reject, defer.resolve)
            .catch(defer.reject);
            return defer.promise;
        };



        var startScan = function(params, targetDevices, deviceNeeded){
            var defer = $q.defer();
            var devices = [];
            var name = "";
            params.scanTimeout = params.scanTimeout || timeout;

         	$cordovaBluetoothLE.startScan(params)
            .then(function(obj){
            	console.log("****part of the scan: " + JSON.stringify(obj));
                defer.resolve(devices);
            },
            function(obj){
                defer.reject(obj);
            },
            function(obj){
                if(obj && obj.status == 'scanResult') {
                    console.log('******************Found Device**********************');
                    console.log(JSON.stringify(obj));
                    console.log('targetDevices', targetDevices.length);
                    if(!targetDevices.length){
                        return devices.push(obj); // push all devices if there is no target device
                    }

                    for(var index = 0; index < targetDevices.length; index++){
                        var targetDevice = targetDevices[index];
                        if(obj.name) name = obj.name.toString();
                        if(obj.name && name.indexOf(targetDevice) > -1){
                            console.log('************Found target device*************');
                            $cordovaBluetoothLE.stopScan()
                            .then(
                                function(success){
                                    console.log("*** Successfully stopped scan: " + JSON.stringify(success));
                                    devices.push(obj);
                                    defer.resolve(devices);
                                }, 
                                function(error){
                                    console.log("*** Error with stopping Scan: " + JSON.stringify(error));
                                    defer.reject(error);
                                }
                            );
                            //devices.push(obj); // push only target devices;
                            //if(deviceNeeded && deviceNeeded == devices.length){
                                //defer.resolve(devices); //resolve because you've found your target device
                            //}
                            break;
                        }
                    }
                }
            });

            return defer.promise;
        };



        var searchDevicesOnAndroid = function(params, targetDevices, deviceNeeded){
            return $cordovaBluetoothLE.isLocationEnabled()
            .then(function(location){
                if(location.isLocationEnabled){
                    return $cordovaBluetoothLE.hasPermission();
                }
                else{
                    return $cordovaBluetoothLE.requestLocation()
                    .then(function(){
                        return $cordovaBluetoothLE.hasPermission();
                    });
                }
            })
            .then(function(permission){
                if(permission.hasPermission){
                    return startScan(params, targetDevices, deviceNeeded);
                }
                else{
                    return $cordovaBluetoothLE.requestPermission()
                    .then(function(){
                        return startScan(params, targetDevices, deviceNeeded);
                    });
                }
            });
        };



        var searchDevices = function(targetDevices, targetServices, deviceNeeded){
            var defer = $q.defer();
            var params = { allowDuplicates: false, scanTimeout: 60000 };
        	var connectedParams = {
  				services: [ targetServices[0].uuid ]
			};

			var totalDevices=[];
            var deviceAlreadyFound = false;

            console.log("***targetdevice is: " + JSON.stringify(targetDevices));
            console.log('***targetServices is: ' + JSON.stringify(targetServices));

            if(window.device.platform.toLowerCase() == 'android'){
                params.scanMode = bluetoothle.SCAN_MODE_LOW_POWER;
                params.matchMode = bluetoothle.MATCH_MODE_STICKY;
                params.matchNum = bluetoothle.MATCH_NUM_ONE_ADVERTISEMENT;
                searchDevicesOnAndroid(params, targetDevices, deviceNeeded)
                .then(function(devices){
                    console.log('*****Got Android combined devices*******');
                    console.log(JSON.stringify(devices));
                    defer.resolve(totalDevices.concat(devices));
                })
                .catch(defer.reject);

            }
            else{
                startScan(params, targetDevices, deviceNeeded)
                .then(function(devices){
                    console.log('*****Got IOS combined devices*******');
                    console.log(JSON.stringify(devices));
                    console.log("*** totalDevices: " + JSON.stringify(totalDevices.concat(devices)));
                    defer.resolve(totalDevices.concat(devices));
                })
                .catch(defer.reject);
            }






            return defer.promise;
        };

        var filterDevices = function(searchedDevices){
            if(!searchedDevices) return [];
            var addresses = {};
            var filteredDevices = searchedDevices.filter(function(searchedDevice) {
                if(addresses[searchedDevice.address]) return false;
                addresses[searchedDevice.address] = true;
                return true;
            });
            return filteredDevices;
        };


        var connectDevice = function(params){
            var defer = $q.defer();

            if(params.deviceName && sdkDeviceNames.includes(params.deviceName)){
                //If part of SDK device Names, connect via the SDK and not BLE plugin

                var success = function(msg){
                    console.log("*** Successful SDK connection: " + msg);
                    defer.resolve({status: 'connected'});
                }

                var fail = function(msg){
                    console.log("*** Failure with SDK connection: " + msg);
                    defer.reject(msg);
                }

                if(params.deviceName == "POD"){
                    console.log("*** about to try to connect to POD via SDK");
                    sdkPlugin.CMI_POD1W_Connect(success, fail, params.address);
                }
                

            }else{

                $cordovaBluetoothLE.wasConnected(params)
                .then(function(status){
                    console.log("*****Wasconnected status is: " + JSON.stringify(status));
                    if(status.wasConnected){
                        $cordovaBluetoothLE.isConnected(params)
                        .then(function(connectedStatus){
                            console.log("*****ISconnected status is: " + JSON.stringify(connectedStatus));
                            if(connectedStatus.isConnected){
                                defer.resolve({status: 'connected'});
                            }
                            else {
                                console.log('***Device is not connected now reconnecting*******');
                                $cordovaBluetoothLE.reconnect(params)
                                .then(defer.resolve)
                                .catch(function(er){
                                    for(var test = 0; test<5; test++){
                                     console.log('*******************reconnect errror');
                                    }
                                    console.log(JSON.stringify(er));
                                    console.log('*****************');
                                    defer.reject(er);
                                });
                            }
                        });
                    }
                    else{
                        $cordovaBluetoothLE.connect(params)
                        .then(function(connectionInfo){
                            console.log("*** After calling initial connect: " + JSON.stringify(connectionInfo));
                            defer.resolve(connectionInfo);
                        })
                        .catch(defer.reject);
                    }
                });

            }

            

            return defer.promise;
        };

        var disconnect = function(params){
            if(params.deviceName && sdkDeviceNames.includes(params.deviceName)){
                var success = function(msg){
                    console.log("*** Successful SDK disconnection: " + msg);
                    defer.resolve({status: 'disconnected'});
                }

                var fail = function(msg){
                    console.log("*** Failure with SDK disconnection: " + msg);
                    defer.reject(msg);
                }

                if(params.deviceName == "POD"){
                    console.log("*** about to try to disconnect from POD via SDK");
                    sdkPlugin.CMI_POD1W_Disconnect(success, fail);
                }
            }else{
                $cordovaBluetoothLE.disconnect(params)
                .then(function(res){
                    console.log('Disconnect status is here***********************');
                    console.log(JSON.stringify(res));
                })
                .catch(function(err){
                    console.log('********Disconnect error here catch');
                    console.log(JSON.stringify(err));
                });
            }
        };




        return {
            searchDevices: searchDevices,
            discoverInfo : discoverInfo,
            startScan: startScan,
            initialize: initialize,
            readData: readData,
            readFdkData: readFdkData,
            readNoninData: readNoninData,
            readAndData: readAndData,
            readSynsorTrackData: readSynsorTrackData,
            filterDevices: filterDevices,
            connectDevice: connectDevice,
            timeout: timeout,
            disConnectDevice: disconnect
        };
    }
]);
