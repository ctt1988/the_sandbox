'use strict';

angular.module('synsormed.controllers.monitor.leaderboard',[
    'synsormed.services.user',
    'synsormed.services.monitor'
])
.controller('MonitorLeaderboardController',[
    '$scope',
    'synsormed.services.user.UserService',
    'synsormed.services.monitor.MonitorLeaderboardService',
    function($scope, UserService, MonitorLeaderboardService){
        $scope.monitor = UserService.getUser();
        if(!$scope.monitor || !$scope.monitor.isEnrolled) return false;
        $scope.enrolled = [];

        $scope.enrolledMonitors = function(){
            $scope.$emit("wait:start");
            MonitorLeaderboardService
            .getEnrolledMonitors($scope.monitor.id)
            .then(function(enrolled){
                $scope.enrolled = enrolled;
                $scope.$emit("wait:stop");
            })
            .catch(function(err){
                console.log(err);
                $scope.$emit("wait:stop");
            });
        };

        $scope.enrolledMonitors();
}]);
