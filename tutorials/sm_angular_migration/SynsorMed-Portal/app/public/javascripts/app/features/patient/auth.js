"use strict";

angular.module('synsormed.features.patient.auth',[
    'synsormed.services.user'
])
.controller('PatientAuthController',[
    '$scope',
    '$location',
    'synsormed.services.UserService',
    function($scope, $location, UserService){

        $scope.submit = function(){
            $scope.$broadcast('validate');
            if(!$scope['patient-form'].$valid) return;

            $scope.$emit('wait:start');
            UserService.patientLogin($scope.patientCode)
            .then(function(user){
                $scope.$emit('wait:stop');
                if(user.isMonitor){
                    $scope.alerts = [{ msg: 'Please check your patient code and try again.', type: 'danger' }];
                }
                else{
                    $scope.alerts = [];
                    UserService.setCachedUser(user);
                    $location.path('/patient/call');
                }
            })
            .catch(function(err){
                console.log(err);
                $scope.$emit('wait:stop');
                $scope.alerts = [{ msg: 'Please check your patient code and try again.', type: 'danger' }];
            });
        };
    }
]);
