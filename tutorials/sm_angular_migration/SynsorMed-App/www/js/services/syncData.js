angular.module('synsormed.services.syncData', [
    'ngCordovaBluetoothLE',
    'synsormed.services.bluetooth',
    'synsormed.services.user',
    'synsormed.services.monitor',
    'synsormed.services.authentication'
])
.service('synsormed.services.syncData.Support', [
  '$q',
  'synsormed.services.user.UserService',
  'synsormed.services.monitor.MonitorMeasurementService',
  'synsormed.services.authentication.Login',
  function($q, UserService, MonitorMeasurementService, Login){
      return {
          getMeasurements: function(monitorId, serviceName){
              var defer = $q.defer();

              MonitorMeasurementService.getMeasurementsForMonitor(monitorId)
              .then(function(results){

                  //console.log("**** the results in getMeasurements is: " + JSON.stringify(results) + " and serviceName is: " + serviceName);

                  var measurements = results.filter(function(measurement){
                      return (measurement.serviceName != null && measurement.serviceName.toLowerCase() == serviceName);
                  });

                  if(!measurements || !measurements.length) return defer.reject({message:'No measurements found'});

                  return defer.resolve(measurements);
              })
              .catch(defer.reject);

              return defer.promise;
          },
          createNewSession: function(){
              var defer = $q.defer();
              var patientCode = UserService.getAutoFetchCode();
              if(!patientCode) defer.reject({message: 'Auto fech is disabled'}); // no code available we can't upload data

              Login.patientAuth(patientCode)
              .then(function (user) {
                  if(!user.isMonitor || !user.autoFetch) return defer.reject({message: 'Cannot upload data'}); // if no monitor we can't upload the data
                  defer.resolve(user);
              })
              .catch(function(err){
                console.log("*** Error with createNewSession: " + JSON.stringify(err));
                defer.reject(err);
              });

              return defer.promise;
          },
          getMonitor: function(){
            console.log("*** inside get monitor ***");
              var that = this;
              var defer = $q.defer();
              var monitor = UserService.getUser();

              if(monitor && monitor.length > 0){
                console.log("*** got the monitor and going to resolve");
                  if(!monitor.autoFetch) defer.reject({message: 'Auto fech is disabled'});
                  defer.resolve(monitor);
              }
              else{
                console.log("*** Inside get monitor, but monitor is null");
                  that.createNewSession()
                  .then(defer.resolve)
                  .catch(defer.reject);
              }
              return defer.promise;
          },
          uploadData: function(monitorId, measurementId, serviceName, data){
              return MonitorMeasurementService
              .setOauthDataForMeasurement(monitorId, measurementId,{
                  'service_name': serviceName,
                  'oauth_data': data
              }, true);
          }
      }
  }
])
.service('synsormed.services.syncData.healthkit', [
   '$q',
   '$interval',
   '$rootScope',
   'synsormed.services.syncData.Support',
   function($q, $interval, $rootScope, Support){
       return {
           serviceName: 'healthkit',
           timeInterval: 1000*60*60*12, // 12 hours
           updateData: function(monitor, measurements){
               var that = this;
               var promises = [];

               var uploadDataToServer = function(measurementMap){
                   return HealthkitService.performAuth()
                   .then(function(data) {
                       if(data === true) {
                           return HealthkitService.readData().then(function(readings){
                               return Support.uploadData(monitor.id, measurementMap.id, that.serviceName, readings);
                           });
                       }
                       else{
                           return false;
                       }
                   });
               };

               measurements.forEach(function(measurement){
                   if(measurement.serviceName != null && measurement.serviceName.toLowerCase() == that.serviceName){
                       promises.push(uploadDataToServer(measurement));
                   }
               });

               return $q.all(promises);
           },
           startSync: function(monitor){
               var that = this;
               return Support.getMeasurements(monitor.id, that.serviceName)
               .then(function(measurements){
                   return that.updateData(monitor, measurements);
               })
               .catch(function(e){
                   console.log(JSON.stringify(e));
               });
           },
           stopTracking: function(){
               var that = this;
               if(cordova.plugins.backgroundMode.isEnabled()){
                   cordova.plugins.backgroundMode.disable();
                   if(that.startedTimer) $interval.cancel(that.startedTimer);
               }
           },
           init: function(){
               var that = this;
               if(window.device.platform && window.device.platform.toLowerCase() == 'ios'){ // start only for ios
                   cordova.plugins.backgroundMode.setDefaults({   // customization
                       title: 'Transferring healthkit data.',
                       text: 'Transferring healthkit data.'
                   });

                   cordova.plugins.backgroundMode.enable(); // Enable background mode

                   if($rootScope.healthKitStaredTimer) {
                       console.log('*****************Healthkit timer already started********');
                       return false;
                   }

                   $rootScope.healthKitStaredTimer = $interval(function(){
                       Support.getMonitor()
                       .then(function(monitor){
                           cordova.plugins.backgroundMode.configure({
                               title: 'Syncing healthkit data',
                               text:'Syncing healthkit data.'
                           });
                           that.startSync(user);
                       })
                       .catch(function(){
                           return that.stopTracking();
                       });
                   }, that.timeInterval);

                   this.startedTimer = $rootScope.healthKitStaredTimer;
               }
           }
       };
   }
])
.service('synsormed.services.syncData.c5', [
    '$q',
    '$interval',
    '$rootScope',
    '$cordovaBluetoothLE',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    'synsormed.services.syncData.Support',
    'synsormed.services.monitor.MonitorMeasurementService',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.authentication.Login',
    'synsormed.services.parser.Chart',
    'synsormed.services.location.locationService',
    function($q, $interval, $rootScope, $cordovaBluetoothLE, BluetoothService, BluetoothStorageService, Support, MonitorMeasurementService, MonitorServicesService, LoginService, chartParser, locationService){
        //var count = 0;
        var c5Obj = {
            isIos: ( window.device.platform && window.device.platform.toLowerCase() == 'ios' ),
            serviceName: 'c5',
            timeInterval: 1000*60*60*1, // 1 hour
            fetchData: function(address, targetServices){
              var defer = $q.defer();

              var params = {address: address, timeout: BluetoothService.timeout, useResolve: true};
              console.log('******fetching data for manually sync***********');

              BluetoothService.connectDevice(params)
              .then(function(connection){
               console.log("*****connection status is: " + JSON.stringify(connection));

               if(connection.status != 'connected') return false;

              
					     BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
              console.log('*****Now starting read data on manually sync*********');
              return BluetoothService.readData(address, null, targetServices);
              })
              .then(function(deviceData){
                var isError = false;
                console.log('Manually sync device data is here');
                console.log(JSON.stringify(deviceData));
                console.log('Device data ' + JSON.stringify(deviceData));
                var totalData = [];

                if(deviceData && deviceData.length){
                  $rootScope.c5ConnectionStatus = true; //Tell the rootscope that the c5 is connected so that read.js can change color of circle icon
                  _.forEach(deviceData, function(data){
                    if(data && data.state && data.state == 'fulfilled' && data.value.length){
                      totalData.push(chartParser.parse(data.value));
                    }
                    else{
                      isError = isError || true;
                    }
                  });
                }
                console.log('all data is '+JSON.stringify(totalData));
                if(!isError) defer.resolve(totalData);
                else defer.reject(totalData);
              })
              .catch(function(err){
                console.log('************Error in fetching data manually********');
                console.log(JSON.stringify(err));
                defer.reject(err);
              });

              return defer.promise;
            },
            fetchDataForDevices: function(devices, targetServices){
                var defer = $q.defer();
                var that = c5Obj, promise, response = {data: [], error: []};
                console.log('****Fetching data for devices****');
                console.log(JSON.stringify(devices));
                if(!devices || !devices.length){
                    defer.reject({message:'No device found', code: 404});
                    return defer.promise;
                }
                console.log('********should not be executed**********');

                // fetch data for each device serially
                _.forEach(devices, function(connectedDevice){
                    var currentAddress = connectedDevice.address;
                    if (!promise) {
                        promise = that.fetchData(currentAddress, targetServices); // first task
                    }
                    else {
                        promise = promise.then(function(dataForDevice){
                            response.data = response.data.concat(dataForDevice);
                            return that.fetchData(currentAddress, targetServices);
                        })
                        .catch(function(err){
                            console.log('***********Error in fetchDataForDevices********');
                            console.log(JSON.stringify(err));
                            response.error.push(err);
                            return that.fetchData(currentAddress, targetServices);
                        });
                    }
                });

                if(!promise) return defer.resolve(response.data);;

                promise.then(function(dataForDevice){
                    console.log('response.data is here', response.data);
                    response.data = response.data.concat(dataForDevice);
                    defer.resolve(response.data);
                })
                .catch(function(err){
                    console.log('***********Error in fetchDataForDevices********');
                    console.log(JSON.stringify(err));
                    console.log('response.data in err ' + JSON.stringify(response.data));

                    response.error.push(err);
                    if(!response.data.length) return defer.reject({errors: response.error});
                    return defer.resolve(response.data);
                });

                return defer.promise;
            },
            getData: function(targetDevices, targetServices){
                var that = c5Obj;
                var connectedC5Devices = BluetoothStorageService.getConnectedDevices() || {};
                console.log('*****Starting get data***********');
                return BluetoothService.initialize({ request: true }) // plugin initialized
                .then(function(){
                    console.log('****initialized on manually sync*****');
                    return BluetoothService.searchDevices(targetDevices, targetServices); //search for devices
                })
                .then(function(searchedDevices){
                    console.log('*****manually sync filtered devices are **');
                    console.log(JSON.stringify(searchedDevices));
                    var devices = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                     var availableConnectedDevices = devices.filter(function(device) {
                         //return !!connectedC5Devices[device.address];
                         return true;
                     });
                    return that.fetchDataForDevices(availableConnectedDevices, targetServices);
                });
            },
            findServicesForMonitor: function(monitor, measurementMap){
                var services, connected = [];
                console.log('***********Finding services for monitor');
                return MonitorServicesService.getServicesForMonitor(monitor.id, measurementMap.measurementId)
                .then(function(results){
                    services = results || [];
                    return MonitorServicesService.getConnectedService(monitor.id)
                })
                .then(function(serviceName){
                    serviceName = serviceName || [];
                    for(var i = 0; i < services.length; i++){
                        for(var j = 0; j < serviceName.length; j++){
                            if(services[i].name == serviceName[j].service_name && services[i].name.toLowerCase() == 'c5' && services[i].version == '0'){
                                connected.push(services[i]);
                            }
                        }
                    }
                    return connected;
                });
            },
            updateData: function(monitor, measurements, dataToSync){
                var that = c5Obj;
                var promises = [];

                var uploadDataToServer = function(measurementMap){

                    var startUpload = function(parsedData){
                        console.log('data before manually upload is ' + JSON.stringify(parsedData));
                        return MonitorMeasurementService
                        .setOauthDataForMeasurement(monitor.id, measurementMap.id, {
                            'service_name': that.serviceName,
                            'oauth_data': parsedData
                        }, false)
                        .then(function(data){
                          console.log("****** Uploading datapoint was successful: " + JSON.stringify(data));
                        })
                        .catch(function(err){
                            console.log("**** Error with startUpload: " + JSON.stringify(err));
                        });
                    };

                    return that.findServicesForMonitor(monitor, measurementMap)
                    .then(function(c5Services){
                        console.log('****Found services for monitor*****');
                        console.log(JSON.stringify(c5Services));
                        var currentDeviceData = chartParser.getConnectedDeviceData();

                        console.log('***********************currentDeviceData data is ***********');
                        console.log(JSON.stringify(currentDeviceData));

                        if(!c5Services || !c5Services.length) return false;
                        if(c5Services[0].metaData){
                            var targetDevices = c5Services[0].metaData.devices || [];
                            var targetServices= c5Services[0].metaData.services || [];
                        }

                        if(dataToSync){
                            console.log('dataToSync is provided ' + JSON.stringify(dataToSync));
                            return startUpload(dataToSync);
                        }
                        else if(currentDeviceData && targetServices && (currentDeviceData.info.service.toLowerCase() == targetServices[0].uuid.toLowerCase()) ){
                            var dataToUpload = [currentDeviceData.data];
                            return startUpload(dataToUpload);
                        }
                        else {
                            return that.getData(targetDevices, targetServices)
                            .then(function(data){
                                return startUpload(data);
                            });
                        }
                    });
                };

                console.log('********Updating data*************');

                measurements.forEach(function(measurement){
                    if(measurement.serviceName != null && measurement.serviceName.toLowerCase() == that.serviceName){
                        promises.push(uploadDataToServer(measurement));
                    }
                });

                return $q.all(promises);
            },
            startSyncWithMonitor: function(dataToSync){
                var that = this;
                var prom = Support.getMonitor();
                prom.then(function(monitor){
                    return that.startSync(monitor, dataToSync);
                })
                .catch(function(err){
                    console.log(err);
                });
            },
            startSync: function(monitor, dataToSync){
                var defer = $q.defer();

                if($rootScope.c5Syncing) defer.reject({message:'Already in progress'});
                var that = this;
                var measurements;
                $rootScope.c5Syncing = true;
                console.log("*** Before getMeasurements the monitor id is: " + monitor.id + " and serviceName is: " + that.serviceName);
                 Support.getMeasurements(monitor.id, that.serviceName)
                .then(function(c5Measurements){
                    console.log('*******Start Sync*********************');
                    return that.updateData(monitor, c5Measurements, dataToSync);
                })
                .then(function(){
                    $rootScope.c5Syncing = false;
                    defer.resolve(true);
                    $rootScope.$emit('notification:success', 'data uploaded');
                })
                .catch(function(e){
                    console.log("*** Error gettting measurements in startSync: " + JSON.stringify(e));
                    var message = 'Welcome Back!';
                    if(e && e.code && e.code == 404) message = e.message;
                    if(e && e.status == 403){
                        console.log('**********I think session is expired**********');
                        return Support.createNewSession()
                        .then(function(){
                           return Support.getMeasurements(monitor.id, that.serviceName);
                        })
                        .then(function(c5Measurements){
                            console.log('*******Start Sync*********************');
                            return that.updateData(monitor, c5Measurements, dataToSync);
                        })
                        .then(function(){
                            $rootScope.c5Syncing = false;
                            defer.resolve(true);
                            $rootScope.$emit('notification:success', 'data uploaded');
                        })
                        .catch(function(er){
                            $rootScope.c5Syncing = false;
                            if(er && er.code && er.code == 404) message = er.message;
                            $rootScope.$emit('notification:success', message);
                            defer.reject(er);
                        });
                    }
                    else{
                        $rootScope.c5Syncing = false;
                        $rootScope.$emit('notification:success', message);
                        defer.reject(e);
                    }
                });

                return defer.promise;
            },
            iosStop: function(){
                var that = c5Obj;
                if(that.startedTimer) $interval.cancel(that.startedTimer);
            },
            otherStop: function(){
                var that = c5Obj;
                console.log('*************stoping tracker now here**********');
                if(cordova.plugins.backgroundMode.isEnabled()){
                    cordova.plugins.backgroundMode.disable();
                    if(that.startedTimer) $interval.cancel(that.startedTimer);
                }
            },
            stopTracking: function(){
                if(c5Obj.isIos) return c5Obj.iosStop();
                else return c5Obj.otherStop();
            },
            sync: function(){
                console.log('*** In the Sync function ****');
                //console.log(c5Obj);
                //console.log(Object.keys(c5Obj));
                var that = c5Obj;
                //console.log(that);
                //console.log(Object.keys(that));
                //console.log('Support is here');
                //console.log(Support);
                //console.log(Object.keys(Support));
               var prom = Support.getMonitor();
               prom.then(function(monitor){
                   console.log('**************Starting Sync event**********');
                   return that.startSync(monitor);
               })
               .catch(function(err){
                   console.log('************Getting error to stop tracker event***********');
                   console.log(JSON.stringify(err));
                   console.log('*******************Stop tracker event*************');

                   if(err && err.status == 403){
                       console.log('**********I think session is expired**********');
                       return Support.createNewSession()
                       .then(function(monitor){
                           console.log('*******Recreated session now');
                           console.log('*******The data will be ')
                           return that.startSync(monitor);
                       });
                   }
                   return err;
                  // return that.stopTracking();
               });
            },
            OtherTask: function(){
                var that = c5Obj;
                cordova.plugins.backgroundMode.configure({
                    title: 'Syncing c5 data',
                    text:'Syncing c5 data.'
                });
                return that.sync();
            },
            init: function(syncOnly){
              console.log("*** I am in the init function for C5");
                if(!window.cordova) return console.log('Cordova is not found');
                var that = c5Obj, task;
                if(!window.cordova) return console.log('cordova is not defined');
                if(syncOnly) return that.sync();

                if(that.isIos){
                    task = that.sync;
                }
                else{
                    var isEnabled = cordova.plugins.backgroundMode.isEnabled();
                    if(!isEnabled){
                        cordova.plugins.backgroundMode.setDefaults({
                            title: 'Transferring bluetooth data.',
                            text: 'Transferring bluetooth data.'
                        });
                        cordova.plugins.backgroundMode.enable();  // Enable background mode
                    }
                    task = that.OtherTask;
                }

                if($rootScope.c5startedTimer){
                    console.log('*************Sync timer is already started******');
                    return false;
                }
                console.log('*************Started Sync timer ******');
                $rootScope.c5startedTimer = $interval(function(){
                    //count = count + 1;
                    task();
                }, that.timeInterval);

                //Support.getMonitor()
                //.then(function(monitor){
                  //console.log('***************************monitor!!!!!!!!!', monitor)
                  // if(count == 60){
                  //   locationService.getLocation() // update location
                  //   .then(function(location){
                  //      console.log('location*******************!!!!!!!!!!!!!!!!!!!!!!!!!!', location)
                  //      return locationService.updateMonitorLocation(monitor.id, location);
                  //   })
                  //   .catch(function(err){
                  //       console.log('err**********************!!!!!!!!!!!!!!!', err);
                  //   });
                  // }
                //})
                this.startedTimer = $rootScope.c5startedTimer;
            }
        };
        return c5Obj;
    }
])
.service('synsormed.services.syncData.eclipse', [
    '$q',
    '$interval',
    '$rootScope',
    '$cordovaBluetoothLE',
    'synsormed.services.bluetooth.BluetoothService',
    'synsormed.services.bluetooth.BluetoothStorageService',
    'synsormed.services.syncData.Support',
    'synsormed.services.monitor.MonitorMeasurementService',
    'synsormed.services.monitor.MonitorServicesService',
    'synsormed.services.authentication.Login',
    'synsormed.services.parser.EclipseChart',
    function($q, $interval, $rootScope, $cordovaBluetoothLE, BluetoothService, BluetoothStorageService, Support, MonitorMeasurementService, MonitorServicesService, LoginService, eclipseChartParser){

        var eclipseObj = {
            isIos: ( window.device.platform && window.device.platform.toLowerCase() == 'ios' ),
            serviceName: 'eclipse',
            timeInterval: 1000*60*60*1, // 1 hour
            fetchData: function(address, targetServices){
              var defer = $q.defer();

              var params = {address: address, timeout: BluetoothService.timeout, useResolve: true};
              console.log('******fetching data for manually sync***********');

              BluetoothService.connectDevice(params)
              .then(function(connection){
               console.log("*****connection status is: " + JSON.stringify(connection));

               if(connection.status != 'connected') return false;

               BluetoothStorageService.setNewConnectedDevice(address, true);
               console.log('*****Now starting read data on manually sync*********');
               return BluetoothService.readEclipseData(address, null, targetServices);
             })
              .then(function(deviceData){
                var isError = false;
                console.log('Manually sync device data is here');
                console.log(JSON.stringify(deviceData));
                console.log('Device data ' + JSON.stringify(deviceData));
                var totalData = [];

                if(deviceData && deviceData.length){
                  $rootScope.eclipseConnectionStatus = true;  //This means we are actually pulling data from the eclipse, so tell read.js to turn the light green
                  _.forEach(deviceData, function(data){
                    if(data && data.state && data.state == 'fulfilled' && data.value.length){
                      totalData.push(eclipseChartParser.parse(data.value));
                    }
                    else{
                      isError = isError || true;
                    }
                  });
                }
                console.log('all data is '+JSON.stringify(totalData));
                if(!isError) defer.resolve(totalData);
                else defer.reject(totalData);
              })
              .catch(function(err){
                console.log('************Error in fetching data manually********');
                console.log(JSON.stringify(err));
                defer.reject(err);
              });

              return defer.promise;
            },
            fetchDataForDevices: function(devices, targetServices){
                var defer = $q.defer();
                var that = eclipseObj, promise, response = {data: [], error: []};
                console.log('****Fetching data for devices****');
                console.log(JSON.stringify(devices));
                if(!devices || !devices.length){
                    defer.reject({message:'No device found', code: 404});
                    return defer.promise;
                }
                console.log('********should not be executed**********');

                // fetch data for each device serially
                _.forEach(devices, function(connectedDevice){
                    var currentAddress = connectedDevice.address;
                    if (!promise) {
                        promise = that.fetchData(currentAddress, targetServices); // first task
                    }
                    else {
                        promise = promise.then(function(dataForDevice){
                            response.data = response.data.concat(dataForDevice);
                            return that.fetchData(currentAddress, targetServices);
                        })
                        .catch(function(err){
                            console.log('***********Error in fetchDataForDevices********');
                            console.log(JSON.stringify(err));
                            response.error.push(err);
                            return that.fetchData(currentAddress, targetServices);
                        });
                    }
                });

                if(!promise) return defer.resolve(response.data);;

                promise.then(function(dataForDevice){
                    console.log('response.data is here', response.data);
                    response.data = response.data.concat(dataForDevice);
                    defer.resolve(response.data);
                })
                .catch(function(err){
                    console.log('***********Error in fetchDataForDevices********');
                    console.log(JSON.stringify(err));
                    console.log('response.data in err ' + JSON.stringify(response.data));

                    response.error.push(err);
                    if(!response.data.length) return defer.reject({errors: response.error});
                    return defer.resolve(response.data);
                });

                return defer.promise;
            },
            getData: function(targetDevices, targetServices){
                var that = eclipseObj;
                var connectedEclipseDevices = BluetoothStorageService.getConnectedDevices() || {};
                console.log('*****Starting get data***********');
                return BluetoothService.initialize({ request: true }) // plugin initialized
                .then(function(){
                    console.log('****initialized on manually sync*****');
                    return BluetoothService.searchDevices(targetDevices, targetServices); //search for devices
                })
                .then(function(searchedDevices){
                    console.log('*****manually sync filtered devices are **');
                    console.log(JSON.stringify(searchedDevices));
                    var devices = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                    var availableConnectedDevices = devices.filter(function(device) {
                        return !!connectedEclipseDevices[device.address];
                    });
                    return that.fetchDataForDevices(availableConnectedDevices, targetServices);
                });
            },
            findServicesForMonitor: function(monitor, measurementMap){
                var services, connected = [];
                console.log('***********Finding services for monitor');
                return MonitorServicesService.getServicesForMonitor(monitor.id, measurementMap.measurementId)
                .then(function(results){
                    services = results || [];
                    return MonitorServicesService.getConnectedService(monitor.id)
                })
                .then(function(serviceName){
                    serviceName = serviceName || [];
                    for(var i = 0; i < services.length; i++){
                        for(var j = 0; j < serviceName.length; j++){
                            if(services[i].name == serviceName[j].service_name && services[i].name.toLowerCase() == 'eclipse' && services[i].version == '0'){
                                connected.push(services[i]);
                            }
                        }
                    }
                    return connected;
                });
            },
            updateData: function(monitor, measurements, dataToSync){
                var that = eclipseObj;
                var promises = [];

                var uploadDataToServer = function(measurementMap){

                  var startUpload = function(parsedData){
                    console.log('data before manually upload is ' + JSON.stringify(parsedData));
                    if(parsedData[0].standbyStatus === false){ //make sure not to upload if in standby
                      return MonitorMeasurementService
                      .setOauthDataForMeasurement(monitor.id, measurementMap.id, {
                        'service_name': that.serviceName,
                        'oauth_data': parsedData
                      }, false)
                      .then(function(data){
                        console.log("****** Uploading datapoint was successful: " + JSON.stringify(data));
                        $rootScope.$emit('notification:success', 'data uploaded');
                      })
                      .catch(function(err){
                        console.log("**** There was an error uploading datapoint to server: " + JSON.stringify(err));
                      });
                    }else{
                      console.log("*** We bypassed upload because the E5 was in standby");
                      $rootScope.$emit('notification:error', 'not active');
                    }
                  };

                    return that.findServicesForMonitor(monitor, measurementMap)
                    .then(function(eclipseServices){
                        console.log('****Found services for monitor*****');
                        console.log(JSON.stringify(eclipseServices));
                        var currentDeviceData = eclipseChartParser.getConnectedDeviceData();

                        console.log('***********************currentDeviceData data is ***********');
                        console.log(JSON.stringify(currentDeviceData));

                        if(!eclipseServices || !eclipseServices.length) return false;
                        if(eclipseServices[0].metaData){
                            var targetDevices = eclipseServices[0].metaData.devices || [];
                            var targetServices= eclipseServices[0].metaData.services || [];
                        }

                        if(dataToSync){
                            console.log('dataToSync is provided ' + JSON.stringify(dataToSync));
                            return startUpload(dataToSync);
                        }
                        else if(currentDeviceData && targetServices && (currentDeviceData.info.service.toLowerCase() == targetServices[0].uuid.toLowerCase()) ){
                            var dataToUpload = [currentDeviceData.data];
                            return startUpload(dataToUpload);
                        }
                        else {
                            return that.getData(targetDevices, targetServices)
                            .then(function(data){
                                return startUpload(data);
                            });
                        }
                    });
                };

                console.log('********Updating data*************');

                measurements.forEach(function(measurement){
                    if(measurement.serviceName != null && measurement.serviceName.toLowerCase() == that.serviceName){
                        promises.push(uploadDataToServer(measurement));
                    }
                });

                return $q.all(promises);
            },
            startSyncWithMonitor: function(dataToSync){
                var that = this;
                var prom = Support.getMonitor();
                prom.then(function(monitor){
                    return that.startSync(monitor, dataToSync);
                })
                .catch(function(err){
                    console.log(err);
                });
            },
            startSync: function(monitor, dataToSync){
                var defer = $q.defer();

                if($rootScope.eclipseSyncing) defer.reject({message:'Already in progress'});
                console.log("*** I am in the startSync function and the e5 conn status is: " + $rootScope.eclipseConnectionStatus); 
                
                var that = this;
                var measurements;
                $rootScope.eclipseSyncing = true;
                 Support.getMeasurements(monitor.id, that.serviceName)
                .then(function(eclipseMeasurements){
                    console.log('*******Start Sync*********************');
                    return that.updateData(monitor, eclipseMeasurements, dataToSync);
                })
                .then(function(){
                  console.log("*** Testing to see if resolve before uploading");
                    $rootScope.eclipseSyncing = false;
                    defer.resolve(true);
                    //$rootScope.$emit('notification:success', 'Eclipse data uploaded');
                })
                .catch(function(e){
                    console.log("**** startSync on Eclipse failed: " + JSON.stringify(e));
                    var message = 'Error';
                    if(e && e.code && e.code == 404) message = e.message;
                    if(e && e.status == 403){
                        console.log('**********I think session is expired**********');
                        return Support.createNewSession()
                        .then(function(){
                           return Support.getMeasurements(monitor.id, that.serviceName);
                        })
                        .then(function(eclipseMeasurements){
                            console.log('*******Start Sync*********************');
                            return that.updateData(monitor, eclipseMeasurements, dataToSync);
                        })
                        .then(function(){
                          console.log("*** Testing in the catch to see if resolve before uploading");

                            $rootScope.eclipseSyncing = false;
                            defer.resolve(true);
                            $rootScope.$emit('notification:success', 'data uploaded');
                        })
                        .catch(function(er){
                            $rootScope.eclipseSyncing = false;
                            if(er && er.code && er.code == 404) message = er.message;
                            $rootScope.$emit('notification:error', message);
                            defer.reject(er);
                        });
                    }
                    else{
                        $rootScope.eclipseSyncing = false;
                        $rootScope.$emit('notification:error', message);
                        defer.reject(e);
                    }
                });

                return defer.promise;
            },
            iosStop: function(){
                var that = eclipseObj;
                if(that.startedTimer) $interval.cancel(that.startedTimer);
            },
            otherStop: function(){
                var that = eclipseObj;
                console.log('*************stoping tracker now here**********');
                if(cordova.plugins.backgroundMode.isEnabled()){
                    cordova.plugins.backgroundMode.disable();
                    if(that.startedTimer) $interval.cancel(that.startedTimer);
                }
            },
            stopTracking: function(){
                if(eclipseObj.isIos) return eclipseObj.iosStop();
                else return eclipseObj.otherStop();
            },
            sync: function(){
              console.log('in the Sync function');
                var that = eclipseObj;
                var prom = Support.getMonitor();
                prom.then(function(monitor){
                 console.log('**************Starting Sync event**********');
                 return that.startSync(monitor);
               })
                .catch(function(err){
                 console.log('************Getting error to stop tracker event***********');
                 console.log(JSON.stringify(err));
                 console.log('*******************Stop tracker event*************');

                 if(err && err.status == 403){
                   console.log('**********I think session is expired**********');
                   return Support.createNewSession()
                   .then(function(monitor){
                     console.log('*******Recreated session now');
                     console.log('*******The data will be ')
                     return that.startSync(monitor);
                   });
                 }
                 return err;
                  // return that.stopTracking();
                });
              },
            OtherTask: function(){
                var that = eclipseObj;
                cordova.plugins.backgroundMode.configure({
                    title: 'Syncing eclipse data',
                    text:'Syncing eclipse data.'
                });
                return that.sync();
            },
            init: function(syncOnly){
              console.log("*** Inside init function for eclipse object");
                if(!window.cordova) return console.log('Cordova is not found');
                var that = eclipseObj, task;
                if(!window.cordova) return console.log('cordova is not defined');
                if(syncOnly) return that.sync();

                if(that.isIos){
                    task = that.sync;
                }
                else{
                    var isEnabled = cordova.plugins.backgroundMode.isEnabled();
                    if(!isEnabled){
                        cordova.plugins.backgroundMode.setDefaults({
                            title: 'Transferring bluetooth data.',
                            text: 'Transferring bluetooth data.'
                        });
                        cordova.plugins.backgroundMode.enable();  // Enable background mode
                    }
                    task = that.OtherTask;
                }

                if($rootScope.eclipsestartedTimer){
                    console.log('*************Sync timer is already started******');
                    return false;
                }
                console.log('*************Started Sync timer ******');
                task();
                $rootScope.eclipsestartedTimer = $interval(function(){
                    task();
                    console.log("*** Ran the task inside sync timer");
                }, that.timeInterval);
                this.startedTimer = $rootScope.eclipsestartedTimer;
            }
        };
        return eclipseObj;
    }
]);
