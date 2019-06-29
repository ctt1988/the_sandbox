"use strict";
angular.module('synsormed.features.settings.patient', [
  'synsormed.services.practice',
  'synsormed.services.user',
  'synsormed.services.network_providers',
  'synsormed.services.patient',
  'synsormed.services.pageState'
])
.controller('SettingsPatientController', [
  '$scope',
  '$rootScope',
  '$modal',
  '$filter',
  'synsormed.services.PatientService',
  'synsormed.services.UserService',
  'synsormed.services.PatientStateService',
  'synsormed.services.PatientListService',
  function ($scope, $rootScope, $modal, $filter, PatientService, UserService, PatientStateService, PatientListService) {
      $scope.patients = [];
      $scope.filtered = $scope.patients;
      $scope.users = [];
      $scope.messageAlert = {
         noPatients : 'There are no patients.',
         noUsers : 'You must have at least one provider added to the system to see patient list',
         noSearchResults : 'No patient in this filter'
      };
      var user = UserService.fetchCachedUser();
      var PatientSavedData = PatientStateService.getPatientState();
      var lastViewedUser = PatientSavedData ? PatientSavedData.lastViewedUser : false;

      $scope.pagination = {
          pageSizes: [5, 10, 25, 50, 100],
          pageSize: 5,
          page: PatientSavedData ? PatientSavedData.page || 1 : 1,
          finalPatients: []
      };

      var updatePageCount = function() {
          $scope.pages = [];
          $scope.pageCount = Math.ceil( $scope.totalPatient / $scope.pagination.pageSize);
          for(var i = 1; i <= $scope.pageCount; i++) {
              $scope.pages.push(i);
          }
      };

      var addTempUser = function(allUsers){
          if(!allUsers.length) return;
          var temp = { id: 0, name: 'All', role: 'Provider' };
          $scope.users.unshift(temp);
      };

      var removeTempUser = function(allUsers){
          var response = [];
          allUsers.forEach(function(user){
              if(user.id) response.push(user);
          });
          return response;
      };

      var fetchUserList = function(){
          $scope.$emit('wait:start');

          UserService.fetchAllUsers()
          .then(function(users){
              $scope.$emit('wait:stop');
              if(user.role === 'Admin'){
                  $scope.users = users.filter(function (u) {
                      return u.role === 'Provider';
                  });
                  addTempUser($scope.users);
              }else if(user.role == 'Provider'){
                  $scope.users = users.filter(function (u) {
                      return u.id === user.id;
                  });
              }

              $scope.showUser = {
                  id: lastViewedUser ? lastViewedUser : ($scope.users.length ? $scope.users[0].id : false)
              };

              fetchPatients($scope.showUser.id);
          })
          .catch(function(err){
              $scope.$emit('wait:stop');
              console.log(err);
          });
      };

      fetchUserList();

      var fetchPatients = function(providerId, paranoid, page){
          $scope.$emit('wait:start');
          $scope.paranoid =paranoid;
          PatientListService.getPatients(providerId, paranoid, true,false ,false, $scope.pagination.searchBox)
          .then(function(totalPatient){
            $scope.totalPatient = totalPatient.length;
            updatePageCount();
          });
          PatientListService.getPatients(providerId, paranoid, null, page, $scope.pagination.pageSize, $scope.pagination.searchBox)
          .then(function(patients){
              $scope.$emit('wait:stop');
              $scope.patients = patients;
              $scope.pagination.finalPatients = patients;
              updatePageCount();
              //update page when all Patients of a page are deleted
              if( $scope.pageCount < $scope.pagination.page){
                  $scope.pagination.page = $scope.pagination.page - 1;
              }
          })
          .catch(function(error){
              $scope.$emit('wait:stop');
              console.log(error);
          });
      };

      $scope.refreshPatientList = function(){
        fetchPatients();
      }

      $scope.uploadFile = function(){
        var modalInstance = $modal.open({
            templateUrl: 'javascripts/app/features/settings/uploadPatient.html',
            controller: 'UploadPatientController'
        });
      }

      $scope.deletedPatients = [
          {
              id: 1,
              name: 'All Patient'
          },
          {
              id: 0,
              name: 'Active Patients'
          },
          {
              id: 2,
              name: 'Deleted Patients'
          }
      ];
      $scope.deletedPatient = {
          id: 0
      };
      $scope.$watch('deletedPatient.id', function(newValue){
        if(newValue == undefined) return ;
          if($scope.showUser){
            fetchPatients($scope.showUser.id, newValue);
          }
      });

      $scope.resetPatient = function(id){
          var r = confirm("Are you sure you want to reset this patient");

          if(r){
              $scope.$emit('wait:start');
              PatientListService
              .resetPatient(id)
              .then(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit('notification', {
                      type: 'success',
                      message: 'Reset Patient Successfully'
                  });
                  fetchPatients($scope.showUser.id);
                  $scope.deletedPatient = {
                      id: 0
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

      $scope.permanentDeletePatient = function(id){
          var r = confirm("There is no way to undo this action. Are you sure you want to permanently delete this patient?");

          if(r){
              $scope.$emit('wait:start');
              PatientService
              .deletePatient(id, true)
              .then(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit('notification', {
                      type: 'success',
                      message: 'Patient Deleted Permanently'
                  });
                  fetchPatients($scope.showUser.id);
                  $scope.deletedPatient = {
                      id: 0
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

      var searchPatients = function(){
          var keyword = $scope.pagination.searchBox;
          var temp = $filter('filter')($scope.patients, keyword);
          $scope.filtered = $filter('orderBy')(temp, '-id');
          $scope.pagination.finalPatients = filterPatientlist($scope.filtered);
      };

      //filter patients acc to pageSize
      var filterPatientlist = function (patientList) {
          if(patientList.length < $scope.pagination.pageSize) {
              return patientList;
          }

          var end = $scope.pagination.page * $scope.pagination.pageSize;
          var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
          if(end >= patientList.length) {
              end = patientList.length;
          }
          return patientList.slice(start, end);
      };

      $scope.pageTo = function (page) {
          $scope.pagination.page = page;
          fetchPatients($scope.showUser.id, $scope.paranoid, page);
      };

      $scope.pageTurn = function (value) {
          if( ($scope.pagination.page == 1 && value < 0) || ($scope.pagination.page == $scope.pageCount && value > 0) ) {
              return;
          }
          $scope.pagination.page = $scope.pagination.page + value;
          fetchPatients($scope.showUser.id, $scope.paranoid, $scope.pagination.page);
      };

      //Fetch patient when the selected user id is changed
      $scope.$watch('showUser.id', function (newValue, oldValue) {
          PatientStateService.setPatientState({
              'lastViewedUser': $scope.showUser ? $scope.showUser.id : false,
              'pageSize': $scope.pagination.pageSize,
              'page' : $scope.pagination.page
          });
          if(typeof newValue != 'undefined'){
              fetchPatients(newValue);
          }
      }, true);

      $scope.$watch('pagination.pageSize', function (newValue, oldValue) {
          if(newValue != oldValue){
              $scope.pagination.page = 1;
          }
          $scope.pagination.pageSize = newValue;
          fetchPatients();
      }, true);

      $scope.$watch('pagination.searchBox', function () {
          fetchPatients();
          updatePageCount();
      }, true);

      $scope.editPatient = function(patient){
          var instance = $modal.open({
              templateUrl: 'javascripts/app/features/settings/editPatient.html',
              controller: 'SettingsPatientEditController',
              resolve: {
                  patient: function () {
                    return $.extend({}, patient);
                  },
                  users: function(){
                      return removeTempUser($scope.users);
                  }
              }
          });

          instance.result.then(function (patientData) {
            patient.id ? $.extend(patient, patientData) : $scope.patients.push(patientData);
            fetchPatients($scope.showUser.id);
          });
      };

      $scope.$on('loadPatientData',function(e,args){
           fetchUserList();
      });

      $scope.addPatient = function(){
         $scope.editPatient({});
      };

      $scope.deletePatient = function (patient) {
        if(!confirm("Are you sure you want to archive this patient?")) {
          return;
        }
        $scope.$emit('wait:start');
        PatientService.deletePatient(patient.id)
        .then(function () {
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
              type: 'success',
              message: "Patient Deleted"
          });
          fetchPatients($scope.showUser.id);
          $scope.deletedPatient = {
              id: 0
          };
        })
        .catch(function () {
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      }

  }
])
.controller('SettingsPatientEditController', [
    '$scope',
    '$modalInstance',
    'patient',
    'users',
    '$timeout',
    'synsormed.services.PatientService',
    function($scope, $modalInstance, patient, users, $timeout, PatientService){
        $scope.patient = patient;
        $scope.users = users;
        $scope.patient.userId = $scope.patient.userId ? $scope.patient.userId : ($scope.users.length ? $scope.users[0].id : null);
        $scope.patient.gender = $scope.patient.gender || null;
        $scope.notification = false;
        $scope.genders = [
            {label:'--Select Gender--', value: null},
            {label:'Male', value: 'male'},
            {label:'Female', value: 'female'}
        ];

        $scope.$on('setForm', function (evt, form) {
          $scope.form = form;
          $timeout(function(){
              $scope.$broadcast('validate');
          },0);
        })

        $scope.ok = function(){
            $scope.$broadcast('validate');
            if(!$scope.form.$valid) {
              return;
            }
            $scope.waiting = true;
            $scope.patient.notify = !!$scope.patient.notify;
            if($scope.patient.id){
               PatientService.updatePatient($scope.patient)
               .then(function(patientData){
                   $scope.waiting = false;
                   $scope.$emit("notification", {
                     type: 'success',
                     message: "Patient Updated"
                   });
                   $modalInstance.close(patientData);
               })
               .catch(function(err){
                  $scope.notification = (err.status == 422) ? "Email already exists. Please try a different email" :"Server error";
                  $scope.waiting = false;
               });
            }
            else {
                PatientService.createPatient($scope.patient)
                .then(function (patientData) {
                    $scope.waiting = false;
                    $scope.$emit("notification", {
                        type: 'success',
                        message: "Patient Created"
                    });
                    $modalInstance.close(patientData);
                })
                .catch(function (err) {
                    $scope.notification = (err.status == 422) ? "Email already exists. Please try a different email" : "Server error";
                    $scope.waiting = false;
                });
            }
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
    }
])
.controller('UploadPatientController', [
    '$scope',
    '$window',
    '$interval',
    '$modalInstance',
    'synsormed.services.PatientService',
    function($scope, $window, $interval, $modalInstance, PatientService){
        var fileData;
        $scope.$on('fileupdate', function (evt, file){
          fileData = file;
        });
        $scope.uploadFile = function(){
            var file = $scope.myFile;
            PatientService.uploadFileToUrl(fileData)
            .then(function(resp){
              $modalInstance.dismiss();
              $scope.$emit('notification', {
                  type: 'success',
                  message: 'File uploaded succesfully'
              });
            })
            .catch(function(err){
              $scope.$emit('notification', {
                  type: 'danger',
                  message: err.data
              });
            });
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
    }
])
.directive('fileModel', ['$parse', '$rootScope', function ($parse, $rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                    $rootScope.$broadcast('fileupdate', element[0].files[0]);
                });
            });
        }
    };
}]);
