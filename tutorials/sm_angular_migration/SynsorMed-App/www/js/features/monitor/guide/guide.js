angular.module('synsormed.controllers.monitor.guide', [
    'synsormed.services.survey',
    'synsormed.services.monitor',
    'ui-rangeSlider'
])
    .controller('MonitorGuideController', [
        '$scope',
        '$q',
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
        function ($scope, $q, $rootScope, $route, $modal, $location, $interval, BluetoothService, BluetoothStorageService, SurveyService, MonitorServicesService, MonitorMeasurementService, UserService, awakeService) {
            var user = UserService.getUser();

            $scope.greetingComplete = $rootScope.greetingComplete;

            var hasEducationChecked;
            var educationComplete = $rootScope.educationComplete ? $rootScope.educationComplete : null;
            
            var hasDevicesLinked;
            var devicesComplete = $rootScope.devicesComplete ? $rootScope.devicesComplete : null;

            var hasSurvey;
            var surveyComplete = $rootScope.surveyComplete ? $rootScope.surveyComplete : null;

            var allPromises = [];

            var surveyPath;

            var monitorId;



            $scope.onBegin = function() {
                console.log("onBegin was pressed");
                $rootScope.greetingComplete = true;
                $route.reload();
            };

            if($scope.greetingComplete){

                //First, let's get the scope of this guided session. Find out what the user is supposed to see so that
                //we can guide her through the experience.


                //Find out of Education is checked for this monitor
                allPromises[0] =  UserService.loadMonitor(user);


                //Find out if devices are linked for meausrements
                allPromises[1] = MonitorServicesService.getConnectedService(user.id);


                //Find out if a survey should be shown
                allPromises[2] = MonitorMeasurementService.getMeasurementsForMonitor(user.id);

                $q.all(allPromises)
                .then(function(response){
                    //console.log("*** all promises are now finished: " + JSON.stringify(response));

                    //Handle education data:
                    var educationResponse = response[0]; 
                    //console.log("*** the monitor for this user is: " + JSON.stringify(educationResponse));
                    hasEducationChecked = educationResponse.educationChecked;
                    monitorId = educationResponse.id;


                    //Handle device data:
                    var deviceResponse = response[1];
                    console.log("*** The connected non-survey services for this monitor are: " + JSON.stringify(deviceResponse));
                    if(deviceResponse.length){
                        hasDevicesLinked = true;
                    }else{
                        hasDevicesLinked = false;
                    }

                    //Handle Survey data:
                    var surveyResponse = response[2];
                    //console.log("*** the measurement info for this monitor is: " + JSON.stringify(surveyResponse));
                    _.forEach(surveyResponse, function(measurement){
                      if(measurement.name.toLowerCase() == 'status'){
                        hasSurvey = true;
                        surveyPath = '/monitor/survey/' + user.id + '/' + measurement.id;
                        //return $location.path('/monitor/survey/' + user.id + '/' + measurement.id);
                        }
                    })

                    //By this point, we should know if any of the 3 main phases should be shown: Education, devices, survey
                    //Now, we decide on where to direct the user based on this info

                    //1st stop is devices. We want to give the user the option of sending data from devices first
                    if(hasDevicesLinked && !devicesComplete){
                    //if(true && !devicesComplete){
                        console.log("*** Sending user to device workflow");
                        $location.path('/monitor/bluetooth');
                    }

                    //2nd stop is eduction. After getting device info, we need to decide if we need to send them to edu page
                    else if(hasEducationChecked && !educationComplete){
                        console.log("*** Sending user to education workflow");
                        $location.path('/monitor/education');
                    }

                    //3rd stop is survey. The last info we want to get is the survey
                    else if(hasSurvey && !surveyComplete){
                        console.log("*** Sending user to survey workflow");
                        $location.path(surveyPath);
                    }

                    //4th stop is notify.
                    else{
                        console.log("*** Sending user to notify workflow");
                        $location.path('/monitor/notify/' + monitorId);
                    }



                }); 
            } 
        }
    ])
