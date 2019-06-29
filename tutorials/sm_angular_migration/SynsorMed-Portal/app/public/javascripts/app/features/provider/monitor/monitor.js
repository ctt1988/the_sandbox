"use strict";
angular.module('synsormed.features.provider.monitor', [
    'synsormed.services.worklist',
    'synsormed.services.user',
    'synsormed.services.measurement',
    'synsormed.services.monitor',
    'synsormed.services.pageState',
    'ui.bootstrap.datetimepicker',
    'synsormed.features.provider.monitor.edit',
    'synsormed.features.provider.monitor.insights',
    'synsormed.services.diseases',
    'synsormed.features.provider.monitor.map',
    'synsormed.features.provider.monitor.summary',
    'synsormed.services.notify',
    'btford.socket-io'
])
    .controller('MonitorController', [
        '$scope',
        '$rootScope',
        'users',
        '$location',
        '$modal',
        'synsormed.services.MonitorListService',
        'synsormed.services.UserService',
        'synsormed.services.MeasurementService',
        'synsormed.services.MonitorService',
        'synsormed.services.MonitorMeasurementService',
        'synsormed.services.MonitorStateService',
        'debounce',
        '$filter',
        '$window',
        '$timeout',
        'synsormed.services.diseases.DiseasesService',
        '$interval',
        'synsormed.services.Socket',
        'localStorageService',
        function ($scope, $rootScope, users, $location, $modal, MonitorListService, UserService, MeasurementService, MonitorService, MonitorMeasurementService, MonitorStateService, debounce, $filter, $window, $timeout, DiseasesService, $interval, Socket, localStorageService) {
            $rootScope.$emit('checkMonitors:license');


            _.forEach(users, function (user) {
                $scope.org_id = user.org_id;
            });

            $scope.profileType = localStorageService.get('profileType');

            var Tracker = {};

            var executeSingleTask = function (eventName, data) {
                Tracker[eventName] = Tracker[eventName] || { count: 0, expire: null };
                if (Tracker[eventName].count == 0) {
                    Tracker[eventName].count = 1;
                    Tracker[eventName].expire = moment().add(20, 'seconds').format('YYYY-MM-DD HH:mm:ss');
                }
                else if (Tracker[eventName].count <= 5 && moment().format('YYYY-MM-DD HH:mm:ss') < moment().add(20, 'seconds').format('YYYY-MM-DD HH:mm:ss')) {
                    Tracker[eventName].count += 1;
                }

                if (Tracker[eventName].count <= 6 && $scope.org_id == data.orgId) {
                    $scope.refreshMonitorList();
                }
            };

            Socket.on('dataRecievedFromApp', function (data) {
                executeSingleTask('dataRecievedFromApp', data);
            });

            Socket.on('deletedServiceFromApp', function (data) {
                executeSingleTask('deletedServiceFromApp', data);
            });

            $scope.user = UserService.fetchCachedUser();
            $scope.filterData = [];
            $scope.initialLoaded = false;

            $scope.$watch('monitors', function (monitorList) {
                if (monitorList.length) {
                    var normal = 0, missed = 0, outOfBound = 0, eduMissed = 0, isAlarMed = 0;
                    _.forEach(monitorList, function (monitor) {
                        var countVal = 1, oldCountVal = 1;

                        if (monitor.isMissed) {
                            missed += countVal;
                            oldCountVal = countVal;
                            countVal = countVal / 2;
                        }

                        if (monitor.isOutofBound) {
                            if (countVal !== 1)
                                missed = (missed - oldCountVal) + countVal;

                            outOfBound += countVal;
                            oldCountVal = countVal
                            countVal = countVal / 3;
                        }

                        if (monitor.isEduMissed) {
                            if (countVal !== 1) {
                                outOfBound = monitor.isOutofBound ? (outOfBound - oldCountVal) + countVal : outOfBound;
                                missed = monitor.isMissed ? (missed - oldCountVal) + countVal : missed;
                            }

                            eduMissed += countVal;
                        }

                        if (!monitor.isMissed && !monitor.isOutofBound) {
                            normal += countVal;
                        }

                        if (monitor.isAlarMed) {
                            if (countVal !== 1)
                                missed = (missed - oldCountVal) + countVal;
                            isAlarMed += countVal;
                            oldCountVal = countVal;
                            countVal = countVal / 3;
                        }

                    });

                    $scope.filterData = [
                        { title: 'Normal', count: normal, color: '#5cb85c' },
                        // {title: 'Missed', count: missed, color: '#f0ad4e'},
                        // {title: 'Missed Education', count: eduMissed, color: '#F5DEB3'},
                        { title: 'Out of Range', count: outOfBound, color: '#d9534f' }
                    ];
                }
                else
                    $scope.filterData = [];
            });

            $scope.selectUserById = function (id) {
                return _.find($scope.users, { 'id': id });
            };


            $scope.$emit('wait:start');
            DiseasesService.getDiseases()
                .then(function (resp) {
                    $scope.$emit('wait:stop');
                    $scope.diseases = resp;
                })
                .catch(function (err) {
                    $scope.$emit('wait:stop');
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Server error."
                    });
                    console.log(err);
                });

            var user = $scope.user;

            $scope.displayLocation = function (code, location) {
                var mapInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/map.html',
                    controller: 'MonitorMapController',
                    windowClass: 'custom-map-modal',
                    resolve: {
                        location: function () {
                            return location;
                        },
                        patientCode: function () {
                            return code;
                        }
                    }
                });
            };

            $scope.displaySummary = function (monitor) {
                var summaryInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/patientSummary.html',
                    controller: 'PatientSummaryControllerModal',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                    }
                });
            };

            $scope.connectedStyle = function (connectedStatus) {
                var color = '#fff';
                switch (connectedStatus) {
                    case 1:
                        color = "#F05F3A";
                        break;
                    case 2:
                        color = "#06ABA4";
                        break;
                    default:
                        color = "#fff";
                }
                return { 'border-left': '10px solid ' + color };
            };

            $scope.showLastSyncDates = function (monitor) {
                var msg = false;
                if (monitor.surveyColor == '#00ABA2') {
                    msg = 'Low Score';
                }
                else if (monitor.surveyColor == '#FF9F33') {
                    msg = 'Medium Score';
                }
                else if (monitor.surveyColor == '#F05F3A') {
                    msg = 'High Score';
                }
                else if (monitor.surveyColor == '#808080') {
                    msg = 'No Scores';
                }
                else if(monitor.surveyColor == '#fff') {
                    msg = 'Missed Survey';
                }

                return '<div style="width:100px"> ' + msg + '</div>';
            };

            $scope.checkAlertDate = function (monitor) {
                var statusColor = false;
                if (monitor.lastSync && monitor.lastSync.length) {
                    monitor.lastSync.forEach(function (data) {
                        if ((data.service == 'c5' || data.service == 'eclipse') && data.alertLastDate != undefined && !data.quantity.Cleared) {
                            statusColor = 'status-red';
                            monitor.isAlarMed = true;
                        }
                    });
                }
                if (statusColor) return statusColor;
                statusColor = "status-white";
                switch (monitor.isConnected) {
                    case 1:
                        statusColor = "status-orange";
                        monitor.isAlarMed = false;
                        break;
                    case 2:
                        statusColor = "status-green";
                        break;
                    default:
                        statusColor = "status-white";
                }
                return statusColor;
            }

            // $scope.checkAlertCondition = function(lastSync){
            //     if(lastSync && lastSync.length){
            //         var status = false;
            //         lastSync.forEach(function(data){
            //             if(data.service == 'c5' && data.alertLastDate != undefined){
            //                 status = true;
            //             }
            //         })
            //         return status;
            //     }
            //     else{
            //         return false;
            //     }
            // }

            $scope.showPatientInfo = function (monitor) {
                var not = 'No patient is linked with this code';
                var message;

                function formatPhoneNumber(s) {
                    var s2 = ("" + s).replace(/\D/g, '');
                    var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
                    return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
                }

                if (monitor.patientName) {
                    var notAvailable = 'Not available';
                    var email = '<span>Email : ' + (monitor.patientEmail || notAvailable) + '</span><br/>';
                    var ph = '<span>Mobile : ' + (formatPhoneNumber(monitor.patientPhone) || notAvailable) + '</span>';
                    message = email + ph;
                }
                return '<div>' + (message || not) + '</div>';
            };

            //local storage keys
            var monitorlistSavedData = MonitorStateService.getMonitorState();
            var selectedId = (monitorlistSavedData ? monitorlistSavedData.lastViewedUser : 0) || $scope.user.id;

            //Check the current role of the logged in user. If that user is an Admin
            //allow that person to see all provider worklists. If that user is a
            //provider, only allow them to see their own worklist.

            var addTempUser = function (allUsers) {
                if (!allUsers.length) return;
                var temp = { id: 0, name: 'All', role: 'Provider' };
                $scope.users.unshift(temp);
            };

            var removeTempUser = function (allUsers) {
                var response = [];
                allUsers.forEach(function (user) {
                    if (user.id) response.push(user);
                });
                return response;
            };

            if (user.role === 'Admin') {
                $scope.users = users.filter(function (u) {
                    return u.role === 'Provider';
                });
                addTempUser($scope.users);
            }
            else if (user.role === 'Provider') {
                $scope.users = users.filter(function (u) {
                    return u.id === user.id;
                });
            }

            if (user.role != 'Provider' && $scope.users.length > 0) {
                //get last viewed user
                var lastViewedUser = (monitorlistSavedData ? monitorlistSavedData.lastViewedUser : 0)

                // find in available user
                var userObj = $scope.users.filter(function (u) { return u.id === lastViewedUser; });

                if (lastViewedUser > 0 && userObj.length) {
                    selectedId = lastViewedUser;
                }
                else {
                    selectedId = $scope.users[0].id;
                }
            }
            $scope.alert = {
                type: 'danger'
            };

            $scope.monitors = [];
            // $scope.pagination = {
            //     pageSizes: [5, 10, 25, 50, 100],
            //     pageSize:  monitorlistSavedData ? monitorlistSavedData.pageSize : 5,
            //     page:  monitorlistSavedData ? monitorlistSavedData.page : 1,
            //     finalMonitors: []
            // };

            $scope.pagination = {
                pageSizes: [5, 10, 25, 50, 100],
                pageSize: 10,
                page: monitorlistSavedData ? monitorlistSavedData.page : 1,
                finalMonitors: []
            };

            $scope.pageCount = 0;

            if ($scope.users.length == 0) {
                $scope.alert.msg = "You must have at least one provider added to the system to see monitor list";
            }

            $scope.showUser = {
                id: monitorlistSavedData ? monitorlistSavedData.lastViewedUser : ($scope.users.length ? $scope.users[0].id : false)
            };
            $scope.filtered = [];

            $scope.$emit('pageLoaded', {
                title: "Monitors"
            });

            $scope.filters = [
                {
                    id: 0,
                    name: 'All'
                },
                {
                    id: 1,
                    name: 'Low Score'
                },
                {
                    id: 2,
                    name: 'Medium Score'
                },
                {
                    id: 3,
                    name: 'High Score'
                },
                {
                    id: 4,
                    name: 'Missed Score'
                },
                {
                    id: 5,
                    name: 'None'
                }
            ];

            $scope.filter = {
                id: monitorlistSavedData ? monitorlistSavedData.filter : 0
            };

            $scope.deletedmonitors = [
                {
                    id: 0,
                    name: 'All'
                },
                {
                    id: 1,
                    name: 'Deleted'
                },
                {
                    id: 2,
                    name: 'Non Deleted'
                }
            ];

            $scope.deletedmonitor = {
                id: 2
            };

            $scope.$watch('deletedmonitor.id', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    $scope.pagination.page = 1;
                }
                MonitorStateService.setMonitorState({
                    'lastViewedUser': $scope.showUser.id,
                    'pageSize': $scope.pagination.pageSize,
                    'page': $scope.pagination.page,
                    'filter': $scope.filter.id,
                    'deletedMonitor': $scope.deletedmonitor.id
                });
                switch ($scope.deletedmonitor.id) {
                    case 0:
                        $scope.$emit('wait:start');
                        $scope.showPrevious = false;
                        $scope.showNext = true;
                        MonitorListService.fetchMonitorList(selectedId, 0).then(function (monitorlist) {
                            $scope.$emit('wait:stop');
                            $scope.monitors = monitorlist;
                        });
                        // $scope.monitorDeletedFilter = {};
                        break;

                    case 1:
                        $scope.$emit('wait:start');
                        $scope.showPrevious = false;
                        $scope.showNext = true;
                        MonitorListService.fetchMonitorList(selectedId, 0).then(function (monitorlist) {
                            $scope.$emit('wait:stop');
                            $scope.monitors = []
                            _.forEach(monitorlist, function (monitor) {
                                if (monitor && monitor.deleted_at) {
                                    $scope.monitors.push(monitor)
                                }
                            })
                        });
                        break;

                    case 2:
                        $scope.$emit('wait:start');
                        $scope.showPrevious = false;
                        $scope.showNext = true;

                        MonitorListService.fetchMonitorCount(selectedId, 1, $scope.profileType, true, $scope.monitorFilter.surveyColor).then(function (totalmonitorlist) {
                          $scope.totalMonitorListCount =totalmonitorlist.length;
                        });
                        MonitorListService.fetchMonitorList(selectedId, 1, null ,$scope.pagination.page, $scope.pagination.pageSize, $scope.monitorFilter.surveyColor).then(function (monitorlist) {
                            $scope.$emit('wait:stop');
                            $scope.monitors = []
                            _.forEach(monitorlist, function (monitor) {
                                if (monitor && !monitor.deleted_at) {
                                    $scope.monitors.push(monitor)
                                }
                            })
                        });
                        break;

                    default:
                        $scope.monitorDeletedFilter = {};
                }
                filteredMonitors();
                updatePageCount();
            });


            $scope.monitorFilter = {};
            $timeout(function () {
                //Fetch monitors when the selected user id is changed
                $scope.$watch('showUser.id', function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        $scope.pagination.page = 1;
                    }
                    selectedId = $scope.showUser.id;
                    MonitorStateService.setMonitorState({
                        'lastViewedUser': $scope.showUser.id,
                        'pageSize': $scope.pagination.pageSize,
                        'page': $scope.pagination.page,
                        'filter': $scope.filter.id,
                        'deletedMonitor': $scope.deletedmonitor.id
                    });
                    $scope.pagination.searchBox = '';
                    fetchMonitorlist();

                }, true);

                $scope.$watch('pagination.searchBox', function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        //filteredMonitors();
                        $scope.pagination.page =1;
                        fetchMonitorlist(false, newValue);
                        updatePageCount();
                    }
                }, true);

                $scope.$watch('pagination.filter', function () {
                    filteredMonitors();
                    updatePageCount();
                }, true);

                $scope.$watch('pagination.finalMonitors', function () {
                    updatePageCount();
                }, true);

                $scope.$watch('monitors.length', function () {
                    updatePageCount();
                    filteredMonitors();
                }, true);

                $scope.$watch('pagination.pageSize', function (newValue, oldValue) {
                    if (!newValue) {
                        return;
                    }
                    if (newValue != oldValue) {
                        $scope.pagination.page = 1;
                    }
                    MonitorStateService.setMonitorState({
                        'lastViewedUser': $scope.showUser.id,
                        'pageSize': $scope.pagination.pageSize,
                        'page': $scope.pagination.page,
                        'filter': $scope.filter.id,
                        'deletedMonitor': $scope.deletedmonitor.id
                    });
                    $scope.pagination.searchBox='';
                    updatePageCount();
                    fetchMonitorlist();//filteredMonitors();
                });

                $scope.$watch('pagination.page', function () {
                    MonitorStateService.setMonitorState({
                        'lastViewedUser': $scope.showUser.id,
                        'pageSize': $scope.pagination.pageSize,
                        'page': $scope.pagination.page,
                        'filter': $scope.filter.id,
                        'deletedMonitor': $scope.deletedmonitor.id
                    });
                    $scope.pagination.finalMonitors = filterMonitorlist($scope.filtered);
                });
            }, 0);

            $scope.showPrevious = false;
            $scope.showNext = true;

            $scope.pageTurn = function (value) {
                if ($scope.pagination.page == 1 && value < 0) {
                  console.log('$scope.pagination.page == 1 && value < 0', $scope.pagination.page == 1 && value < 0);
                    return;
                }
                if ($scope.pagination.page == $scope.pageCount && value > 0) {
                  console.log('$scope.pagination.page == $scope.pageCount && value > 0', $scope.pagination.page == $scope.pageCount && value > 0);
                    return;
                }
                // if ($scope.pagination.page == $scope.pageCount - 1 && value > 0) {
                //     $scope.showNext = false;
                //     $scope.showPrevious = true;
                // }
                // if ($scope.pagination.page == 2 && value < 0) {
                //     $scope.showPrevious = false;
                //     $scope.showNext = true;
                // }
                $scope.pagination.page = $scope.pagination.page + value;
                fetchMonitorlist($scope.monitorFilter.surveyColor, $scope.pagination.searchBox);
                //filteredMonitors();
            };

            $scope.pageTo = function (page) {
                if (page == 1) {
                    $scope.showNext = true;
                    $scope.showPrevious = false;
                }
                if (page == $scope.pageCount) {
                    $scope.showPrevious = true;
                    $scope.showNext = false;
                }
                if (page != 1 && page != $scope.pageCount) {
                    $scope.showPrevious = true;
                    $scope.showNext = true;
                }
                $scope.pagination.page = page;
                fetchMonitorlist($scope.monitorFilter.surveyColor, $scope.pagination.searchBox);
            };

            //change the disply to show only selected type of monitors
            $scope.$watch('filter.id', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    $scope.pagination.page = 1;
                }
                MonitorStateService.setMonitorState({
                    'lastViewedUser': $scope.showUser.id,
                    'pageSize': $scope.pagination.pageSize,
                    'page': $scope.pagination.page,
                    'filter': $scope.filter.id,
                    'deletedMonitor': $scope.deletedmonitor.id
                });
                switch ($scope.filter.id) {
                    case 0:
                        $scope.monitorFilter = {};
                        break;

                    case 1:
                        $scope.monitorFilter = { surveyColor: "#00ABA2" };
                        break;

                    case 2:
                        $scope.monitorFilter = { surveyColor: "#FF9F33" };
                        break;

                    case 3:
                        $scope.monitorFilter = { surveyColor: "#F05F3A" };
                        break;

                    case 4:
                        $scope.monitorFilter = { surveyColor: "#fff" };
                        break;

                    case 5:
                        $scope.monitorFilter = { surveyColor: "#808080" };
                        break;

                    default:
                        $scope.monitorFilter = {};
                }
                //filteredMonitors();
                $scope.pagination.searchBox = '';
                fetchMonitorlist($scope.monitorFilter.surveyColor);
                updatePageCount();
            });
            //fetch list of all monitors
            var fetchMonitorlist = function (color, serchFor) {
                $scope.$emit('wait:start');
                MonitorListService.fetchMonitorCount(selectedId, 1, $scope.profileType, true, $scope.monitorFilter.surveyColor, serchFor).then(function (totalmonitorlist) {
                  $scope.totalMonitorListCount =totalmonitorlist.length;
                });
                MonitorListService.fetchMonitorList(selectedId, 1, $scope.profileType,$scope.pagination.page, $scope.pagination.pageSize, $scope.monitorFilter.surveyColor, serchFor).then(function (monitorlist) {
                  console.log('-->', monitorlist);
                    $scope.monitors = monitorlist;
                    _.forEach($scope.monitors, function (monitor) {
                        if (monitor && monitor.practiceId) {
                            $scope.orgId = monitor.practiceId;
                        }
                        // _.forEach(monitor.measurementName, function (measurement, index) {
                        //     if (measurement == 'Patient status') {
                        //         if (!monitor.lastSync || !monitor.lastSync[index]) {
                        //             monitor.surveyColor = '#808080';
                        //             return;
                        //         }
                        //         if (monitor.lastSync[index].service  == 'survey') {
                        //             var diffDay = moment().startOf('day').diff(moment(monitor.lastSync[index].lastSync).startOf('day'), 'days');
                        //             if (diffDay > 1) {
                        //                 monitor.surveyColor = '#fff';
                        //             }
                        //         }
                        //     }
                        // })

                    });

                    filteredMonitors();
                    updatePageCount();
                    $scope.initialLoaded = true;
                    $scope.$emit('wait:stop');
                }).catch(function () {
                    $scope.$emit('wait:stop');
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Server error."
                    });
                });
            };
            //filter monitors by filterType, search, id
            function filteredMonitors() {
                console.log('filtered monitor called');
                _.forEach($scope.monitors, function (monitor) {
                    monitor.showNote = true;
                    if (monitor && monitor.lastSync && monitor.lastSync.length) {
                        monitor.lastSync.forEach(function (data) {
                            if ((data.service == 'c5' || data.service == 'eclipse') && data.alertLastDate != undefined && !data.quantity.Cleared) {
                                monitor.isAlarMed = true;
                            }
                        });
                    }
                });
                var temp4 = $scope.pagination.searchBox?$scope.monitors:$filter('filter')($scope.monitors, $scope.monitorFilter);
                var temp2 = $filter('filter')(temp4, $scope.pagination.searchBox);
                // var temp6 = $filter('filter')(temp4, $scope.pagination.filter); // commented this line to search work

                //$scope.filtered - all filtered monitors

                $scope.filtered = $filter('orderBy')(temp2, '-id');
                // $scope.filtered = $filter('orderBy')(temp6, '-id'); // commented this line to search work
                //$scope.pagination.finalMonitors - Monitors filtered by pageSize and page
                $scope.pagination.finalMonitors = filterMonitorlist($scope.filtered);

                _.forEach($scope.pagination.finalMonitors, function (monitor) {
                    monitor.showNote = true;
                    if (monitor.notificationRead && monitor.notificationRead.indexOf($scope.user.id) != -1) {
                        monitor.showNote = false;
                    }
                });
            }

            //update Pagination acc to length of Monitors
            function updatePageCount() {
                //$scope.pageCount = Math.ceil($scope.filtered.length / $scope.pagination.pageSize);
                $scope.pageCount = Math.ceil($scope.totalMonitorListCount / $scope.pagination.pageSize);
                $scope.pages = [];
                for (var i = 1; i <= $scope.pageCount; i++) {
                    $scope.pages.push(i);
                }
            }

            //filter monitors acc to pageSize
            var filterMonitorlist = function (monitorlist) {
                if (monitorlist.length < $scope.pagination.pageSize) {
                    return monitorlist;
                }

                //update page when all monitors of a page are deleted
                // if (Math.ceil(monitorlist.length / $scope.pagination.pageSize) < $scope.pagination.page) {
                //     $scope.pagination.page = $scope.pagination.page - 1;
                // }
                // var end = $scope.pagination.page * $scope.pagination.pageSize;
                // var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
                // if (end >= monitorlist.length) {
                //     end = monitorlist.length;
                // }
                return monitorlist;
            };

            $scope.editMonitor = function (monitor) {
                if (!$scope.users.length) {
                    $scope.$emit("notification", {
                        type: 'info',
                        message: "Please add provider first."
                    });
                    return false;
                }

                $scope.$emit('wait:start');
                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/editMonitor.html',
                    controller: 'MonitorEditController',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                        users: function () {
                            return removeTempUser($scope.users);
                        },
                        measurements: function () {
                            return MeasurementService.getCachedMeasurements();
                        },
                        monitorMeasurements: function () {
                            return monitor ? MonitorMeasurementService.getMonitorMeasurements(monitor.id) : [];
                        },
                        isNew: function () {
                            return !monitor;
                        },
                        diseases: function () {
                            return $scope.diseases;
                        },
                        statusSurvey: function () {
                            return UserService.getStatusSurvey($scope.user.id)
                                .then(function (survey) {
                                    survey.unshift({
                                        id: 0,
                                        surveyName: '--No survey--',
                                        displayName: '--No survey--'
                                    });
                                    return survey;
                                });
                        }
                    }
                });

                modalInstance.result.then(function (monitor) {
                    if (monitor) {
                        $location.path('/showMonitor').search({ id: monitor.id });
                    } else {
                        fetchMonitorlist();
                    }
                });

            };

            $scope.hideNotify = function(monitor) {
                monitor.notifyRequested = false;

                $scope.$emit('wait:start');
                MonitorService.updateMonitor(monitor)
                    .then(function () {
                        $scope.$emit('wait:stop');
                    })
                    .catch(function (err) {
                        $scope.$emit('wait:stop');
                    });
            };

            $scope.uploadFile = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/uploadFile.html',
                    controller: 'UploadFileController'
                });
            }

            $scope.refreshMonitorList = function () {
                $scope.monitorlistLoading = true;
                fetchMonitorlist();
            };

            //set appointment for a monitor
            $scope.setAppointment = function (monitor) {
                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/appointment.html',
                    controller: 'MonitorAppointmentController',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    fetchMonitorlist();
                });
            };

            // delete the monitor
            $scope.deleteMonitor = function (id) {
                var r = confirm("Are you sure you want to delete this monitor?");

                if (r) {
                    $scope.$emit('wait:start');
                    MonitorService
                        .deleteMonitor(id, $scope.user)
                        .then(function () {
                            $rootScope.$emit('checkMonitors:license');
                            $scope.$emit('wait:stop');
                            $scope.$emit('notification', {
                                type: 'success',
                                message: 'Monitor Deleted'
                            });
                            fetchMonitorlist();
                        })
                        .catch(function () {
                            $scope.$emit('wait:stop');
                            $scope.$emit("notification", {
                                type: 'danger',
                                message: "Server error."
                            });
                        });
                }
            };

            $scope.resetMonitor = function (id) {
                var r = confirm("Are you sure you want to reset this monitor");

                if (r) {
                    $scope.$emit('wait:start');
                    MonitorService
                        .resetMonitor(id)
                        .then(function () {
                            $rootScope.$emit('checkMonitors:license');
                            $scope.$emit('wait:stop');
                            $scope.$emit('notification', {
                                type: 'success',
                                message: 'Reset Monitor Successfully'
                            });
                            fetchMonitorlist();
                        })
                        .catch(function () {
                            $scope.$emit('wait:stop');
                            $scope.$emit("notification", {
                                type: 'danger',
                                message: "Server error."
                            });
                        });
                }
            };

            $scope.permanentDeleteMonitor = function (id) {
                var r = confirm("There is no way to undo this action. Are you sure you want to permanently delete this monitor?");

                if (r) {
                    $scope.$emit('wait:start');
                    MonitorService
                        .deleteMonitor(id, user, true)
                        .then(function () {
                            $rootScope.$emit('checkMonitors:license');
                            $scope.$emit('wait:stop');
                            $scope.$emit('notification', {
                                type: 'success',
                                message: 'Monitor Deleted Permanently'
                            });
                            fetchMonitorlist();
                        })
                        .catch(function () {
                            $scope.$emit('wait:stop');
                            $scope.$emit("notification", {
                                type: 'danger',
                                message: "Server error."
                            });
                        });
                }
            };

            $scope.monitorInsightChart = function (monitor) {
                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/monitorInsights.html',
                    controller: 'MonitorInsightsController',
                    windowClass: 'monitor-insight-modal',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                        monitorMeasurements: function () {
                            return monitor ? MonitorMeasurementService.getMonitorMeasurements(monitor.id) : [];
                        },
                        measurements: function () {
                            return MeasurementService.getCachedMeasurements();
                        },
                        statusSurvey: function () {
                            return UserService.getStatusSurvey($scope.user.id);
                        }
                    }
                });

                modalInstance.result.then(function () {

                }, function () {
                    $scope.refreshMonitorList();
                    $scope.$emit('wait:stop');
                });
            };

            //link a monitor with oauth data
            $scope.monitorOauthLink = function (monitor) {
                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/serviceList.html',
                    controller: 'MonitorOauthController',
                    windowClass: 'monitor-service-modal',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        }
                    }
                });

                //reload the monitor list
                modalInstance.result.then(function (oauthData) {
                    if (!oauthData) {
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: "Synsormed Connected Failed"
                        });
                        return;
                    }

                    //update this data with monitor
                    MonitorMeasurementService
                        .setOauthDataForMeasurement(monitor.id, monitor.measurementId, oauthData, true)
                        .then(function (data) {
                            $scope.$emit("notification", {
                                type: 'success',
                                message: "Synsormed Connected"
                            });
                        });
                });

                modalInstance.result.finally(function () {
                    $scope.refreshMonitorList();
                    $scope.$emit('wait:stop');
                });
            };

            $scope.notifyMonitor = function (monitor) {
                if (!monitor) return;

                var modalInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/notification.html',
                    controller: 'MonitorNotificationController',
                    windowClass: 'monitor-service-modal',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        }
                    }
                });
            };
        }])
    .controller('MonitorNotificationController', [
        '$scope',
        'monitor',
        '$modalInstance',
        'synsormed.services.NotifyService',
        function ($scope, monitor, $modalInstance, NotifyService) {
            $scope.patientCode = monitor ? monitor.patientCode : false;

            $scope.title = 'Send message ' + $scope.patientCode;

            $scope.$on('setForm', function (evt, form) {
                $scope.form = form;
            })

            $scope.send = function () {
                $scope.$broadcast('validate');
                if (!$scope.form.$valid) return;
                $scope.waiting = true;
                NotifyService.sendPushNotificationToMonitor(monitor.id, $scope.form.message.$modelValue)
                    .then(function (res) {
                        $scope.waiting = false;
                        $scope.$emit("notification", {
                            type: 'success',
                            message: "Notification successfully sent"
                        });
                        $modalInstance.dismiss();
                    })
                    .catch(function (e) {
                        var msg = "Notification sending failed";
                        if (e && e.data && e.data.code && e.data.code == 404) {
                            msg = 'This user does not have messaging enabled';
                        }
                        $scope.waiting = false;
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: msg
                        });
                    });
            };

            $scope.cancel = function () {
                $modalInstance.dismiss();
            }
        }
    ])
    .controller('MonitorAppointmentController', [
        '$scope',
        '$location',
        '$modalInstance',
        'monitor',
        'synsormed.services.MonitorService',
        'synsormed.services.MonitorMeasurementService',
        function ($scope, $location, $modalInstance, monitor, MonitorService, MonitorMeasurementService) {
            $scope.monitor = monitor;

            monitor.appointmentMeta = monitor.appointmentMeta ? monitor.appointmentMeta : {};

            $scope.date = {
                0: monitor.appointmentMeta[0] ? new Date(monitor.appointmentMeta[0]) : null,
                1: monitor.appointmentMeta[1] ? new Date(monitor.appointmentMeta[1]) : null,
                2: monitor.appointmentMeta[2] ? new Date(monitor.appointmentMeta[2]) : null
            };

            $scope.$on('setForm', function (evt, form) {
                $scope.form = form;
            });

            $scope.goToEncounter = function (id) {
                $modalInstance.dismiss();
                $location.path('/showCode').search({ id: id });
            };

            $scope.resetAppointment = function () {
                var r = confirm("New appointment date will be approved by patient first.");

                if (r) {
                    //show the reset form again
                    $scope.monitor.encounterId = false;
                }
            };

            $scope.ok = function () {
                $scope.notification = '';
                $scope.$broadcast('validate');

                if (!$scope.form.$valid) {
                    return;
                }

                MonitorService
                    .createAppointment(monitor.id, $scope.date)
                    .then(function () {
                        $modalInstance.close();
                    })
                    .catch(function () {
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: "Server error."
                        });
                    });
            };

            $scope.cancel = function () {
                $modalInstance.dismiss();
            };
        }
    ])
    .controller('MonitorOauthController', [
        '$scope',
        '$window',
        '$interval',
        '$modalInstance',
        'monitor',
        'synsormed.services.MonitorServicesService',
        'synsormed.services.MonitorService',
        function ($scope, $window, $interval, $modalInstance, monitor, MonitorServicesService, MonitorService) {
            $scope.services = null;
            $scope.connectedServices = null;
            $scope.$emit("wait:start");

            MonitorServicesService
                .getConnectedService(monitor.id)
                .then(function (services) {
                    $scope.connectedServices = _.map(services, function (s) { s.service_name = _.capitalize(s.service_name); return s; });
                    $scope.$emit("wait:stop");
                })
                .catch(function (e) {
                    console.log(e);
                    $scope.$emit("wait:stop");
                    $scope.$emit('notification', {
                        type: 'danger',
                        message: 'Server Error'
                    });
                });

            $scope.ok = function () {
                $modalInstance.dismiss('close');
            };

            $scope.unlinkMonitor = function (oauthId) {
                var r = confirm("This will disconnect service from Synsormed. Are you sure ?");
                if (r) {
                    $scope.$emit("wait:start");
                    MonitorService
                        .unlinkOauthToken(monitor.id, oauthId)
                        .then(function () {
                            $scope.connectedServices = null;
                            $modalInstance.dismiss('close');
                            $scope.$emit("wait:stop");
                            $scope.$emit('notification', {
                                type: 'success',
                                message: 'Monitor Unlinked'
                            });
                        })
                        .catch(function (e) {
                            console.log(e);
                            $scope.$emit("wait:stop");
                            $scope.$emit('notification', {
                                type: 'danger',
                                message: 'Server Error'
                            });

                        });
                }
            };

            var eventId = null;

            $scope.startOauth = function (service) {
                alert('Old code method called');
                //var w = 450;
                //var h = 450;
                //var left = (screen.width / 2) - (w / 2);
                //var top = (screen.height / 2) - (h / 2);

                //pass the monitor id to attach token to
                //var ref = $window.open(service.apiUrl + '?monitorId=' + monitor.id , service.title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
                //eventId = service.name;
            };

            // Create IE + others compatible event handler
            var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
            var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

            //remove the event handler
            $(window).unbind(messageEvent);

            // Listen to message from child window
            $(window).bind(messageEvent, function (e) {
                if (!eventId) { return false; }
                e = e.originalEvent;
                if (e.data && e.data.success) {
                    $modalInstance.close({
                        oauth_data: e.data.data,
                        service_name: eventId
                    });
                } else {
                    $modalInstance.close(false);
                }
            });

        }
    ])
    .controller('UploadFileController', [
        '$scope',
        '$window',
        '$interval',
        '$modalInstance',
        'synsormed.services.MonitorMeasurementService',
        function ($scope, $window, $interval, $modalInstance, MonitorMeasurementService) {
            var fileData;
            $scope.$on('fileupdate', function (evt, file) {
                fileData = file;
            });
            $scope.uploadFile = function () {
                var file = $scope.myFile;
                MonitorMeasurementService.uploadFileToUrl(fileData)
                    .then(function (resp) {
                        $modalInstance.dismiss();
                        $scope.$emit('notification', {
                            type: 'success',
                            message: 'File uploaded succesfully'
                        });
                    })
                    .catch(function (err) {
                        $scope.$emit('notification', {
                            type: 'danger',
                            message: err.data
                        });
                    });
            };
        }
    ])
    .directive('fileModel', ['$parse', 'synsormed.services.MonitorMeasurementService', '$rootScope', function ($parse, MonitorMeasurementService, $rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;
                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                        $rootScope.$broadcast('fileupdate', element[0].files[0]);
                    });
                });
            }
        };
    }]);
