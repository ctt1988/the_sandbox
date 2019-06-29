angular.module('synsormed.features.login', [
    'synsormed.services.user'
])
    .controller('LoginController', [
        '$scope',
        'synsormed.services.UserService',
        '$route',
        '$location',
        'localStorageService',
        function ($scope, UserService, $route, $location, localStorageService) {

            var saveEmailKey = 'savedEmail';
            $scope.rememberMe = !!localStorageService.get(saveEmailKey);
            $scope.passwordView = false;

            //if we have email in localstorage get it
            if ($scope.rememberMe) {
                $scope.email = localStorageService.get(saveEmailKey);
            }

            if ($location.search().showRegistrationMessage) {
                $scope.showRegistrationMessage = true;
            }

            $scope.submit = function () {
                console.log('redirectRequestUrl()');
                var directPath = UserService.redirectPath();
                console.log(directPath);
                $scope.$broadcast('validate');
                if (!$scope.form.$valid) {
                    return;
                }
                $scope.$emit('wait:start');

                /**
                 * This should never be done, but due to a bug with autofilled forms, it has to be..
                 */
                $("input").trigger('change');
                /**
                 * End hack
                 */
                UserService.login($scope.email, $scope.password)
                    .then(function (user) {
                        $scope.$emit('wait:stop');
                        UserService.setCachedUser(user);

                        //remember the user
                        if ($scope.rememberMe) {
                            localStorageService.set(saveEmailKey, $scope.email);
                        } else { //or forget
                            localStorageService.remove(saveEmailKey);
                        }
                        if (directPath) {
                            $location.path(directPath);
                        } else {
                            switch (user.role.toLowerCase()) {
                                case 'orgcreator':
                                case "superadmin":
                                    $location.path('/monitor');
                                    break;
                                case "admin":
                                    $location.path('/monitor');
                                    break;
                                case "provider":
                                    $location.path('/monitor');
                                    break;
                                case "user":
                                    $location.path('/generateCode');
                                    break;
                            }
                        }
                    }).catch(function (resp) {
                        $scope.$emit('wait:stop');
                        $location.search({
                            'showRegistrationMessage': null
                        });
                        $scope.$emit('wait:stop');
                        if (resp.status == 403) {
                            $scope.alert = {
                                msg: 'Your organization has been deactivated.',
                                type: 'danger'
                            };
                        }
                        else if (resp.data == 'Block User') {
                            $scope.alert = {
                                msg: 'Your account has been blocked. Please try again at a later time.',
                                type: 'danger'
                            };
                        }
                        else {
                            $scope.alert = {
                                msg: 'Please verify your username and password and try again.',
                                type: 'danger'
                            };
                        }
                    });
                $scope.$emit('pageLoaded', {
                    title: "Login"
                });
            };
        }]);
