angular.module('synsormed.controllers.provider.view.monitor',[
])
.controller('viewMonitorController', [
    '$scope',
    '$modalInstance',
    'monitor',
    'measurements',
    'synsormed.services.monitor.MonitorMeasurementService',
    function($scope, $modalInstance, monitor, measurements, MonitorMeasurementService){
        console.log("Monitor",monitor)
        console.log("measurements",measurements)
        $scope.monitor = monitor;
        $scope.measurements = measurements;
        $scope.notification = false;
        $scope.ok = function(){
            $modalInstance.close();
        };
        $scope.selectedMeasurement = function(measurement){
            $scope.$emit("wait:start");
            $scope.measurement = measurement;
            MonitorMeasurementService
            .fetchData(monitor.id, measurement.id)
            .then(function(data){
                $scope.notification = false;
                $scope.results = [];
                angular.forEach(data, function(value,key){
                    angular.forEach(value[0].data, function(value1, key1){
                        $scope.results.push({
                            reading: value1.extra.reading,
                            date: value1.extra.date
                        });
                    });
                    angular.forEach(value[1].data, function(value2, key2){
                        $scope.results[key2].reading1 = value2.extra.reading;
                    });
                });
                $scope.$emit("wait:stop");
            })
            .catch(function(error){
                console.log("Error",error)
                if(error.status === 409)
                {
                    $scope.notification = error.data || 'Service has no readings submitted in the last 30 days for the current measurement';
                }
                else if (error.status === 404) {
                    $scope.notification = 'No service linked';
                }
                else {
                    $scope.notification = 'No readings available';
                }
                $scope.$emit("wait:stop");
            });
        };
        if(measurements.length){
            $scope.selectedMeasurement(measurements[0]);
            $scope.measurement = measurements[0];
        }
}]);
