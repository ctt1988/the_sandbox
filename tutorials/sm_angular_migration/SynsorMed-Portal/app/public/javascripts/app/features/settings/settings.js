"use strict";
angular.module('synsormed.features.settings', [
  'synsormed.services.practice',
  'synsormed.services.user',
  'synsormed.services.network_providers'
])
.controller('SettingsController', [
  '$scope',
  'practice',
  'synsormed.services.UserService',
  function ($scope, practice, UserService) {
    $scope.practice = practice;
    $scope.surveyQuestions = practice.surveyQuestions;
    $scope.user = UserService.fetchCachedUser();

    $scope.loadPatients = function(){
        $scope.$broadcast('loadPatientData',{});
    };
    $scope.$emit('pageLoaded', {
      title: "Practice Settings"
    });
  }])
  .controller('SettingsPracticeInformation', [
    '$scope',
    'synsormed.services.PracticeService',
    'synsormed.services.UserService',
    function ($scope, PracticeService, UserService) {
      $scope.editablePractice = $.extend({}, $scope.practice);

      var user = UserService.fetchCachedUser();
      $scope.getOtp = function(){
         $scope.$emit('wait:start');
         UserService.getOtpCode(user.id).then(function (otpCode) {
            $scope.$emit('wait:stop');
            $scope.otpCode = otpCode;
         }).catch(function () {
            $scope.$emit('wait:stop');
         });
      };

      $scope.removeOtp = function(){
         $scope.otpCode = null;
      };

      $scope.save = function () {
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
          return;
        }
        PracticeService.savePractice($scope.practice).then(function (practice) {
          $.extend($scope.practice, practice);
          $scope.$emit("notification", {
            type: 'success',
            message: "Practice Information Saved"
          });
        }).catch(function () {
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      };
    }
  ])
  .controller('SettingsSurveyController', [
    '$scope',
    '$modal',
    'synsormed.services.PracticeService',
    function ($scope, $modal, PracticeService) {
      $scope.deletedQuestions = false;
      $scope.addEmptyQuestion = function () {
        $scope.editQuestion({});
      };

      $scope.removeQuestion = function (index) {
        $scope.deletedQuestions = true;
        $scope.surveyQuestions.splice(index, 1);
      };

      $scope.save = function () {
        if($scope.deletedQuestions){
          confirm("There is no way to undo this action. Are you sure you want to save this?");
        }
        for (var i = $scope.surveyQuestions.length - 1; i > 0; i--) {
          console.log(i, $scope.surveyQuestions[i])
          if ($.trim($scope.surveyQuestions[i].text) === '') {
            $scope.surveyQuestions.splice(i, 1);
          }
        }
        PracticeService.savePractice($scope.practice).then(function () {
          $scope.$emit("notification", {
            type: 'success',
            message: "Survey Saved"
          });
        }).catch(function () {
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
        $scope.deletedQuestions = false;
      };

      $scope.editQuestion = function (question,questionIndex) {

        var instance = $modal.open({
          templateUrl: 'javascripts/app/features/settings/editQuestion.html',
          controller: 'SettingsQuestionEditController',
          resolve: {
            question: function () {
              return $.extend({}, question);
            },
            questionIndex : function(){
              return questionIndex || false;
            }
          }
        });

        instance.result.then(function (questionData) {
          if(question.id) {
            $.extend(question, questionData);
          } else {
            console.log(questionData)
            $scope.surveyQuestions.push(questionData);
          }
        })
      }
    }
  ])
  .controller('SettingsQuestionEditController', [
    '$scope',
    '$modalInstance',
    'question',
    'questionIndex',
    function ($scope, $modalInstance, question, questionIndex) {

      $scope.questionIndex = questionIndex;
      $scope.question = question;

      $scope.$on('setForm', function (evt, form) {
        $scope.form = form;
      });

      $scope.ok = function () {
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
          return;
        }

        $modalInstance.close(question);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }
  ])
  .controller('SettingsAccountController', [
    '$scope',
    'synsormed.services.UserService',
    'synsormed.services.NetworkProviderService',
    function ($scope, UserService, NetworkProviderService) {
      NetworkProviderService.getProviders()
      .then(function(providers){
        $scope.providers = providers;
      });

      $scope.save = function (form) {
        // if(!$scope.user.phone_mobile){
        //   $scope.$broadcast('setInvalid:phone_mobile', 'This field is required');
        //   return;
        // }
        //
        // if($scope.user.phone_mobile.length != 10) {
        //   $scope.$broadcast('setInvalid:phone_mobile', 'Please enter a valid phone number');
        //   return;
        // }
        //
        // if(isNaN($scope.user.phone_mobile)) {
        //   $scope.$broadcast('setInvalid:phone_mobile', 'Please enter a valid phone number');
        //   return;
        // }

        // if(!$scope.user.network_id) {
        //   $scope.$broadcast('setInvalid:network_id', 'Please select a provider');
        //   return;
        // }

        if($scope.user.password && $scope.user.password != $scope.user.confirmPassword) {
          $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
          $scope.$broadcast('setInvalid:confirmPassword', '');
          return;
        }

        $scope.$broadcast('setValid:password');
        $scope.$broadcast('setValid:confirmPassword');
        // $scope.$broadcast('setValid:phone_mobile');
        // $scope.$broadcast('setValid:network_id');

        $scope.$emit('wait:start');
        UserService.updateUser($scope.user).then(function (userData) {
          $scope.user = userData;
          UserService.setCachedUser(userData);
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'success',
            message: "Account updated"
          });
        }).catch(function () {
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      };
    }
  ])
  .controller('SettingsUsersController', [
    '$scope',
    '$modal',
    'synsormed.services.UserService',
    function ($scope, $modal, UserService) {

      $scope.refreshUserList = function(){
        $scope.$emit('wait:start');
        UserService.fetchAllUsersPaginate().then(function (users) {
          $scope.$emit('wait:stop');
          $scope.users = users.users;
          updatePageCount(users.pagination);
        });
      }

      $scope.refreshUserList();

      $scope.messageAlert = {
         noUsers : 'There are no deleted users.',
      };
      $scope.deletedusers = [
          {
              id: 1,
              name: 'All users'
          },
          {
              id: 0,
              name: 'Active users'
          },
          {
            id: 2,
            name: 'Deleted users'
          }
      ];
      $scope.deleteduser = {
          id: 0
      };



      var updatePageCount = function(pagination) {
          $scope.pages = [];
          $scope.pagination.paranoid = pagination.paranoid;
          $scope.pageCount = Math.ceil( pagination.total/ 5);
          for(var i = 1; i <= $scope.pageCount; i++) {
              $scope.pages.push(i);
          }
      };
      var fetchUsers = function(){
        UserService.fetchAllUsersPaginate($scope.pagination.paranoid, $scope.pagination.page).then(function (users) {
          $scope.users = users.users;
          updatePageCount(users.pagination);
        });
      }
      $scope.pagination={
        page : 1,
        paranoid: 1,
      };
      $scope.pageTurn = function (value) {
          if( ($scope.pagination.page == 1 && value < 0) || ($scope.pagination.page == $scope.pageCount && value > 0) ) {
              return;
          }
          $scope.pagination.page = $scope.pagination.page + value;
          fetchUsers($scope.pagination.page);
      };
      $scope.pageTo = function (page) {
          $scope.pagination.page = page;
          fetchUsers($scope.pagination.page);
      };




      $scope.$watch('deleteduser.id', function(newValue){
        if(newValue == undefined) return ;
        $scope.$emit('wait:start');
        $scope.pagination.paranoid = newValue;
        UserService.fetchAllUsersPaginate(newValue).then(function (users) {
          $scope.$emit('wait:stop');
          $scope.users = users.users;
          $scope.pagination.page=1;
          updatePageCount(users.pagination);
        });
      });
      $scope.$watch('deletedUsers', function(newValue, oldValue){
         if(newValue){
           $scope.$emit('wait:start');
           $scope.pagination.paranoid = 1;
           UserService.fetchAllUsersPaginate(1).then(function (users) {
             $scope.$emit('wait:stop');
             $scope.pagination.page=1;
             $scope.users = users.users;
             updatePageCount(users.pagination);
           });
         }
         else if(oldValue){
           $scope.$emit('wait:start');
           $scope.pagination.paranoid = 0;
           UserService.fetchAllUsersPaginate(0).then(function (users) {
             $scope.$emit('wait:stop');
             $scope.pagination.page=1;
             $scope.users = users.users;
             updatePageCount(users.pagination);
           });
         }
      });

      $scope.resetUser = function(id){
          var r = confirm("Are you sure you want to reset this user");

          if(r){
              $scope.$emit('wait:start');
              UserService
              .resetUser(id,true)
              .then(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit('notification', {
                      type: 'success',
                      message: 'Reset User Successfully'
                  });
                  $scope.pagination.paranoid =2;
                  UserService.fetchAllUsersPaginate(2).then(function (users) {
                    $scope.users = users.users;
                    updatePageCount(users.pagination);
                  });
                  $scope.deleteduser = {
                      id: 2
                  };
              })
              .catch(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit("notification", {
                      type: 'danger',
                      message: "Server error."
                  });
              });
          }
      };

      $scope.permanentDeleteUser = function(id){
          var r = confirm("There is no way to undo this action. Are you sure you want to permanently delete this user?");

          if(r){
              $scope.$emit('wait:start');
              UserService
              .deleteUser(id, true)
              .then(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit('notification', {
                      type: 'success',
                      message: 'User Deleted Permanently'
                  });
                  $scope.pagination.paranoid =2;
                  UserService.fetchAllUsersPaginate(2).then(function (users) {
                    $scope.users = users.users;
                    updatePageCount(users.pagination);
                  });
              })
              .catch(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit("notification", {
                      type: 'danger',
                      message: "Server error."
                  });
              });
          }
      };

      $scope.addUser = function () {
        $scope.editUser({});
      };

      $scope.deleteUser = function (user) {
        if(!confirm("Are you sure you want to archive this user?")) {
          return;
        }
        $scope.$emit('wait:start');
        UserService.deleteUser(user.id).then(function () {
          $scope.$emit('wait:stop');
          UserService.fetchAllUsersPaginate().then(function (users) {
            $scope.users = users.users;
            updatePageCount(users.pagination);
          });
          $scope.deleteduser = {
              id: 0
          };
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
      }
      $scope.editUser = function (user) {
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
        instance.result.then(function (userData) {
          $scope.refreshUserList();
          if(user.id) {
            $.extend(user, userData);
          } else {
            $scope.deleteduser = {
                id: 0
            };
          }
        })
      }
    }
  ])
  .controller('SettingsUserEditController', [
    '$scope',
    '$modalInstance',
    'user',
    '$timeout',
    'currentUser',
    'synsormed.services.UserService',
    'synsormed.services.adminInsight.InsightService',
    function ($scope, $modalInstance, user, $timeout, currentUser, UserService, InsightService) {
      $scope.user = user;
      $scope.currentUser = currentUser;
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

        if($scope.currentUser.role == 'SuperAdmin'){
          $scope.roles = [
            {name: 'OrgCreator', value: 'OrgCreator'}
          ];
        }
        if($scope.currentUser.role == 'Admin'){
          $scope.roles = [
              {name: 'Admin', value: 'Admin'},
              {name: 'Provider', value: 'Provider'}
          ];
        }
      $scope.$on('setForm', function (evt, form) {
        $scope.form = form;
        $timeout(function(){
            $scope.$broadcast('validate');
        },0);
      })
      $scope.notification = ""
      $scope.ok = function () {
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
          return;
        }
        $scope.waiting = true;
        if($scope.user.id) {


          if(!$scope.user.password) {
            delete $scope.user.password;
          }

          UserService.updateUser($scope.user).then(function (userData) {

            $scope.waiting = false;
            $scope.$emit("notification", {
              type: 'success',
              message: "User Updated"
            });
            $modalInstance.close(userData);
          }).catch(function (err) {
            switch(err.status) {
              case 409:
              $scope.notification = "Email already exists. Please try a different email";
              break;
              default:
              $scope.notification = "Server error";
              break;
            }
            $scope.waiting = false;
          });
        } else {
          UserService.createUser($scope.user).then(function (userData) {
            $scope.waiting = false;
            $scope.$emit("notification", {
              type: 'success',
              message: "User Created"
            });
            $modalInstance.close(userData);
          }).catch(function (err) {
            switch(err.status) {
              case 409:
              $scope.notification = "Email already exists. Please try a different email";
              break;
              default:
              $scope.notification = "Server error";
              break;
            }
            $scope.waiting = false;
          });
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }
]);
