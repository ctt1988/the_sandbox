
angular.module('synsormed.controllers.patient.pay', [
    'synsormed.services.user',
    'synsormed.services.payment'
])
.controller('patientPayController', [
    '$scope',
    '$location',
    '$q',
    'synsormed.services.payment.PaymentService',
    'synsormed.services.user.UserService',
    'synsormed.services.logging.time',
    function($scope, $location, $q, PaymentService, UserService, TimeLogger) {
        TimeLogger.log("PaymentScreen");
        var user = UserService.getUser();
        $scope.user = user;
        
        $scope.$on('setForm', function (evt, form) {
            $scope.form = form;
        });
        
        $scope.payment = {
            amount: user.fee
        };

        $scope.gotoLogon = function() {
            $location.path('/login');
        };
        
        $scope.submit = function() {
            console.log($scope.form)
            $scope.form.$setDirty();
            $scope.$broadcast('validate');
            
            if ($scope.form.$valid) {
                $scope.$emit('wait:start');
                PaymentService.makePayment(UserService.getUser(), $scope.payment).then(function() {
                    $scope.$emit('wait:stop');
                    $location.path('/patient/call');
                }).catch(function(err) {
                    $scope.$emit('wait:stop');
                    $scope.$emit('service:error', err);
                })
            } else {
                console.log("It is not valid")
            }
        };
    }
]);

