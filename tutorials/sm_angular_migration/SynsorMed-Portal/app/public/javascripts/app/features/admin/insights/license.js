'use strict';

angular.module('synsormed.features.admin.insights.license', [])
.controller('InsightsLicenseController', [
    '$scope',
    '$modalInstance',
    'synsormed.services.adminInsight.InsightService',
    'organization',
    function($scope, $modalInstance, InsightService, organization){

        InsightService.getOrganization(organization.id)
        .then(function(resp){
            $scope.licenseCount = resp.license_count
        });

        // $scope.$watch('licenseCount', function (count) {
        //   console.log('count', count)
        // });

        $scope.send = function(){
            $scope.$broadcast('validate');
            //if(!$scope.form.$valid) return;
            $scope.waiting = true;
            InsightService.saveLicense(organization.id, $scope.licenseCount)
            .then(function(res){
                $scope.waiting = false;
                $scope.$emit("notification", {
                    type: 'success',
                    message: "Notification successfully sent"
                });
                $modalInstance.dismiss();
            })
            .catch(function(e){
                var msg = "Notification sending failed";
                if(e && e.data && e.data.code && e.data.code == 404){
                    msg = 'This user does not have messaging enabled';
                }
                $scope.waiting = false;
                $scope.$emit("notification", {
                    type: 'danger',
                    message: msg
                });
            });
        };

        $scope.cancel = function(){
            $modalInstance.dismiss();
        };
    }
]);
