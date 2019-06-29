'use strict';
angular.module('synsormed.features.emergency',[
    'synsormed.services.user'
])
.controller('EmergencyAccessController',[
    '$scope',
    '$location',
    'synsormed.services.UserService',
    function($scope,$location,UserService){
        $scope.alerts = [
            { type: 'warning', msg: 'Use organization OTP here' },
        ];
        $scope.submit = function(){
            if(!$scope.form.$valid){
                return;
            }
            $scope.$emit('wait:start');
            UserService.emergencyAccess($scope.otpCode)
            .then(function(user){
                $scope.$emit('wait:stop');
                UserService.setCachedUser(user);
                $location.path('/settings');
            })
            .catch(function(err){
                $scope.$emit('wait:stop');
                $scope.alerts = [{
                    msg: 'You have entered an Invalid OTP',
                    type: 'danger'
                }];
                console.log('err',err);
            });
        }
    }
]);
