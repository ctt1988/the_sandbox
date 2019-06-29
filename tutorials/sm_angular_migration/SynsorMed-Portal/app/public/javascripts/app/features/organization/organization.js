angular.module('synsormed.features.organization', [
  'synsormed.services.user',
  'synsormed.services.practice',
  'synsormed.services.adminInsight'
])
.controller('OrganizationController', [
  '$scope',
  '$routeParams',
  '$modal',
  'synsormed.services.UserService',
  'synsormed.services.PracticeService',
  'synsormed.services.adminInsight.InsightService',
  function($scope, $routeParams, $modal, UserService, PracticeService, InsightService){
    var orgId = $routeParams.id;

    $scope.org = null;

    $scope.changeStatus = function(orgid){
      $scope.$emit('wait:start');
      PracticeService.changeOrgStatus(orgid, $scope.enabled)
      .then(function(){
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
              type: 'success',
              message: "Update Successful"
          });
      })
      .catch(function(){
        $scope.$emit('wait:stop');
        $scope.$emit("notification", {
            type: 'danger',
            message: "Update Unsuccessful"
        });
      });

    };
    $scope.getOrganizationStatistics = function(){
      $scope.$emit('wait:start');

      InsightService.getOrganizationStatistics(orgId)
        .then(function(data){
          $scope.enabled = data.status;
          $scope.org = data;
          $scope.$emit('wait:stop');
        })
        .catch(function(){
          $scope.org = null;
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
              type: 'danger',
              message: "Server error."
          });
        });
    };

    $scope.getOrganizationStatistics();

    //show details about a provider
    $scope.getDetails = function(provider){
      var instance = $modal.open({
          templateUrl: 'javascripts/app/features/organization/details.html',
          controller: 'ProviderStatisticsModalController',
          resolve: {
              user: function () {
                  return $.extend({}, provider);
              },
              data : function(){
                  return InsightService.getProviderStatistics(provider.id);
              }
          }
      });
    }

}])
.controller('ProviderStatisticsModalController',[
  '$scope',
  '$modalInstance',
  'user',
  'data',
  function($scope,$modalInstance,user,data){

      $scope.user = user;
      $scope.data = data;

      $scope.ok = function () {
          $modalInstance.dismiss('cancel');
      };
  }
])
