angular.module('synsormed.controllers.patient.agreement', [
        'synsormed.services.user'
    ])
    .controller('patientAgreementController', [
        '$scope', '$location',
        'synsormed.services.user.UserService',
        'synsormed.services.logging.time',
        function($scope, $location, UserService, TimeLogger) {
        TimeLogger.log("AgreementScreen");
        $scope.gotoLogon = function() {
            console.log("Trying to go to logon");
            $location.path('/login');
        };

        $scope.continue = function() {
            //console.log("Trying to go to cc");
            var user = UserService.getUser();
            user.termsAccepted = true;
            user.save().then(function () {
                if(!user.paid && user.fee > 0) {
                    $location.path('/patient/pay');
                } else {
                    $location.path('/patient/call');
                }
            }).catch(function (err) {
                $scope.$emit('service:error', err);
            });
        };

    }]);
