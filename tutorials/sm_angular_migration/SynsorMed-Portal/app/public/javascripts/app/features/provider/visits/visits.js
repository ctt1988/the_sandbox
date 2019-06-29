angular.module('synsormed.features.provider.visits', [
    'synsormed.services.worklist',
    'synsormed.services.encounter',
    'synsormed.services.user',
    'synsormed.services.pageState',
    'synsormed.services.patient',
    'synsormed.features.provider.visits.video',
    'synsormed.services.notify'
])
.controller('VisitsController', [
    '$scope',
    '$rootScope',
    'users',
    '$location',
    '$modal',
    'synsormed.services.WorklistService',
    'synsormed.services.EncounterService',
    'synsormed.services.UserService',
    'debounce',
    'synsormed.services.WorkListStateService',
    '$filter',
    '$interval',
    function ($scope, $rootScope, users, $location, $modal, WorklistService, EncounterService, UserService, debounce, WorkListStateService, $filter, $interval) {

        var user = UserService.fetchCachedUser();
        $scope.user = user;
        $rootScope.onlineEncounters = {};
        //local storage keys
        var worklistSavedData = WorkListStateService.getWorkListState();

        var selectedId = (worklistSavedData ? worklistSavedData.lastViewedUser : 0) || $scope.user.id;;

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

        var rememberWorklistData = function(){
            WorkListStateService.setWorkListState({
                'worklist_date': $scope.worklistDate,
                'lastViewedUser': $scope.showUser.id,
                'pageSize': $scope.pagination.pageSize,
                'page': $scope.pagination.page,
                'callStatusId': $scope.callStatusId
            });
        };

        //Check the current role of the logged in user. If that user is an Admin
        //allow that person to see all provider worklists. If that user is a
        //provider, only allow them to see their own worklist.
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

        if(user.role != 'Provider' && $scope.users.length > 0) {
            //get last viewed user
            var lastViewedUser = selectedId;

            // find in available user
            var userObj = $scope.users.filter(function(u){ return u.id === lastViewedUser});

            if(lastViewedUser > 0 && userObj.length){
                selectedId = lastViewedUser;
            }
            else {
                selectedId = $scope.users[0].id;
            }
        }

        $scope.alert = {
            type: 'danger'
        };

        if($scope.users.length == 0) {
            $scope.alert.msg = "You must have at least one provider added to the system to see worklists";
        }
        $scope.worklistLoading = true;
        $scope.pagination = {
            pageSizes: [5, 10, 25, 50, 100],
            pageSize: worklistSavedData ? worklistSavedData.pageSize : 5,
            page: worklistSavedData ? worklistSavedData.page : 1
        };

        $scope.worklist = [];
        $scope.pageCount = 0;
        $scope.showUser = {
            id: worklistSavedData ? worklistSavedData.lastViewedUser : ($scope.users.length ? $scope.users[0].id : false)
        };
        $scope.datepicker = {
            opened: false
        };

        //The default worklist date is today
        //var worklistSavedData = WorkListStateService.getWorkListState();
        $scope.worklistDate = worklistSavedData ? (worklistSavedData.worklist_date ? moment(worklistSavedData.worklist_date).toDate() : new Date() ) : new Date();
        $scope.callStatus = [
            {name: 'All', id: 1},
            {name: 'Call completed', id: 2},
            {name: 'Call pending', id:3}
        ];
        $scope.callStatusId = worklistSavedData ? (worklistSavedData.callStatusId || $scope.callStatus[0].id) : $scope.callStatus[0].id;


        //Fetch worklist results when the date is changed
        $scope.$watch('worklistDate', function (newValue, oldValue) {
            if(moment(newValue).toString() == moment(oldValue).toString()) return;

            if(moment(newValue).toString() != moment(oldValue).toString()){
                $scope.pagination.page = 1;
            }
            rememberWorklistData();
            fetchWorklist();
        });

        //Fetch worklist when the selected user id is changed
        $scope.$watch('showUser.id', function (newValue, oldValue) {
            if(newValue != oldValue)
            {
                $scope.pagination.page = 1;
            }
            selectedId = $scope.showUser.id;
            rememberWorklistData();
            fetchWorklist();
        }, true);

        $scope.$watch('worklist', function () {
            updatePageCount();
        });

        $scope.$watch('pagination.pageSize', function (newValue, oldValue) {
            if(newValue != oldValue)
            {
                $scope.pagination.page = 1;
            }
            rememberWorklistData();
            updatePageCount();
            $scope.filteredWorklist = filterWorklist($scope.worklist);
        }, true);

        $scope.$watch('pagination.page', function () {
            rememberWorklistData();
            $scope.filteredWorklist = filterWorklist($scope.worklist);
        }, true);

        $scope.$watch('callStatusId', function(newValue){
            rememberWorklistData();
            $scope.filteredWorklist = filterWorklist($scope.worklist);
        });

        $scope.$emit('pageLoaded', {
            title: "Visits"
        });


        $scope.displayLocation = function(code, location){
            var mapInstance = $modal.open({
                templateUrl: 'javascripts/app/features/provider/visits/map.html',
                controller: 'EncounterMapController',
                windowClass: 'custom-map-modal',
                resolve: {
                    location: function () {
                        return location;
                    },
                    patientCode: function(){
                        return code;
                    }
                }
            });
        };

        $scope.showPatientInfo = function(encounter){
            var not = 'No patient is linked with this code';
            var message;
            if(encounter.patientName){
                var notAvailable = 'Not available';
                var email = '<span>Email : '+ (encounter.patientEmail || notAvailable) +'</span><br/>';
                var ph = '<span>Mobile : ' + (encounter.patientPhone || notAvailable) + '</span>';
                message = email + ph;
            }
            return  '<div>' + (message || not) + '</div>';
        };

        $scope.pageTurn = function (value) {
            if($scope.pagination.page == 1 && value < 0) {
                return;
            }
            if($scope.pagination.page == $scope.pageCount && value > 0) {
                return;
            }
            $scope.pagination.page = $scope.pagination.page + value;
        };
        $scope.pageTo = function (page) {
            $scope.pagination.page = page;
        };

        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.datepicker.opened = !$scope.datepicker.opened;
        };

        //added refresh button
        $scope.refreshWorkList = function(){
            //show spinner, it automatically goes away in fetchWorklist
            $scope.worklistLoading = true;
            fetchWorklist();
        };

        $scope.deleteEncounter = function (id) {
            if(!confirm("There is no way to undo this action. Are you sure you want to delete this code?")) {
                return;
            }
            $scope.$emit('wait:start');
            EncounterService.deleteEncounter(id).then(function () {
                $scope.$emit('wait:stop');
                $scope.$emit('notification', {
                    type: 'success',
                    message: 'Code deleted'
                });
                fetchWorklist();
            }).catch(function () {
                $scope.$emit('wait:stop');
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
            });
        };


        $scope.getCallCompletionDate = function(callStarted, callDuration){
            if(callStarted){
                var date = moment(callStarted).add(callDuration , 'seconds').toDate();
                date = $filter('date')(date, 'short');
                return 'On '+date;
            }
            return 'N/A';
        };

        $scope.openVideoPopUp = function(encounterId){
            if($rootScope.videoModelOpened){
                return $scope.$emit("notification", {
                    type: 'danger',
                    message: "Video Popup is already called"
                });
            };

            var modalInstance = $modal.open({
                backdrop: false,
                templateUrl: 'javascripts/app/features/provider/visits/video.html',
                controller: 'VideoController',
                windowClass: 'custom-video-modal',
                resolve:{
                    encounterId: function(){
                        return encounterId;
                    },
                    providerId: function(){
                        return selectedId;
                    }
                }
            });

            modalInstance.opened.then(function () {
                $rootScope.videoModelOpened = true;
            });

            modalInstance.result.then(function (selectedItem) {
                $rootScope.videoModelOpened = false;
                fetchWorklist();
            }, function () {
                $rootScope.videoModelOpened = false;
                fetchWorklist();
            });
        };

        $scope.notifyEncounter = function(encounter){
            if(!encounter) return;

            var modalInstance = $modal.open({
                templateUrl: 'javascripts/app/features/provider/monitor/notification.html',
                controller: 'EncounterNotificationController',
                windowClass: 'monitor-service-modal',
                resolve: {
                    encounter: function () {
                        return encounter;
                    }
                }
            });
        };

        $scope.callDuration = function(duration){
            duration = duration || 0;
            if(duration <= 0) return "N/A";
            var hour, minutes;
            hour = minutes = '00';
            if(duration >= 3600){
                var hour = Math.floor(duration / 3600);
                hour =  hour < 10 ? ('0' + hour) : hour;
                duration = duration % 3600;
            }
            if(duration >= 60){
                var minutes = Math.floor(duration / 60);
                minutes = minutes < 10 ? ('0' + minutes) : minutes;
                duration = duration % 60;
            }
            duration = duration < 10 ? ('0' + duration) : duration;
            return (hour + ':' + minutes + ':' + duration);
        };

        $scope.editEncounter = function (encounter) {
            if(!$scope.users.length){
                $scope.$emit("notification", {
                    type: 'info',
                    message: "Please add provider first."
                });
                return false;
            }
            var modalInstance = $modal.open({
                templateUrl: 'javascripts/app/features/provider/visits/editEncounter.html',
                controller: 'EncounterEditController',
                resolve: {
                    encounter: function () {
                        return encounter;
                    },
                    users: function () {
                        return removeTempUser($scope.users);
                    },
                    showUser: function() {
                        return $scope.showUser;
                    }
                }
            });

            modalInstance.result.then(function (encounter) {

                if(encounter){
                    $location.path('/showCode').search({id: encounter.id});
                } else {
                    fetchWorklist();
                }

            });

        };

        $scope.showNotes = function (encounter) {
            var modalInstance = $modal.open({
                templateUrl: 'javascripts/app/features/provider/visits/editNote.html',
                controller: 'NoteEditController',
                resolve: {
                    encounter: function () {
                        return encounter;
                    }
                }
            });
        };

        function updatePageCount(workList) {
            workList = workList || $scope.worklist;
            $scope.pageCount = Math.ceil(workList.length / $scope.pagination.pageSize);
            $scope.pages = [];
            for(var i = 1; i <= $scope.pageCount; i++) {
                $scope.pages.push(i);
            }
        }


        function fetchWorklist() {
            $scope.$emit('wait:start');
            WorklistService.fetchWorklist(selectedId, $scope.worklistDate)
            .then(function (worklist) {
                $scope.worklistLoading = false;
                $scope.worklist = worklist;
                $scope.filteredWorklist = filterWorklist(worklist);
                if($scope.user.role.toLowerCase() == 'provider'){
                    return getOnlineUsers().then(function(){
                        $scope.$emit('wait:stop');
                    });
                }
                else{
                    return $scope.$emit('wait:stop');
                }
            })
            .catch(function () {
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
            });
        }

        var filterWorklist = function (worklist) {
            switch($scope.callStatusId){
                case 2:
                worklist = $filter('filter')(worklist, {callCompleted: true});
                break;
                case 3:
                worklist = $filter('filter')(worklist, {callCompleted: false});
            }

            updatePageCount(worklist);

            //update page when all worklists of a page are deleted
            if( Math.ceil($scope.worklist.length / $scope.pagination.pageSize) < $scope.pagination.page){
                $scope.pagination.page = $scope.pagination.page - 1;
            }

            if(worklist.length < $scope.pagination.pageSize) {
                return worklist;
            }

            $scope.pagination.page = $scope.pagination.page <=0 ? 1 : $scope.pagination.page;

            var end = $scope.pagination.page * $scope.pagination.pageSize;
            var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
            if(end >= worklist.length) {
                end = worklist.length;
            }
            return worklist.slice(start, end);
        };

        // debounced watch, no matter how fast user hit keys
        // worklistDate will change if user doesn't hit any key in last 500 ms
        $scope.$watch('currentDate',debounce(function(){
            $scope.worklistDate = $scope.currentDate;
        },500),true);

        var getOnlineUsers = function(){
            return WorklistService.fetchOnlinePatients(selectedId, $scope.worklistDate)
            .then(function(encounters){
                var onlineEncounters = {};
                _.forEach(encounters, function(encounter){
                    onlineEncounters[encounter.id] = true;
                });
                $rootScope.onlineEncounters = onlineEncounters;
            })
            .catch(function(err){
                console.log(err);
            });
        };


        if($scope.user.role.toLowerCase() == 'provider') {
            var pingServer = function(){
                WorklistService.pingServer();
            };

            pingServer();

            var updateStatus = $interval(function(){
                getOnlineUsers();
                pingServer();
            }, 30000);

            $scope.$on('$destroy', function() {
                $interval.cancel(updateStatus);
            });
        }

    }])
    .controller('EncounterNotificationController', [
        '$scope',
        'encounter',
        '$modalInstance',
        'synsormed.services.NotifyService',
        function($scope, encounter, $modalInstance, NotifyService){
            $scope.patientCode = encounter ? encounter.patientCode : false;

            $scope.title = 'Send message ' + $scope.patientCode;

            $scope.$on('setForm', function (evt, form) {
                $scope.form = form;
            })

            $scope.send = function(){
                $scope.$broadcast('validate');
                if(!$scope.form.$valid) return;
                $scope.waiting = true;
                NotifyService.sendPushNotificationToEncounter(encounter.id, $scope.form.message.$modelValue)
                .then(function(res){
                    $scope.waiting = false;
                    $scope.$emit("notification", {
                        type: 'success',
                        message: "Notification successfully sent"
                    });
                    $modalInstance.dismiss();
                })
                .catch(function(e){
                    $scope.waiting = false;
                    var msg = "Notification sending failed";
                    if(e && e.data && e.data.code && e.data.code == 404){
                        msg = 'This user does not have messaging enabled';
                    }
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: msg
                    });
                });
            };

            $scope.cancel = function(){
                $modalInstance.dismiss();
            }
        }
    ])
    .controller('NoteEditController', [
        '$scope',
        '$modalInstance',
        'encounter',
        'synsormed.services.EncounterService',
        function ($scope, $modalInstance, encounter, EncounterService) {
            $scope.encounter = encounter;
            $scope.notification = "";

            $scope.ok = function () {
                $scope.notification = "";
                EncounterService.updateEncounter(encounter).then(function () {
                    $modalInstance.close();
                }).catch(function (err) {
                    $scope.notification = "Server error";
                })
            };

            $scope.cancel = function () {
                $modalInstance.dismiss();
            };

        }])
        .controller('EncounterEditController', [
            '$scope',
            '$modalInstance',
            'encounter',
            'users',
            'showUser',
            'synsormed.services.EncounterService',
            'synsormed.services.UserService',
            'synsormed.services.WorklistService',
            'synsormed.services.WorkListStateService',
            'synsormed.services.PatientListService',
            '$modal',
            function ($scope, $modalInstance, encounter, users, showUser, EncounterService, UserService, WorklistService, WorkListStateService, PatientListService, $modal) {
                $scope.users = users;
                $scope.encounter = encounter;
                $scope.notification = "";
                $scope.showUser = showUser;
                $scope.patients = [];
                //current user on worklist
                var worklistSavedData = WorkListStateService.getWorkListState();
                var rememberedUser = worklistSavedData ? worklistSavedData.lastViewedUser : 0;

                //current logged in user
                var currentUser = UserService.fetchCachedUser();

                var selectedUser = currentUser;
                if(currentUser.role != 'Provider' && $scope.users.length > 0) {
                    selectedUser = $scope.users[0];
                } else if (currentUser.role != 'Provider') {
                    selectedUser = {};
                }

                $scope.isNew = encounter ? false : true;
                //if the new encounter , select the first user,
                //otherwise if available use the current user on worklist
                $scope.useUser = {
                    id: (!$scope.isNew && $scope.encounter.providerId) ? $scope.encounter.providerId : $scope.users[0].id
                };

                //set range for encounters
                $scope.minDate = $scope.isNew ? new Date() : new Date(encounter.scheduledStartTime);
                $scope.maxDate = new Date();
                $scope.maxDate.setFullYear($scope.maxDate.getFullYear() + 5);

                $scope.data = {
                    followupDate: new Date(),
                    followupTime: new Date(),
                    reasonForVisit: null,
                    isCCM: false
                };

                if(!$scope.isNew){
                    $scope.data = {
                        followupDate: new Date($scope.encounter.scheduledStartTime),
                        followupTime: new Date($scope.encounter.scheduledStartTime),
                        reasonForVisit: $scope.encounter.reasonForVisit,
                        isCCM: $scope.encounter.isCCM
                    };
                }

                $scope.$on('setForm', function (evt, form) {
                    $scope.form = form;
                });

                $scope.open = function($event){
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.opened = !$scope.opened;
                };

                $scope.ok = function () {
                    $scope.notification = "";
                    $scope.$broadcast('validate');

                    if(!$scope.form.$valid) {
                        return;
                    }

                    //is new encounter than create it
                    if($scope.isNew){
                        var record = {
                            reasonForVisit: $scope.data.reasonForVisit,
                            isCCM: $scope.data.isCCM
                        };

                        if(currentUser.role === 'Admin') {
                            record.providerId = $scope.useUser.id;
                        }

                        //set time for encounter
                        record = setEncounterDateTime(record,$scope.data.followupDate,$scope.data.followupTime);
                        createEncounter(record);
                    }
                    else {
                        if(currentUser.role === 'Admin') {
                            encounter.providerId = $scope.useUser.id;
                        }
                        encounter = setEncounterDateTime(encounter,$scope.data.followupDate,$scope.data.followupTime);
                        updateEncounter(encounter,$scope.data.reasonForVisit,$scope.data.isCCM);
                    }
                };

                //set correct date time for a encounter
                var setEncounterDateTime = function(encounter,followupDate,followupTime){
                    encounter.scheduledStartTime = followupDate;
                    encounter.scheduledStartTime.setHours(followupTime.getHours(), followupTime.getMinutes(), 0, 0);
                    return encounter;
                };

                //update an existing ecnounter
                var updateEncounter = function(encounter,reasonForVisit,isCCM){
                    encounter.reasonForVisit = reasonForVisit;
                    encounter.isCCM = isCCM ? true : false;
                    encounter.patientId = $scope.data.patientId;
                    $scope.$emit('wait:start');
                    EncounterService.updateEncounter(encounter)
                    .then(function () {
                        $scope.$emit('wait:stop');
                        $modalInstance.close();
                    })
                    .catch(function (err) {
                        $scope.$emit('wait:stop');
                        $scope.notification = "Server error";
                    });
                };

                //create new encounter
                var createEncounter = function(encounter){
                    $scope.$emit('wait:start');
                    encounter.patientId = $scope.data.patientId;
                    EncounterService.createEncounter(encounter)
                    .then(function (encounter) {
                        $scope.$emit('wait:stop');
                        $modalInstance.close(encounter);
                    })
                    .catch(function () {
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

                var getPatientId = function(patients, encounter){
                    var patientId = (!$scope.isNew && encounter.patientId) ? encounter.patientId : false;
                    var defaultPatientId = patients[0].id;
                    if(patientId){
                        var isContain =  patients.find(function(patient){
                            return patient.id == patientId;
                        });
                        defaultPatientId = isContain ? patientId : patients[0].id;
                    }
                    return defaultPatientId;
                };

                var getPatientList = function(providerId){
                    if(!providerId) return;

                    $scope.$emit('wait:start');
                    PatientListService.getPatients(providerId)
                    .then(function(patients){
                        $scope.$emit('wait:stop');
                        $scope.patients = patients || [];
                        addNullPatient(patients);
                        $scope.data.patientId  = getPatientId($scope.patients, $scope.encounter);
                    })
                    .catch(function(err){
                        $scope.$emit('wait:stop');
                        console.log(err);
                    });
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss();
                };

                $scope.$watch('useUser.id', function(newValue, oldValue){
                    getPatientList(newValue);
                });

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
        }])
        .controller('EncounterMapController', [
            '$scope',
            '$modalInstance',
            'location',
            'patientCode',
            function($scope, $modalInstance, location, patientCode){
                $scope.patientCode = patientCode;
                $scope.location = location;
                var latitude = location ? location.coords.latitude : null;
                var longitude = location ? location.coords.longitude : null;
                $scope.userPosition = [latitude, longitude];

                $scope.ok = function(){
                    $modalInstance.dismiss();
                };
            }
        ]);
