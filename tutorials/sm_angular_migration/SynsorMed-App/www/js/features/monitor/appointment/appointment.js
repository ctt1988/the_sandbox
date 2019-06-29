angular.module('synsormed.controllers.monitor.appointment', [
        'synsormed.services.user',
        'synsormed.services.monitor'
    ])
    .controller('MonitorAppointmentController', [
        '$scope',
        '$location',
        '$modal',
        'synsormed.services.user.UserService',
        'synsormed.services.monitor.MonitorAppointmentService',
        function($scope, $location, $modal, UserService, MonitorAppointmentService) {
          $scope.monitor = UserService.getUser();
          $scope.date = {
              selected : $scope.monitor.appointmentMeta[0]
          };

          $scope.schedule = function(){
                $scope.$broadcast('validate');

                if($scope.date.selected == null){
                  return;
                }

                $scope.$emit("wait:start");

                MonitorAppointmentService
                  .setAppointment($scope.monitor.id,$scope.date.selected)
                  .then(function(data){
                    $scope.$emit("wait:stop");
                    $location.path('/monitor/read');
                    $scope.$emit('notification:success',"Appointment Fixed");
                  })
                  .catch(function(e){
                    $scope.$emit("wait:stop");
                    $scope.$emit('notification:error',"Server Error");
                  })
          };

          $scope.showTutorial = function () {
              var modalInstance = $modal.open({
                  windowClass: 'newAppointmentIntro',
                  templateUrl: 'js/features/monitor/appointment/intro.html',
                  controller: 'MonitorAppointmentIntroController'
              });
          };

          $scope.showTutorial();
    }])
    .controller('MonitorAppointmentIntroController',[
      '$scope',
      '$modalInstance',
      function($scope, $modalInstance){
        $scope.close = function(){
          $modalInstance.dismiss();
        }
      }
    ])
