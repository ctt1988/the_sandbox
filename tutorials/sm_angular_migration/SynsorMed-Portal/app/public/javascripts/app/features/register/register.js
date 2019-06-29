angular.module('synsormed.features.register', [
    'synsormed.services.practice'
])
.controller('RegisterController', [
    '$scope',
        '$location',
        'synsormed.services.PracticeService',
        'synsormed.services.UserService',
    function ($scope, $location, PracticeService, UserService) {
        $scope.adminUser = UserService.fetchCachedUser();
        $scope.showForm = true;
        $scope.user = {};
        $scope.practice = {};
        $scope.$on('setForm', function (evt, form) {
            $scope.form = form;
        })

        $scope.$watch('user', function () {
            $scope.passwordPattern = false
            if($scope.user.confirmPassword ) {
                if($scope.form.password.$invalid && $scope.form.password.$error.pattern) {
                    $scope.passwordPattern = true;
                }
                else{
                  $scope.passwordPattern = false;
                }
            }
            if($scope.user.password && $scope.user.confirmPassword && $scope.user.password != $scope.user.confirmPassword) {
                if($scope.form.password.$dirty) {
                    $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
                }
                if($scope.form.confirmPassword.$dirty) {
                    $scope.$broadcast('setInvalid:confirmPassword', '');
                }
            } else if($scope.form) {
                if($scope.form.password.$dirty) {
                    $scope.$broadcast('setValid:password', 'Password and Confirm Password must match');
                }
                if($scope.form.confirmPassword.$dirty) {
                    $scope.$broadcast('setValid:confirmPassword', '');
                }
            }
        }, true);

        $scope.submit = function () {
            if($scope.user.password != $scope.user.confirmPassword) {
                $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
                $scope.$broadcast('setInvalid:confirmPassword', '');
                return;
            }

            $scope.$broadcast('validate');
            if(!$scope.form.$valid) {
                return;
            }
            $scope.$emit('wait:start');
            PracticeService.registerPractice({
                practice: $scope.practice,
                adminUser: $scope.user
            }).then(function (user) {
                $scope.$emit('notification',{
                  type:  'success',
                  message: 'Registration Successfull'
                });
                $scope.$emit('wait:stop');
                if($scope.adminUser.role == 'OrgCreator'){
                  $location.path('/admin/insights');
                  return;
                }
                $location.path('/organization/'+user.org_id);
            }).catch(function (resp) {
                $scope.$emit('wait:stop');

                var msg = (resp.status == 422 ? resp.data : 'Server Error') || 'Server Error';
                $scope.$emit('notification',{
                  type:  'danger',
                  message: msg
                });
                console.log(resp);
            })
        }
    }
])
