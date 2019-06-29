angular.module('synsormed.controllers.monitor.notify', [
    'synsormed.services.user',
    'ui-rangeSlider'
])
.controller('MonitorNotifyController', [
    '$scope',
    '$rootScope',
    '$route',
    '$location',
    'synsormed.services.user.UserService',
    'synsormed.services.monitor.MonitorMeasurementService',
    function ($scope, $rootScope, $route, $location, UserService, MonitorMeasurementService) {
        $scope.answered = false;
        $scope.answer = false;
        $scope.currentDate = moment().format('MMMM D');
        $scope.weekDay = moment().format('dddd');
        $scope.monitor = UserService.getUser();
        $scope.saveNotifyStatus = function(notifyRequested) {
            $scope.answered = true;
            $scope.answer = notifyRequested;
            if (notifyRequested) {
                $scope.$emit('wait:start');
                MonitorMeasurementService.saveNotifyStatus($scope.monitor.id, true)
                .then(() => {
                    $scope.$emit('wait:stop');
                })
                .catch(function(e) {
                    console.log(e);
                    $scope.$emit('wait:stop');
                });
            }
        };
    }
])
