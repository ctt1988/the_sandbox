angular.module('synsormed.services.subscription', [
    'synsormed.services.parser',
    'synsormed.services.parser.eclipse',
    'synsormed.services.bluetooth',
    'synsormed.services.syncData',
    'synsormed.services.monitor'
])
.service('synsormed.services.subscription.subscribeLostDevices', [
    '$q',
    '$interval',
    '$rootScope',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.parser.ParserStorageService',
    'synsormed.services.syncData.Support',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.syncData.c5',
    'synsormed.services.parser.Chart',
    function($q, $interval, $rootScope, BluetoothService, ParserStorageService, Support, MonitorServicesService, c5, chartParser){
        return {
            timeInterval: 10*60*1000, // 10 minutes
            searchDevices: function(targetDevices, targetServices){
                console.log('Sub: initializing bluetooth');
                return BluetoothService.initialize({ request: true })
                .then(function(){
                    console.log('Sub: initialized bluetooth successfully');
                    return BluetoothService.searchDevices(targetDevices, targetServices);
                })
                .then(function(searchedDevices){
                    console.log('Sub: searched devices successfully');
                    return BluetoothService.filterDevices(searchedDevices);
                });
            },
            resubscribe: function(devices, targetServices){
                var defer = $q.defer();
                var that = this, promise;
                var connectParams = {timeout: BluetoothService.timeout, useResolve: true};
                console.log("Sub: **** in resubscribe the targetservices are: " + JSON.stringify(targetServices));
                var targetServiceId = targetServices[0].uuid;
                console.log("Sub: *** the uuid is: " + targetServiceId);
                var subscribeCharId = targetServices[0].characteristics.subscribe;
                console.log('Sub: resubscribe devices are' );
                console.log(JSON.stringify(devices));

                for(var i=0; i < devices.length; i++){
                    var device = devices[i];
                    connectParams.address = device.address;

                    if (!promise) {
                        console.log('Sub: Connecting to device '+ device.address);
                        promise = BluetoothService.connectDevice(connectParams)
                        .then(function(){
                            console.log('Sub: Now discovering to device '+ device.address);
                            return BluetoothService.discoverInfo(device.address, targetServiceId, subscribeCharId)
                            .then(function(){
                                console.log('Sub: Now subscribing');
                                 return chartParser.subscribeToChar(device.address, targetServiceId, subscribeCharId);
                            });
                        });
                    }
                    else {
                        promise = promise.then(function(){
                            console.log('Sub: cannot connect to  '+ device.address);
                            return false;
                        })
                        .catch(function(err){
                            console.log('Sub: Connecting to device '+ device.address);
                             return BluetoothService.connectDevice(connectParams)
                             .then(function(){
                                 console.log('Sub: Now discovering to device '+ device.address);
                                 return BluetoothService.discoverInfo(device.address, targetServiceId, subscribeCharId)
                                 .then(function(){
                                     console.log('Sub: Now subscribing');
                                 	return chartParser.subscribeToChar(device.address, targetServiceId, subscribeCharId);
                                 });
                             });
                        });
                    }
                }

                if(!promise) return defer.resolve(true);

                promise.then(function(obj){
                    console.log('Sub: Subscribed successfully '+ JSON.stringify(obj));
                    console.log('Sub: Now syncing device');
                    return c5.sync()
                    .then(function(){
                        console.log('Sub: Sycning successfull after resubscribing');
                        defer.resolve(true);
                    });
                })
                .catch(function(err){
                    console.log('***********resubscribe error');
                    console.log(JSON.stringify(err));
                    defer.reject(err);
                });

                return defer.promise;
            },
            checkDevice: function(lostDeivces, targetDevices, targetServices){
                 var that = this;
                 console.log('**************Sub: now searching for lost devices***************');
                 console.log("*****Sub: The target devices and services are: " + JSON.stringify(targetDevices) + " *** " + JSON.stringify(targetServices));
                 return that.searchDevices(targetDevices, targetServices)
                 .then(function(foundDevices){
                     console.log('Sub: ************found some devices ' + JSON.stringify(foundDevices));
                     console.log('Sub: lost devices are' + JSON.stringify(lostDeivces));
                     var availableDevices = _.filter(foundDevices, function(device) {
                         return !!lostDeivces[device.address];
                     });
                     console.log('Sub: availableDevices devices is '+ JSON.stringify(availableDevices));
                     if(availableDevices.length){
                         console.log('Sub: now resubscribing device');
                         return that.resubscribe(availableDevices, targetServices);
                     }
                     return false;
                 })
                 .catch(function(err){
                      console.log('Sub: error while checking the device');
                      console.log(JSON.stringify(err));
                 });
            },
            start: function(monitor, serviceName){
                console.log('staring this one');
                var that = this;
                if($rootScope.lostDeviceFinder) {
                    console.log('lostDeviceFinder already running');
                    return false;
                }

                return Support.getMeasurements(monitor.id, serviceName)
               .then(function(c5Measurements){
                   console.log('*sub measurements', c5Measurements);
                   if(!c5Measurements || !c5Measurements.length) return;
                   return c5.findServicesForMonitor(monitor, c5Measurements[0]);
               })
               .then(function(c5Services){
                   console.log('***sub: found c5 services******', c5Services);
                   if(!c5Services || !c5Services.length) return false;
                   if(c5Services[0].metaData){
                       var targetDevices = c5Services[0].metaData.devices || [];
                       var targetServices= c5Services[0].metaData.services || [];
                       console.log('target devices and services', targetDevices, targetServices);
                       var lostDevices = null;
                       $rootScope.lostDeviceFinder = $interval(function(){
                           console.log('started this time', monitor.id);
                           lostDevices = ParserStorageService.getLostDevices();
                           console.log("*****The lost Device from storage is: " + JSON.stringify(lostDevices));
                           console.log('*********lostDeivces length is ' + Object.keys(lostDevices).length);
                           if(lostDevices && Object.keys(lostDevices).length){
                               console.log('Sub: now checking device')
                               return that.checkDevice(lostDevices, targetDevices, targetServices);
                           }
                           return false;
                       }, that.timeInterval);
                       this.lostDeviceFinder = $rootScope.lostDeviceFinder;
                       return this.lostDeviceFinder;
                   }
                   else return;
               })
               .catch(function(err){
                    console.log('here is error', err);
               });
            },
            stop: function(){
                console.log('Sub: stoping check interval');
                if(this.lostDeviceFinder) $interval.cancel(this.lostDeviceFinder);
            }
        }
    }
]);
