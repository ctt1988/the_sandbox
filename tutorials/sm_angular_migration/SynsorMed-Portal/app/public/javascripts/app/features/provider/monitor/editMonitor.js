"use strict";
angular.module('synsormed.features.provider.monitor.edit', [
    'synsormed.services.worklist',
    'synsormed.services.user',
    'synsormed.services.measurement',
    'synsormed.services.monitor',
    'synsormed.services.pageState',
    'ui.bootstrap.datetimepicker',
    'synsormed.services.patient',
    'multipleSelect'
])
.controller('MonitorEditController', [
    '$scope',
    '$rootScope',
    '$modalInstance',
    '$q',
    'monitor',
    'users',
    'measurements',
    'monitorMeasurements',
    'isNew',
    'synsormed.services.MonitorService',
    'synsormed.services.UserService',
    'synsormed.services.MonitorListService',
    'synsormed.services.MonitorMeasurementService',
    'synsormed.services.MonitorStateService',
    'synsormed.services.PatientListService',
    '$modal',
    'diseases',
    'statusSurvey',
    'localStorageService',
    function ($scope, $rootScope, $modalInstance, $q, monitor, users, measurements, monitorMeasurements, isNew, MonitorService, UserService, MonitorListService, MonitorMeasurementService, MonitorStateService, PatientListService, $modal, diseases, statusSurvey, localStorageService) {
        $scope.profileType = localStorageService.get('profileType');
        $scope.users = users;
        $scope.monitor = monitor;
        $scope.measurements = measurements; //list of all measurements like glucose, steps etc.
        $scope.monitorMeasurements = monitorMeasurements; //list of all monitor's measurements
        $scope.patients = [];
        $scope.$emit('wait:stop');
        $scope.diseases = diseases || [];
        $scope.statusSurvey = statusSurvey;
        $scope.providers = [];
        $scope.users.forEach(function(user){
          $scope.providers.push({
            id: user.id,
            name: user.name
          })
        });

        $scope.measurements = _.filter($scope.measurements, function(measurement){
            var active_measurements = ['status','oxygen saturation'];
            //return active_measurements.indexOf(measurement.name.toLowerCase()) != -1;
            return true;
        });
        $scope.repeatIntervalInHours = $scope.repeatInterval / 3600;

        $scope.$watch('repeatIntervalInHours', function(){
            $scope.repeatInterval = $scope.repeatIntervalInHours * 3600;
        }, true);

        $scope.monitoringIntervals = [
                {
                    id: 3,
                    name: "3 per day"
                },
                {
                    id: 2,
                    name: "2 per day"
                },
                {
                    id: 1,
                    name: "1 per day"
                }
            ];



        $scope.datePicker = { opened : false, minDate: new Date() };
        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.datePicker.opened = true;
        };

        var rememberedUser = MonitorStateService.getMonitorState(); //current user on worklist
            rememberedUser = rememberedUser ? rememberedUser.lastViewedUser : 0;

        var currentUser = UserService.fetchCachedUser(); //current logged in user

        var selectedUser = currentUser;
        if(currentUser.role != 'Provider' && $scope.users.length > 0) {
            selectedUser = $scope.users[0];
        } else if (currentUser.role != 'Provider') {
            selectedUser = {};
        }

        $scope.isNew = monitor ? false : true;
        //if the new monitor , select the first user,
        //otherwise if available use the current user on worklist
        $scope.useUser = {
            id: (!$scope.isNew && $scope.monitor.providerId) ? $scope.monitor.providerId : $scope.users[0].id
        };

        $scope.stageNext = !$scope.isNew; // stages in form

        $scope.data = {
            description: null,
            notify: false,
            educationChecked: false,
            sensitivity: 2, //default sensitivity
            startDate: moment().toDate() // default start date
        };

        $scope.data.selectedList = [{
            id: $scope.users[0].id,
            name: $scope.users[0].name
        }]

        if(!$scope.isNew){
            $scope.data = {
                description: $scope.monitor.description,
                notify: $scope.monitor.notify,
                sensitivity: $scope.monitor.sensitivity,
                reportingEmails: $scope.monitor.reportingEmails,
                medicationReminder: $scope.monitor.medicationReminder,
                medication: $scope.monitor.medication,
                startDate: $scope.monitor.startDate ? moment($scope.monitor.startDate).toDate() : moment().toDate(),
                providerId: $scope.monitor.providerId,
                educationChecked: $scope.monitor.educationChecked
            };
        }
        $scope.selectedProvider = [];

        if($scope.monitor && $scope.monitor.providersId){
          _.forEach($scope.users, function(user){
            _.forEach($scope.monitor.providersId, function(providerId){
                if(user && providerId && user.id == providerId){
                  $scope.selectedProvider.push({
                    id: providerId,
                    name: user.name
                  })
                }
            })
          })
          $scope.data.selectedList = $scope.selectedProvider;
        }

        $scope.$on('setForm', function (evt, form) {
            $scope.form = form;
        });

        $scope.ok = function () {
            $scope.$broadcast('validate');
            if(!$scope.form.$valid) {
                return;
            }

            var record = null;

            if($scope.isNew){//is new monitor then create it
                record = {
                    description: $scope.data.description,
                    notify: $scope.data.notify,
                    //convert the incoming seconds to hours
                    sensitivity: $scope.data.sensitivity,
                    reportingEmails: $scope.data.reportingEmails,
                    medicationReminder: $scope.data.medicationReminder,
                    medication: $scope.data.medication,
                    educationChecked: $scope.data.educationChecked,
                    patientId : $scope.data.patientId
                };
            } else { //otherwise update the monitor
                monitor.description = $scope.data.description;
                monitor.notify = $scope.data.notify;
                monitor.sensitivity = $scope.data.sensitivity;
                monitor.reportingEmails = $scope.data.reportingEmails;
                monitor.medicationReminder= $scope.data.medicationReminder;
                monitor.medication= $scope.data.medication;
                monitor.patientId = $scope.data.patientId;
                monitor.educationChecked = $scope.data.educationChecked;
                record = monitor;
            }

            record.startDate = $scope.data.startDate ? moment($scope.data.startDate).startOf('day').add(moment().diff(moment().startOf('day'), 'seconds'), 'seconds').toDate() : null;

            $scope.providersId = [];

            if(currentUser.role === 'Admin') {
              if(!$scope.profileType){
                $scope.data.selectedList.forEach(function(provider){
                  $scope.providersId.push(provider.id);
                })
                record.providersId = $scope.providersId ? $scope.providersId : [];
                record.providerId = $scope.useUser.id;
              }
              else{
                record.providersId =[$scope.useUser.id];
                record.providerId = $scope.useUser.id;
              }
            }

            //empty measurements
            if($scope.monitorMeasurements.length < 1)
            {
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Please add at least one indicator to monitor"
                });
                return;
            }

            var validSurvey = _.every($scope.monitorMeasurements, function(measurement) {
              if (measurement.measurementId === 12 && !measurement.statusSurveyId) {
                $scope.$emit("notification", {
                    type: 'danger',
                    message: 'Please select a survey type'
                });
                return false;
              }

              return true;
            });

            if (!validSurvey) {
              return;
            }

            //set sensitivity for all measurements same
            _.map($scope.monitorMeasurements, function(measurement){
                measurement.sensitivity = $scope.data.sensitivity;
            });

            $scope.$emit('wait:start');

            var tempMonitor = null;

            (function(){
                return $scope.isNew ? MonitorService.createMonitor(record) : MonitorService.updateMonitor(record);
            }())
            .then(function(monitorCreatedOrUpdated){
                tempMonitor = monitorCreatedOrUpdated;
                return MonitorMeasurementService.updateMonitorMeasurements(monitorCreatedOrUpdated.id, $scope.monitorMeasurements);
            }).then(function(){
                if(!$scope.stageNext){
                    refreshDataSet(tempMonitor.id)
                    .then(function(){
                        $scope.$emit('wait:stop');
                        $scope.stageNext = true;
                    });
                } else {
                    $scope.$emit('wait:stop');
                    $modalInstance.close(isNew ? tempMonitor : null);
                }
            })
            .catch(function(){
                $scope.$emit('wait:stop');
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
            });

        };

        var addNullPatient = function(patients){
            var temp = { id: 0, name: '--No Patient--'};
            $scope.patients.unshift(temp);
        };

        var getPatientId = function(patients, monitor){
              var patientId = (!$scope.isNew && monitor.patientId) ? monitor.patientId : false;
              var defaultPatientId = patients[0].id;
              if(patientId){
                 var isContain =  _.find(patients,function(patient){
                        return patient.id == patientId;
                  });
                 defaultPatientId = isContain ? patientId : patients[0].id;
              }
              return defaultPatientId;
        };

        var getPatientList = function(providerId){
           if(!providerId) return;

           $scope.$emit('wait:start');
           PatientListService.getPatients(providerId, false, true)
           .then(function(patients){
               $scope.$emit('wait:stop');
               $scope.patients = patients;
               addNullPatient(patients);
               $scope.data.patientId  = getPatientId($scope.patients, $scope.monitor);
           })
           .catch(function(err){
               $scope.$emit('wait:stop');
               console.log(err);
           });
        };

        $scope.occurences = [
          {id: 1},
          {id: 2},
          {id: 3},
          {id: 4},
        ];

        //update the monitor and its measurements from API
        var refreshDataSet = function(monitorId){
            var deferred = $q.defer();

            //get the monitor
            MonitorService
                .getMonitor(monitorId)
                .then(function(monitorFetched){
                    $scope.monitor = monitorFetched;
                    monitor = monitorFetched;
                    $scope.isNew = false;
                    return MonitorMeasurementService.getMonitorMeasurements(monitorId);
                })
                .then(function(monitorMeasurementsFetched){
                    $scope.monitorMeasurements = monitorMeasurementsFetched;
                    deferred.resolve();
                })
                .catch(deferred.reject);

            return deferred.promise;
        };

        $scope.cancel = function () {
            if(isNew && !!monitor){
                $scope.$emit('wait:start');
                MonitorService
                .deleteMonitor(monitor.id)
                .then(function(){
                    $scope.$emit('wait:stop');
                    $modalInstance.dismiss();
                })
                .catch(function(){
                    $scope.$emit('wait:stop');
                    $modalInstance.dismiss();
                });
            }
            else{
                $modalInstance.dismiss();
            }
        };

        $scope.getStateText = function(){
            return isNew ? 'Next' : ( $scope.stageNext ? 'OK' : 'Next' );
        };

        //add new health indicator
        $scope.addIndicator = function(){
            if($scope.monitorMeasurements.length >= 5)
            {
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Only 5 health indicator's are allowed"
                });
            }
            else {
                $scope.monitorMeasurements.push({});
                $scope.stageNext = false;
            }
        };

        //delete monitor measurements
        $scope.$on('delete:monitor:measurement', function(event, data){
            if($scope.monitorMeasurements.length === 1)
            {
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Cannot delete all the health indicator's for a monitor"
                });
            }
            else {
                MonitorMeasurementService
                .deleteMonitorMeasurements($scope.monitor.id, data.id)
                .then(function(){
                    $scope.$emit("notification", {
                        type: 'success',
                        message: "Health indicator deleted successfully"
                    });
                    $scope.monitorMeasurements.splice(data.index, 1);
                })
                .catch(function(err){
                    console.log(err);
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Server error."
                    });
                });
            }
        });

        $scope.$on('monitor:edit:popup:refresh', function(){
            $scope.stageNext = false;
            $scope.ok();
        });

        $scope.$watch('useUser.id', function(newValue, oldValue){
            getPatientList(newValue);
        });

        // $scope.$watch('data.selectedList', function(newValue, oldValue){
        //     if(newValue && newValue.length > 5){
        //       $scope.data.selectedList = oldValue
        //       $scope.$emit("notification", {
        //           type: 'danger',
        //           message: "Only 5 providers are allowed"
        //       });
        //     }
        // }, true);

        $scope.createPatient = function(){
            var patientModelInstance = $modal.open({
                templateUrl : 'javascripts/app/features/settings/editPatient.html',
                controller : 'SettingsPatientEditController',
                resolve : {
                    patient: function () {
                      return {};
                    },
                    users: function(){
                        return $scope.users;
                    }
                }
            });

            patientModelInstance.result.then(function(patientData){
                getPatientList($scope.useUser.id);
            });
        };

}]);
