
angular.module('synsormed.controllers.provider.forgotPass', [
        'synsormed.services.user'
    ]).
    controller('providerForgotPassController', [
        '$scope',
        '$location',
        '$route',
        'synsormed.services.user.UserService',
        function($scope, $location, $route, UserService) {
            $scope.user = {
                email: $route.current.params.email
            };
            
            $scope.submit = function () {
                $scope.$broadcast('validate');
                $scope.form.$setDirty();

                if(!$scope.form.$valid) {
                    console.log("Invalid", $scope.form)
                    return;
                }
                UserService.sendForgotPassword($scope.user.email).then(function () {
                    $scope.$emit('notification:success', 'You will recieve an email shortly with instructions');
                }).catch(function (err) {
                    if(err.code === 404) {
                        $scope.$emit('notification:warning', 'Email was not found.');
                    } else {
                        $scope.$emit('service:error', err);
                    }
                })
            };
        }
    ]);

