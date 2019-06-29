'use strict';

angular.module('synsormed.serviceprovider.synsormed', [
    'synsormed.services.user',
    'synsormed.services.service_provider'
])
.controller('SynsorMedController', [
    '$scope',
    '$location',
    'synsormed.services.user.UserService',
    'synsormed.services.service_provider.Synsormed',
    function($scope, $location, UserService, Synsormed){
        var monitor = UserService.getUser();

        $scope.$emit("wait:start");
        Synsormed.getMeasurements(monitor.code)
        .then(function(services){
            $scope.services = services || [];
            $scope.$emit("wait:stop");
        })
        .catch(function(err){
            console.log(err);
            $scope.$emit("wait:stop");
        });

        $scope.openLogBar = function(service){
            return $location.path('/serviceprovider/synsormed/'+ service.name);
        };
    }
])
.controller('logDataController', [
    '$scope',
    '$routeParams',
    'synsormed.services.user.UserService',
    'synsormed.services.service_provider.Synsormed',
    function($scope, $routeParams, UserService, Synsormed){
        var today = new Date();
        $scope.datePickerMax = today;
        $scope.currentDate = today;
        $scope.currentTime = today;
        $scope.restrictions = {
            allowDicimal: false
        };
        var service = $routeParams.measurementName;
        var monitor = UserService.getUser();
        var getMaxlength = function(){
            var maxlength = 1;
            switch ($scope.service.name.toLowerCase()) {
                case 'weight':
                case 'glucose':
                case 'blood pressure':
                case 'heartrate':
                case 'oxygen saturation':
                maxlength = 3;
                break;
                case 'caloric intake':
                maxlength = 4;
                break;
                case 'peak flow rate':
                case 'temperature':
                case 'steps':
                maxlength = 5;
                break;
            }
            return maxlength;
        };

        $scope.$emit("wait:start");
        Synsormed.getMeasurements(monitor.code)
        .then(function(services){
            $scope.$emit("wait:stop");
            _.forEach(services, function(s){
                if(s.name == service){
                    $scope.service = s;
                }
            });

            if($scope.service.name.toLowerCase() == 'temperature'){
                $scope.restrictions = {
                    allowDicimal: true, maxWithoutDecimal: 3
                };

                $scope.$watch('dataPoint', function(newValue, oldValue){
                    if(!newValue) return false;
                    var dataPoint = newValue.toString();
                    var isContainDecimal = dataPoint.indexOf('.') != -1;
                    if(dataPoint.length == 4 && !isContainDecimal){
                        $scope.dataPoint = oldValue;
                    }
                });
            }

            $scope.currentMaxLength = getMaxlength();

        })
        .catch(function(err){
            console.log(err);
            $scope.$emit("wait:stop");
        });



        $scope.onBlur = function(){
            if($scope.dataPoint && ($scope.service.name.toLowerCase() == 'temperature' || $scope.service.name.toLowerCase() == 'peak flow rate') ){
                var data = $scope.dataPoint.toString();
                if(data.indexOf('.') == -1){
                    $scope.dataPoint = data + ".0"
                }
                else if(!data.split('.')[1].length){
                    $scope.dataPoint = data + "0";
                }
            }
        };

        $scope.logData = function(){
            $scope.$broadcast('validate');
            if(!$scope.form.$valid) return false;
            var value = ($scope.form.dataPoint2 && $scope.form.dataPoint2.$modelValue) ?
            $scope.form.dataPoint.$modelValue  + '/' + $scope.form.dataPoint2.$modelValue :
            $scope.form.dataPoint.$modelValue;
            var date = $scope.form.endDate.$modelValue;
            var time = $scope.form.endTime.$modelValue;
            var endDate = moment(date).hour(time.getHours()).minute(time.getMinutes()).toString();
            var data = {};
            data[$scope.service.name.toLowerCase()] = {
                endDate: endDate,
                value: value
            };
            $scope.$emit("wait:start");
            Synsormed.createEntry(monitor.id, data, 'synsormed')
            .then(function(res){
                $scope.$emit('notification:success', 'Logged successfully for '+$scope.service.name);
                $scope.$emit("wait:stop");
                window.history.back();
            })
            .catch(function(e){
                console.log(e);
                $scope.$emit('notification:error', 'Log failed for '+$scope.service.name);
                $scope.$emit("wait:stop");
            });
        };
    }
]);
