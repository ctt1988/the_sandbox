angular.module('synsormed.controllers.provider.showEncounter',[])
.controller('ShowEncounterController', [
  '$scope',
  '$location',
  'encounter',
  '$modal',
  function ($scope, $location, encounter, $modal) {
    $scope.encounter = encounter;

    $scope.printInfo = function () {
      window.print();
    };
    $scope.sendEmail = function () {
      //Send to email modal
      var modalInstance = $modal.open({
        templateUrl: 'javascripts/app/features/provider/showCode/emailCode.html',
        controller: 'EmailCodeController',
        resolve: {
          encounter: function () {
            return encounter;
          }
        }
      });

      //on modal close
      modalInstance.result.then(function (data) {
        if(data)
        {
          //if email sent
          $scope.$emit("notification", {
            type: 'success',
            message: "Success"
          });
        }
        else {
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server Error."
          });
        }
      });

    };
    $scope.$emit('pageLoaded', {
      title: "Print Code"
    });
  }])
  .controller('EmailCodeController', [
    '$scope',
    '$modalInstance',
    'encounter',
    'synsormed.services.EmailService',
    function($scope, $modalInstance, encounter, EmailService){
      $scope.encounter = encounter;
      $scope.email = {
        data: null
      };

      $scope.$on('setForm', function (evt, form) {
          $scope.form = form;
      });

      $scope.ok = function () {

        //for validation
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
            return;
        }

        $scope.$emit('wait:start');

        //email service  for sending emails
        EmailService.sendCodeEmail($scope.email.data, $scope.encounter.id, 'encounter').then(function(){
            $scope.$emit('wait:stop');
            $modalInstance.close(true);
        })
        .catch(function(err){
          console.error(err);
          $scope.$emit('wait:stop');
          $modalInstance.close(false);
        });

      };
      $scope.cancel = function () {
        $modalInstance.dismiss();
      };
    }]);
