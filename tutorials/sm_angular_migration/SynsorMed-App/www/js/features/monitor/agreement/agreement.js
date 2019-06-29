angular.module('synsormed.controllers.monitor.agreement', [
        'synsormed.services.user'
    ])
    .controller('MonitorAgreementController', [
        '$scope',
        '$location',
        'synsormed.services.user.UserService',
        'synsormed.services.logging.time',
        'synsormed.services.monitor.MonitorMeasurementService',
        function($scope, $location, UserService, TimeLogger, MonitorMeasurementService) {
        TimeLogger.log("AgreementScreen");
        $scope.gotoLogon = function() {
            console.log("Trying to go to logon");
            $location.path('/login/patient');
        };

        $scope.continue = function() {
            //console.log("Trying to go to cc");
            var user = UserService.getUser();
            user.termsAccepted = true;
            user.save().then(function () {
                var oxyData = false;
                var statusData = false;
                var availMeasurements = [];
                var surveyMeasurement = {};
                MonitorMeasurementService.getMeasurementsForMonitor(user.id)
                .then(function(measurements){
                    _.forEach(measurements, function(measurement){
                        availMeasurements.push(measurement.name);
                        if(measurement && measurement.name.toLowerCase() == 'oxygen saturation' && measurement.serviceName){
                            oxyData = true;
                        }
                        else if(measurement && measurement.name.toLowerCase() == 'status'){
                            statusData = true;
                            surveyMeasurement = measurement;
                        }
                    })
                    if(availMeasurements && availMeasurements.length == 1 && availMeasurements.indexOf('Oxygen saturation') != -1){
                        return $location.path('/monitor/read');
                    }
                    else if(availMeasurements && availMeasurements.length == 1 && availMeasurements.indexOf('Status') != -1){
                        return $location.path('/monitor/survey/' + user.id + '/' + surveyMeasurement.id);
                    }
                    else if(oxyData && statusData){
                        return $location.path('/monitor/survey/' + user.id + '/' + surveyMeasurement.id);
                    }
                    else if(!oxyData && statusData){
                        return $location.path('/monitor/read');
                    }
                    else{
                        return $location.path('/monitor/read');
                    }
                })
            }).catch(function (err) {
                $scope.$emit('service:error', err);
            });
        };

    }]);
