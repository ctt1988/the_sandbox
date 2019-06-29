"use strict";

angular.module('synsormed.features.admin.insights',[
  'synsormed.services.user',
  'synsormed.services.adminInsight',
  'synsormed.features.admin.insights.license'
])
.controller('AdminInsightsController',[
  '$scope',
  'synsormed.services.UserService',
  '$modal',
  function($scope, UserService, $modal){

    $scope.user = UserService.fetchCachedUser();
    var user = UserService.fetchCachedUser();

    //change title for page
    $scope.$emit('pageLoaded', {
      title: "Insights"
    });

    $scope.loadAdminUsers = function(){
      $scope.$broadcast('loadAdminUsers');
    };
    $scope.loadOrgCreatorUsers = function(){
      $scope.$broadcast('loadOrgCreatorUsers');
    };
    $scope.loadOrganizations = function(){
      $scope.$broadcast('loadOrganizations');
    };

    $scope.EditorgCreator = function(OrgCreator){
      var user = OrgCreator || {};
      var instance = $modal.open({
        templateUrl: 'javascripts/app/features/settings/editUser.html',
        controller: 'SettingsUserEditController',
        resolve: {
          currentUser: function () {
            return $scope.user;
          },
          user: function () {
            return $.extend({}, user);
          }
        }
      });

      instance.result.then(function(){
        setTimeout(function(){
          $scope.loadOrgCreatorUsers();
        }, 10);;
      });
    };

    $scope.deleteUser = function (user) {
      if(!confirm("Are you sure you want to delete this user?")) {
        return;
      }
      $scope.$emit('wait:start');
      UserService.deleteUser(user.id).then(function () {
        $scope.$emit('wait:stop');
        setTimeout(function(){
          $scope.loadOrgCreatorUsers();
        }, 10);
        $scope.$emit('notification', {
            type: 'success',
            message: 'User Deleted'
        });
      }).catch(function () {
        $scope.$emit('wait:stop');
        $scope.$emit("notification", {
          type: 'danger',
          message: "Server error."
        });
      });
    };

    setTimeout(function(){
      if($scope.user.role == 'OrgCreator'){
        $scope.loadOrganizations();
      }
    }, 0);;

  }])
  .controller('AdminInsightsDashboardController',[
    '$scope',
    'synsormed.services.adminInsight.InsightService',
    function($scope, InsightService){

      $scope.insights = null;

      $scope.getGlobalStatistics = function(){

        $scope.$emit('wait:start');

        InsightService.getGlobalInsights()
        .then(function(data){
          $scope.insights = data;
          $scope.$emit('wait:stop');
        })
        .catch(function(err){
          $scope.insights = null;
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      };

      $scope.getGlobalStatistics();

    }])
    .controller('AdminInsightsAdminlistController',[
      '$scope',
      'synsormed.services.adminInsight.InsightService',
      'synsormed.services.UserService',
      '$location',
      function($scope, InsightService, UserService, $location){
        $scope.OrgCreators = [];
        $scope.admins = [];

        $scope.getAdminUsers = function(){

          $scope.$emit('wait:start');

          InsightService.getAllOrganizations()
          .then(function(data){
            $scope.orgs = data;
            $scope.$emit('wait:stop');
          })
          .catch(function(err){
            $scope.orgs = [];
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
              type: 'danger',
              message: "Server error."
            });
          });

          InsightService.getAdminUsers()
          .then(function(data){
            $scope.admins = data;
            $scope.$emit('wait:stop');
          })
          .catch(function(err){
            $scope.admins = [];
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
              type: 'danger',
              message: "Server error."
            });
          });
        };

        $scope.getOrgCreatorUsers = function(){

          $scope.$emit('wait:start');

          InsightService.getAllOrganizations()
          .then(function(data){
            $scope.orgs = data;
            $scope.$emit('wait:stop');
          })
          .catch(function(err){
            $scope.orgs = [];
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
              type: 'danger',
              message: "Server error."
            });
          });

          InsightService.getOrgCreatorUsers()
          .then(function(data){
            $scope.OrgCreators = data;
            $scope.$emit('wait:stop');
          })
          .catch(function(err){
            $scope.OrgCreators = [];
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
              type: 'danger',
              message: "Server error."
            });
          });
        };

        $scope.getOrganizationById = function(org_id){
            if(!org_id || !$scope.orgs.length) return;
            var response = '';
            $scope.orgs.forEach(function(org){
                if(org.id == org_id){
                    response = org;
                    return false;
                }
            });
            return response;
        };

        $scope.loginAsAdmin = function(admin){
            var org = $scope.getOrganizationById(admin.org_id);
            var proceed = confirm('Do you want to login in ' + org.name +' as ' + admin.name);
            if(proceed){
                UserService.superUserLogin(admin.id, org.id)
                .then(function(user){
                     UserService.setCachedUser(user);
                     $location.path('/settings');
                })
                .catch(function(){
                    $scope.$emit("notification", {
                      type: 'danger',
                      message: "Server error."
                    });
                });
            }
        };
        $scope.$on('loadAdminUsers',function(){
          if($scope.admins.length === 0){
            $scope.getAdminUsers();
          }
        });
        $scope.$on('loadOrgCreatorUsers',function(){
          $scope.getOrgCreatorUsers();
        });
      }])
      .controller('AdminInsightsOrganizationController',[
        '$scope',
        '$location',
        '$modal',
        'synsormed.services.adminInsight.InsightService',
        function($scope, $location, $modal, InsightService){
          $scope.orgs = [];

          $scope.getAllOrganizations = function(){

            $scope.$emit('wait:start');

            InsightService.getAllOrganizations()
            .then(function(data){
              $scope.orgs = data;
              $scope.$emit('wait:stop');
            })
            .catch(function(err){
              $scope.orgs = [];
              $scope.$emit('wait:stop');
              $scope.$emit("notification", {
                type: 'danger',
                message: "Server error."
              });
            });
          };

          $scope.getDetails = function(org){
            $location.path('/organization/' + org.id);
          }

          $scope.license = function(org){
            var modalInstance = $modal.open({
                templateUrl: 'javascripts/app/features/admin/insights/license.html',
                controller: 'InsightsLicenseController',
                resolve: {
                    organization: function () {
                        return org;
                    }
                }
            });
          }

          $scope.$on('loadOrganizations',function(){
            if($scope.orgs.length === 0){
              $scope.getAllOrganizations();
            }
          });

        }
      ])
