"use strict";
angular.module('synsormed.features.ehr.monitor', [])
.controller('EhrMonitorController', ['$scope', '$rootScope', function($scope, $rootScope){
    $rootScope.page = {
        title: "Synsormed: EHR Monitor"
    };
    $scope.$emit('noMenu');
    $scope.monitor = {
        id: 14,
        patientCode: 'ZP4kSE'
    };
    $scope.measurements = [{
        id: 1,
        name: 'Glucose',
        unit: 'mg/dL'
    },
    {
        id: 2,
        name: 'Blood Pressure',
        unit: ''
    },
    {
        id: 3,
        name: 'Steps',
        unit: ''
    },
    {
        id: 4,
        name: 'Weight',
        unit: 'lbs'
    }];
    $scope.useUser = {
        id: 1
    };
    $scope.data = {
        description: 'Monitoring Glucose',
        notify: true,
        sensitivity: 2
    };
    $scope.monitorMeasurements = [];
    $scope.addIndicator = function(){
        if($scope.monitorMeasurements.length >= 5)
        {
            $scope.$emit("notification", {
                type: 'danger',
                message: "Only 5 health indicator's are allowed"
            });
            return;
        }
        else {
            $scope.monitorMeasurements.push({});
        }

    };
    $scope.users = [{
        id: 1,
        name: 'Dr. Elizabeth Oliver'
    },
    {
        id: 2,
        name: 'Dr. Anderson Abbott'
    },
    {
        id: 3,
        name: 'Dr. Phil Banks'
    },
    {
        id: 4,
        name: 'Dr. Sandra Lee'
    }];
    $scope.$on("$destroy", function() {
        $scope.$emit('showMenu');
    });
}]);
