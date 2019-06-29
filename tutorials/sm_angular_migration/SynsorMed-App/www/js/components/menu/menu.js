'use strict';

angular.module('synsormed.components.menu', ['pageslide-directive'])
    .controller('synsormed.components.menu.MenuController', [
        '$rootScope',
        '$scope',
        '$location',
        'localStorageService',
        function ($rootScope, $scope, $location, localStorageService) {
            $scope.isLoggedIn = false;
            $scope.isProvider = false;
            $scope.isEnrolled = false;
            $scope.navigationVisible = false;
            $scope.toggle = function () {
                $scope.navigationVisible = !$scope.navigationVisible;
            };
            $scope.sync = function () {
                $location.path('/patient/connect');
            };

            $scope.logout = function () {
                localStorageService.remove('user-loggedin');
                localStorageService.remove('saveUser');
                localStorageService.remove('logginProvider');
                localStorageService.remove('synsormed:patient:code');
                localStorageService.remove('savedUsername');
                // Google Fit
                if ($rootScope.gfOauth) {
                    navigator.health.disconnect(
                        function (disconnected) {
                            //alert('Successfully disconnected google fit account.');
                            $rootScope.gfOauth = false;
                            $rootScope.gfAvail = false;
                            $rootScope.gfAuthorized = false;
                        },
                        function (err) {
                            //alert('Error at logout : ' + err);
                        }
                    );
                    $location.path('/');
                } else {
                    $location.path('/logout');
                }
                // End Google Fit Disconnect
            };

            $rootScope.signout = function () { //For google Fit implementations
                localStorageService.remove('user-loggedin');
                localStorageService.remove('saveUser');
                localStorageService.remove('logginProvider');
                localStorageService.remove('synsormed:patient:code');
                localStorageService.remove('savedUsername');
                // Google Fit
                if ($rootScope.gfOauth) {
                    navigator.health.disconnect(
                        function (disconnected) {
                            //alert('Successfully disconnected google fit account.');
                            $rootScope.gfOauth = false;
                            $rootScope.gfAvail = false;
                            $rootScope.gfAuthorized = false;
                        },
                        function (err) {
                            console.log(err);
                            //alert('Error at logout : ' + err);
                        }
                    );
                    $location.path('/');
                } else {
                    $location.path('/logout');
                }
                // End Google Fit Disconnect
            };

            $scope.getMonitors = function () {
                $location.path('/provider/monitor');
            };
            $scope.getVisits = function () {
                $location.path('/provider/list');
            };
            $scope.messages = function () {
                $location.path('/messages');
            };
            $scope.leaderboardPage = function () {
                $location.path('/monitor/leaderboard');
            };
        }])
    .directive('synsormedMenu', [function () {
        return {
            controller: 'synsormed.components.menu.MenuController',
            restrict: 'E',
            templateUrl: 'js/components/menu/menu.html',
            scope: {
                isLoggedIn: "@",
                isProvider: "@",
                isEnrolled: "@"
            }
        };
    }]);
