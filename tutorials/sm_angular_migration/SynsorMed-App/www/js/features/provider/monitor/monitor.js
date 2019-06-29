angular.module('synsormed.controllers.provider.monitor', [
  'synsormed.services.user',
  'synsormed.services.monitor',
  'synsormed.controllers.provider.view.monitor'
])
.controller('MonitorListController', [
  '$scope',
  '$modal',
  'synsormed.services.user.UserService',
  'synsormed.services.monitor.MonitorMeasurementService',
  'synsormed.services.monitor.MonitorMeasurementService',
  function($scope, $modal, UserService, MonitorService, MonitorMeasurementService) {
    var user = UserService.getUser();
    $scope.orderOptions = [ {
      id: 0,
      name: 'All'
    },
    {
      id: 1,
      name: 'Missed'
    },
    {
      id: 2,
      name: 'Out Of Range'
    }
    ];
    $scope.sort = {};
    $scope.sort.sortOrder = $scope.orderOptions[0];

    $scope.reloadView = function() {
      $scope.$broadcast('scroll.refreshComplete');
      //We want to use our own wait spinner
      fetchMonitors();
    };

    $scope.monitorFilter = {};
    $scope.$watch('sort.sortOrder', function() {
      switch ($scope.sort.sortOrder.id) {
        case 0:
        $scope.monitorFilter = {};
        break;

        case 1:
        $scope.monitorFilter = { isMissed: true };
        break;

        case 2:
        $scope.monitorFilter = {isOutofBound: true };
        break;

        default:
        $scope.monitorFilter = {};
    }
  }, true);

    var fetchMonitors = function(){
      $scope.$emit('wait:start');
      MonitorService
      .getMonitors(user.id)
      .then(function(monitors){
        $scope.monitors = monitors;
        $scope.$emit('wait:stop');
      })
      .catch(function(error){
        $scope.$emit('wait:stop');
        console.log(error);
      });
  };
  fetchMonitors();
  $scope.viewMonitor = function(monitor){
      console.log("id",monitor.id)
      var modalInstance = $modal.open({
          templateUrl: 'js/features/provider/monitor/insights/viewMonitor.html',
          controller: 'viewMonitorController',
          resolve: {
              monitor: function () {
                  return monitor;
              },
              measurements: function(){
                  return MonitorMeasurementService.getMeasurementsForMonitor(monitor.id)
              }
          }
      });
  }
}]);
