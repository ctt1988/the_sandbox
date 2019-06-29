angular.module('synsormed.controllers.monitor.survey', [
    'synsormed.services.survey',
    'synsormed.services.monitor',
    'ui-rangeSlider'
])
    .controller('MonitorSurveyController', [
        '$scope',
        '$rootScope',
        '$route',
        '$modal',
        '$location',
        '$interval',
        'synsormed.services.bluetooth.BluetoothService',
        'synsormed.services.bluetooth.BluetoothStorageService',
        'synsormed.services.survey.SurveyService',
        'synsormed.services.monitor.MonitorServicesService',
        'synsormed.services.monitor.MonitorMeasurementService',
        'synsormed.services.user.UserService',
        'synsormed.services.awake.awakeService',
        function ($scope, $rootScope, $route, $modal, $location, $interval, BluetoothService, BluetoothStorageService, SurveyService, MonitorServicesService, MonitorMeasurementService, UserService, awakeService) {
          var user = UserService.getUser();
          var availMeasurement = [];
          var availMeasurements = [];
          var measurementName = "";
          var targetDevices = [];
          var targetServices = [];
          var allTargetServices = [];
          var allTargetDevices = [];
          var searchingInProgress = false;
          var deviceNeeded = false;
          var questionsLength;
          $scope.gatheredData = false;
          $scope.educationChecked = false;

          UserService.loadMonitor(user)
            .then(function(res) {
                $scope.educationChecked = res.educationChecked;
            });

          $scope.getData = function(){
            $scope.$emit('wait:start');
            MonitorMeasurementService //get all the measurements
                .getMeasurementsForMonitor(user.id)
                .then(function (measurements) {
                    if (!measurements.length) {
                        $scope.$emit("wait:stop");
                        return;
                    }
                    $scope.measurements = measurements;

                    $scope.connected = BluetoothStorageService.getConnectedDevices() || {};
                    //$scope.measurementName = '';

                    if (!$rootScope.c5ConnectionStatus) $rootScope.c5ConnectionStatus = false;
                    if (!$rootScope.eclipseConnectionStatus) $rootScope.eclipseConnectionStatus = false;
                    $scope.educationCheck = []
                    $scope.measurements
                        .forEach(function (measurement) {
                            if (measurement && measurement.isEducationChecked) {
                                $scope.educationCheck.push(measurement.isEducationChecked);
                                if ($scope.educationCheck.indexOf(true) != 1) {
                                    $scope.iseducation = true;
                                }
                            }
                            if (measurement.serviceName && (measurement.serviceName.toLowerCase() == "synsortrack" || measurement.serviceName.toLowerCase() == "nonin") && measurement.oauthAvailable) {
                                //&& measurement.name == 'Blood pressure'
                                $scope.isConnected = true;
                                availMeasurement = measurement;
                                var isExists = _.find(availMeasurements, function (measure) {
                                    return measure.id == measurement.id;
                                });
                                isExists = isExists || [];
                                if (!isExists.length) {
                                    availMeasurements.push(measurement)
                                }
                                measurementName = measurement.name;
                                MonitorServicesService
                                    .getServicesForMonitor(measurement.monitorId, measurement.measurementId)
                                    .then(function (services) {
                                        console.log("*** During Survey, The services for this monitor are: " + JSON.stringify(services));
                                        $scope.services = services;

                                        $scope.services
                                            .forEach(function (service) {
                                                if (service.display.toLowerCase() == 'synsortrack' || service.display.toLowerCase() == 'nonin') {
                                                    $scope.service = service;
                                                    targetDevices = $scope.service.metaData ? ($scope.service.metaData.devices || []) : [];
                                                    targetServices = $scope.service.metaData ? ($scope.service.metaData.services || []) : [];

                                                    //allTargetServices.push(targetServices[0].uuid);
                                                    allTargetServices.push(targetServices[0]);
                                                    allTargetDevices.push(targetDevices[0]);
                                                }
                                            });
                                        $scope.getDevices();
                                    })
                                    .catch(function (err) {
                                        $scope.$emit('wait:stop');
                                        console.log('err', err)
                                    });
                            }
                        });

                    $scope.getDevices = function () {
                        if (!targetDevices || !targetServices) {
                            return;
                        }
                        searchingInProgress = true;
                        $scope.searching = true;
                        BluetoothService.initialize({ request: true }) // plugin initialized
                            .then(function () {
                                return BluetoothService.searchDevices(allTargetDevices, allTargetServices, deviceNeeded); //search for devices
                            })
                            .then(function (searchedDevices) {
                                console.log("*** During survey, searchedDevices are: " + JSON.stringify(searchedDevices));
                                var searchedDevice = BluetoothService.filterDevices(searchedDevices); // Devices may be repeated filter them
                                console.log("*** During survey, after filtering, searchedDevice is: " + JSON.stringify(searchedDevice));
                                $scope.devices = searchedDevice;
                                var targetFound = false;
                                console.log("*** During Survey, at this point, the targetDevices are: " + JSON.stringify(allTargetDevices));
                                _.forEach(allTargetDevices, function (targetDevice) {
                                    if (searchedDevice[0].name.indexOf(targetDevice) != -1) {
                                        console.log("*** During Survey, found match between target and searched");
                                        targetFound = searchedDevice[0];
                                    }
                                });
                                if (targetFound) {
                                    $scope.$emit('wait:stop');
                                    console.log("*** During Survey, tartFound was: " + JSON.stringify(targetFound));
                                    $scope.connectDevice(targetFound.address, targetFound.name);
                                }
                                else {
                                  $scope.$emit('wait:stop');
                                    $scope.measurements
                                        .forEach(function (measurement) {
                                            measurement.availableDevice = false;
                                        })
                                    $rootScope.availableDevice = false;
                                    searchingInProgress = false;
                                }
                            })
                            .catch(function (err) {
                              $scope.$emit('wait:stop');
                                searchingInProgress = false;
                                $rootScope.availableDevice = false;
                                $scope.searching = false;
                                if (err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                            });
                    };

                    $scope.connectDevice = function (address, deviceName) {
                        awakeService.keepAwake(); //Keep app awake trying to connect device
                        var params = { address: address, timeout: 10000/*BluetoothService.timeout*/, useResolve: true };
                        BluetoothService.connectDevice(params)
                            .then(function (connection) {
                                if (connection.status != 'connected') {
                                    $scope.$emit('notification:error', 'Connecting to device failed.');
                                    searchingInProgress = false;
                                    return false;
                                }
                                BluetoothStorageService.setNewConnectedDevice(address, true); // Save in local storage
                                $scope.connected[address] = true;
                                console.log("*** During Survey, before getting data the device is: " + deviceName);
                                if(deviceName.toLowerCase().indexOf('nonin')!=-1){
                                    return BluetoothService.readNoninData(address, deviceName, allTargetServices);

                                }else if(deviceName == "PC-100"){
                                    console.log("  This is a place holder for SynsorTrack");
                                }

                                return BluetoothService.readSynsorTrackData(address, deviceName, targetServices, measurementName);
                            })
                            .then(function (deviceData) {
                                //$modal.close(true);
                                var isError = true;
                                var isDissconnected = false;
                                var totalData = {};
                                if (deviceData && deviceData.length) {
                                    _.forEach(deviceData, function (data) {
                                        if (data && data.state && data.state == 'fulfilled') {
                                            var dataValues = data.value || {};
                                            if (dataValues.measurementNames) {
                                                _.forEach(availMeasurements, function (measurement, index) {
                                                    if (dataValues.measurementNames.indexOf(measurement.name.toLowerCase())) {
                                                        isError = false;
                                                        availMeasurement = measurement;
                                                    }
                                                });
                                            }
                                            _.forEach(dataValues, function (val, ind) {
                                                totalData[ind] = totalData[ind] || [];
                                                totalData[ind] = totalData[ind].concat(val);
                                                if (ind == 'spo2' && val.length && val[0].quantity == 0) {
                                                    isError = 'Please reinsert your finger and try again.';
                                                }
                                                else{
                                                  isError = false;
                                                  $rootScope.SynsorTrackDataLength = 10;
                                                }
                                            });
                                        }
                                        else {
                                            isDissconnected = data.reason ? (data.reason.message || 'Rejected') : 'Rejected';
                                        }
                                    });
                                }
                                if (isDissconnected == 'Device is disconnected') {
                                    searchingInProgress = false;
                                    return;
                                }
                                if (!isError) {
                                    searchingInProgress = false;
                                    var oauthData = { service_name: 'synsortrack', oauth_data: totalData }
                                    if (!oauthData) {
                                        $scope.$emit("notification", {
                                            type: 'danger',
                                            message: "Error in Fetching Data!"
                                        });
                                        return;
                                    }
                                    else if (typeof oauthData == 'object') {
                                        MonitorMeasurementService //update this data with monitor
                                            .setOauthDataForMeasurement(user.id, availMeasurement.id, oauthData)
                                            .then(function (data) {
                                                $scope.$emit("notification", {
                                                    type: 'success',
                                                    message: "Data Fetched Successfully"
                                                });
                                                $scope.$emit('wait:stop');
                                                if($rootScope.SynsorTrackDataLength == 10){
                                                  $scope.gatheredData = true;
                                                }
                                                //$scope.refreshList();
                                            })
                                            .catch(function (err) {
                                                if (err.status == 422) {
                                                    $scope.$emit("notification", {
                                                        type: 'danger',
                                                        message: err.data
                                                    });
                                                }
                                                $scope.$emit('wait:stop');
                                                //$scope.refreshList();
                                            });
                                    }
                                    //modalInstance.close({ 'service_name': 'synsortrack', 'oauth_data': totalData });
                                }
                                else {
                                    var message = (typeof isError == 'string') ? isError : 'Error while fetching data';
                                    searchingInProgress = false;
                                    $scope.$emit('notification:error', message);
                                }
                                // Allow app to sleep again
                                awakeService.allowSleep();
                            })
                            .catch(function (err) {
                                if (err.error == 'enable') $scope.$emit('notification:error', 'Bluetooth not enabled');
                                if (err.error == 'invalidDevice') $scope.$emit('notification:error', 'Invalid SynsorTrack Device');
                                if (err.error != 'enable') BluetoothService.disConnectDevice(params);
                                //$scope.$emit('notification:error', 'Error while connecting to device');
                                searchingInProgress = false;

                                // Allow app to sleep again
                                awakeService.allowSleep();
                            });
                    };
          });
        };

            $scope.currentDate = moment().format('MMMM D');
            switch (moment().weekday()) {
                case 1:
                    $scope.weekDay = 'Monday'
                    break;
                case 2:
                    $scope.weekDay = 'Tuesday'
                    break;
                case 3:
                    $scope.weekDay = 'Wednesday'
                    break;
                case 4:
                    $scope.weekDay = 'Thursday'
                    break;
                case 5:
                    $scope.weekDay = 'Friday'
                    break;
                case 6:
                    $scope.weekDay = 'Saturday'
                    break;
                case 7:
                    $scope.weekDay = 'Sunday'
                    break;

                default:
                    $scope.weekDay = ''
            }
            $scope.max = 5;
            var monitorId = $route.current.params.monitorId || false;
            var measurementId = $route.current.params.measurementId || false;
            $scope.answers = [];
            $scope.questions = [];
            var questionLength = false;


            var gfDateFn = function(dateObj) {
                dateObj.setHours(0);
                dateObj.setMinutes(0);
                dateObj.setSeconds(0);
                return dateObj;
            };
            $scope.gfSteps = [];
            $scope.gfData = null;
            $scope.gfStartTime = gfDateFn(new Date());
            $scope.gfEndTime = new Date();


            $scope.valueDown = function (model, min) {
                model = Number(model);
                min = Number(min);
                return model > min ? model - 1 : model;
            };

            $scope.valueUp = function (model, max) {
                model = Number(model);
                max = Number(max);
                return model < max ? model + 1 : model;
            };

            var round5 = function (x) {
                return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
            }

            $scope.beforeNext = true;

            $scope.gatherDataNext = function(){
              $scope.beforeNext = false;
              $rootScope.SynsorTrackDataLength = 0;
              $scope.getData();
            }

            $scope.syncd = false;

            $scope.syncNext = function(){
              $scope.syncd = true;
              if($scope.oxyMeas && $scope.syncd){
                $scope.congratsScreen = true;
              }
            }

            var allMeasurements= [];
            $scope.oxyMeas = false;

            var getSubmittedSurveyLength = function(measId){
              MonitorMeasurementService.fetchData(user.id, measId, 10000) // sending very large days to get all survey data
              .then(function (data) {
                  if(data && data.extraSeries && data.extraSeries.status && data.extraSeries.status[0] && data.extraSeries.status[0].data){
                    var dataLength = data.extraSeries.status[0].data.length;
                    console.log("**** the dataLength is: " + dataLength + ", and the questionsLength is: " + questionsLength);
                    $scope.submitSurveyLength = Math.ceil(dataLength/questionsLength);
                  }
              })
              .catch(function(err){
                console.log('**** There was an error in getSubmittedSurveyLength: ' + JSON.stringify(err));
              })
            };

            MonitorMeasurementService.getMeasurementsForMonitor(user.id)
            .then(function(measurements){
                _.forEach(measurements, function(measurement){
                    if(measurement) {
                        if (measurement.name.toLowerCase() == 'status') {
                            $scope.availMeasId = measurement.id;
                            if (measurement.last_recorded && moment().startOf('day').isBefore(measurement.last_recorded)) {
                                $scope.comebackAgain = true;
                            }
                        }
                        allMeasurements.push(measurement.name);
                    }
                    if (allMeasurements && allMeasurements.indexOf('Oxygen saturation') != -1) {
                        $scope.oxyMeas = true;
                    }
                    $scope.congratsScreen = false;

                    if (!$scope.oxyMeas) {
                        $scope.showMsg = true;
                        //$scope.congratsScreen = true;
                    } else {
                        $scope.showMsg = false;
                    }
                });
            });

            var getSurveyQuestions = function () {
                $scope.$emit('wait:start');
                SurveyService.getMeasurementSurveyQuestions(monitorId, measurementId)
                    .then(function (data) {
                        $scope.instructions = data.instructions || [];
                        $scope.$emit('wait:stop');

                        if (!$scope.instructions.length) {
                            if (data && data.questions && data.questions.length) {
                                questionsLength = data.questions.length;
                                var percent = 100 / questionsLength;
                                $scope.approxPercent = round5(percent);
                            }
                            return $scope.questions = data.questions || [];
                        }

                        var modalInstance = $modal.open({
                            templateUrl: 'js/features/monitor/survey/instructions/instructions.html',
                            controller: 'SurveyInstructionModal',
                            resolve: {
                                surveyInstructions: function () {
                                    return $scope.instructions;
                                }
                            }
                        });

                        modalInstance.result //reload the monitor list
                            .then(function (oauthData) {
                            })
                            .finally(function () {
                                questionLength = data.questions.length || false;
                                $scope.questions = data.questions || [];
                            });
                    })
                    .catch(function (e) {
                        console.log('e', e);
                        $location.path('/');
                        $scope.$emit('wait:stop');
                    }
                    );

            };

            $scope.imgProgress = 0;
            $scope.exitButton = false;

            $scope.setAnswer = function (questionId, choice, index) {
                //
                $scope.gfEndTime = new Date();
                $scope.imgProgress += $scope.approxPercent;
                if (!questionId || choice == undefined) return;
                $scope.answers.push({
                    questionId: questionId,
                    choice: choice,
                    endDate: ($scope.gfEndTime).toISOString()
                });
                if ($scope.questions[index]) $scope.questions.splice(index, 1);

                if (!$scope.questions.length) {
                    $scope.saveAnswers();
                };
            };

            if($rootScope.gfAvail){
            //   var gfDataTypes = $rootScope.gfDataTypes;
            //   navigator.health.isAuthorized(gfDataTypes, function (e) {
            //     if(e){
            //       gfStartAggregatedQuery();
            //     }
            //     else {
            //         navigator.health.requestAuthorization(gfDataTypes,
            //             function (auth) {
            //                 if (auth) gfStartAggregatedQuery();
            //             },
            //             function (err) { throw err }
            //         );
            //     }
            //   },
            //   function (err) { throw err }
            // );
              navigator.health.queryAggregated({
                  startDate: $scope.gfStartTime,
                  endDate: $scope.gfEndTime,
                  dataType: 'steps',
                  bucket: 'day'
              },function (data) {
                      if (data) {
                          // $scope.gfSteps.push({
                          //     value: data[0].value,
                          //     endDate: $scope.gfEndTime.toISOString()
                          // });
                          //alert(JSON.stringify($scope.gfSteps[0].value));
                          $scope.stepReading = parseInt(data[0].value);
                      }
                  },function (err) { throw err }
              );
            }

            $scope.answeredQues = false;

            $scope.saveAnswers = function () { //done
                //alert(new Date().toISOString());
                //$scope.gfEndTime = new Date();
                console.log("*** starting saveAnswers");
                $scope.answeredQues = true;
                $scope.congratsScreen = true;
                $scope.imgProgress = 100;
                if (questionLength && questionLength != $scope.answers.length) {
                    $scope.$emit('wait:stop');
                    $location.path('/');
                    $scope.$emit('notification:error', "Survey answers saving failed");
                    return;
                }
                /*
                var oauthData = {
                    service_name: 'survey',
                    oauth_data: { status: $scope.answers }
                }*/

                /*
                var oauthData = {
                    service_name: 'survey',
                    oauth_data: { status: $scope.answers, step: $scope.gfSteps }
                }
                */

                // Testing for steps submission
                //alert("Steps array : " + $scope.gfSteps);
                $scope.surveyComplete = true;
                //$scope.surveyNext(); //Set showImg = true to show educational image


                var submitAnswersOnly = function(){
                    oauthData = {
                      service_name: 'survey',
                      oauth_data: { status: $scope.answers }
                    };
                    $scope.$emit('wait:start');

                    console.log("*** about to try to save answers without steps");
                    MonitorMeasurementService
                        .setOauthDataForMeasurement(monitorId, measurementId, oauthData)
                        .then(function (data) {
                          getSubmittedSurveyLength(measurementId);
                            //$location.path('/monitor/read');
                            $scope.exitButton = true;
                            $scope.$emit('notification:information', "Survey answers saved");
                            $scope.$emit('wait:stop');
                        })
                        .catch(function (err) {
                          getSubmittedSurveyLength(measurementId);
                            $scope.$emit('wait:stop');
                            $location.path('/');
                            $scope.$emit('notification:error', "Survey answers saving failed");
                        });
                  };

                  if($rootScope.gfAvail){
                      console.log("*** gfvail is true");
                    var gfDataTypes = $rootScope.gfDataTypes;
                    var oauthData = null;

                    navigator.health.isAuthorized(gfDataTypes,
                        function (e) {
                            if (e) {
                                gfStartAggregatedQuery();
                            } else {
                                navigator.health.requestAuthorization(gfDataTypes,
                                    function (auth) {
                                        if (auth) gfStartAggregatedQuery();
                                    },
                                    function (err) {
                                      gfStartAggregatedQuery();
                                      console.log("**** the health plugin was not authorized with err: " + JSON.stringify(err));
                                    }
                                );
                            }
                        },
                        function (err) {
                          gfStartAggregatedQuery();
                          console.log("**** the health plugin was not authorized with err: " + JSON.stringify(err));
                      }
                    );


                    var gfStartAggregatedQuery = function () {
                        navigator.health.queryAggregated({
                            startDate: $scope.gfStartTime,//new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
                            endDate: $scope.gfEndTime,//new Date(), // now
                            dataType: 'steps',
                            bucket: 'day'
                        },
                            function (data) {
                                if (data) {
                                    //alert(data[0].value);
                                    $scope.gfSteps.push({
                                        //quantity: $scope.gfData[0].value,
                                        value: data[0].value,
                                        //startDate: $scope.gfStartTime.toISOString(),
                                        endDate: $scope.gfEndTime.toISOString()
                                    });
                                    //alert(JSON.stringify($scope.gfSteps));
                                    oauthData = {
                                        service_name: 'survey',
                                        oauth_data: { status: $scope.answers, steps: $scope.gfSteps[0] }
                                    };
                                    $scope.$emit('wait:start');

                                    console.log("*** about to try to save answers EF enabled with data");
                                    MonitorMeasurementService
                                        .setOauthDataForMeasurement(monitorId, measurementId, oauthData, true)
                                        .then(function (data) {
                                          getSubmittedSurveyLength(measurementId);
                                            //$location.path('/monitor/read');
                                            $scope.exitButton = true;
                                            $scope.$emit('notification:information', "Survey answers saved");
                                            $scope.$emit('wait:stop');
                                        })
                                        .catch(function (err) {
                                            $scope.$emit('wait:stop');
                                            getSubmittedSurveyLength(measurementId);
                                            $location.path('/');
                                            $scope.$emit('notification:error', "Survey answers saving failed");
                                        }
                                        );
                                } else {
                                  submitAnswersOnly();
                                }
                            },
                            function (err) {
                              console.log("*** the gf queryAggregated had an err: " + JSON.stringify(err));
                              submitAnswersOnly();
                             }
                        );
                    }
                  }
                else{
                    console.log("*** gf avail is false");
                    submitAnswersOnly();
                }
            }

            $scope.goBack = function () {
                $location.path('/monitor/read');
            };

            $scope.closeApp = function () {
                navigator.app.exitApp();
            };

            // $scope.surveyNext = function(){
            //     if ($scope.educationChecked) {
            //         $location.path('/monitor/education');
            //     } else {
            //         $location.path('/monitor/notify/' + monitorId);
            //     }
            // }

            $scope.surveyNext = function(){
                $rootScope.surveyComplete = true;
                $location.path('/monitor/guide');
            }

            $scope.imgNext = function(){
                $scope.showImg = false;
                if($scope.oxyMeas){
                  $scope.surveyComplete = false;
                }
                else{
                  $scope.congratsScreen = true;
                  //return $location.path('/monitor/read');
                }
            }

            $scope.redirectToRead = function(){
              return $location.path('/monitor/read');
            }

            $scope.next = function(){
              MonitorMeasurementService.getMeasurementsForMonitor(user.id)
              .then(function(measurements){
                _.forEach(measurements, function(measurement){
                  if(measurement.name.toLowerCase() == 'status'){
                    return $location.path('/monitor/survey/' + user.id + '/' + measurement.id);
                  }
                  // else{
                  //   return $location.path('/monitor/read')
                  // }
                })
              })
            }

            $scope.isOptionsExists = function (questionChoices) {
                return (questionChoices && questionChoices.options);
            };

            $scope.isBoundExists = function (questionChoices) {
                return (questionChoices && questionChoices.bounds && !questionChoices.options);
            };

            $scope.isBooleanExists = function (questionChoices) {
                return (questionChoices && questionChoices.boolean);
            };

            $scope.$on("$locationChangeStart", function (event) {
                if (!$scope.questions.length || !$scope.answers.length) return; // if no question allow back
                var leave = confirm('The survey answers will not be save. Do you want to continue ?');
                if (!leave) { event.preventDefault() } else { $rootScope.signout() }
            });

            getSurveyQuestions();
        }
    ])
    .controller('SurveyInstructionModal', [
        '$scope',
        '$modalInstance',
        'surveyInstructions',
        function ($scope, $modalInstance, surveyInstructions) {
            if (!surveyInstructions || !surveyInstructions.length) return $modalInstance.close();

            var tracker = 0;
            $scope.btnTxt = 'Next';
            $scope.surveyInstructions = surveyInstructions || [];
            $scope.instruction = surveyInstructions[tracker];

            $scope.nextInstruction = function () {
                tracker++;
                if (surveyInstructions[tracker]) {
                    $scope.instruction = surveyInstructions[tracker];
                    if ((surveyInstructions.length - 1) == tracker) $scope.btnTxt = 'Finish';
                }
                else $modalInstance.close();
            };
        }
    ]);
