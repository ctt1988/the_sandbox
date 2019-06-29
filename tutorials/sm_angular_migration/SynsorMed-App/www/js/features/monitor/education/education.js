angular.module('synsormed.controllers.monitor.education', [
    'synsormed.services.user',
    'ui-rangeSlider'
])
.controller('MonitorEducationController', [
    '$scope',
    '$rootScope',
    '$route',
    '$location',
    'synsormed.services.user.UserService',
    function ($scope, $rootScope, $route, $location, UserService) {
        var user = UserService.getUser();
        $scope.onNext = function() {
            //$location.path('/monitor/notify/' + $scope.monitor.id);
            $rootScope.educationComplete = true;
            $location.path('/monitor/guide');
        };
    }
])
