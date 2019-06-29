
"use strict";

angular.module('synsormed.features.provider.monitor.summary', [])
    .controller('PatientSummaryControllerModal', [
        '$scope',
        '$rootScope',
        '$modalInstance',
        'monitor',
        '$modal',
        '$window',
        'synsormed.services.UserService',
        'synsormed.services.PatientService',
        'synsormed.services.MonitorService',
        'synsormed.services.ReportService',
        function ($scope, $rootScope, $modalInstance, monitor, $modal, $window, UserService, PatientService, MonitorService, ReportService) {
            $scope.monitor = monitor;
            $scope.monitor.seenNotes = true;

            $scope.patient = '';
            $scope.providersName = '';
            $scope.providersEmail = ' ';
            $scope.providersList = [];
            $scope.newNote = null;
            $scope.durations = [{
                value: '',
                text: 'Select Minutes'
            }, {
                value: 0,
                text: '0 minute'
            },  {
                value: 2,
                text: '2 minutes'
            }, {
                value: 5,
                text: '5 minutes'
            }, {
                value: 10,
                text: '10 minutes'
            }, {
                value: 15,
                text: "15 minutes",
            }, {
                value: 20,
                text: "20 minutes",
            }, {
                value: 30,
                text: "30 minutes",
            }];
            $scope.dropdownStatus = {};
            $scope.editingNoteIndex = null;
            $scope.noteBeforeEditing = '';

            $scope.updateDuration = function(index, note, duration) {
                if(duration==='') return;
                note.duration = duration;
                $scope.dropdownStatus[index] = false;
                $scope.saveMonitor();
            };

            $scope.saveMonitor = function(message, noNotification) {
                var temp = angular.copy($scope.monitor);
                _.forEach(temp.notes, function (val, ind) {
                    val.duration = val.duration * 60;
                });

                $scope.$emit('wait:start');
                MonitorService.updateMonitor(temp)
                    .then(function () {
                        if (!noNotification) {
                            $scope.$emit("notification", {
                                type: 'success',
                                message: message || 'Note successfully updated'
                            });
                        }
                        $scope.$emit('wait:stop');
                    })
                    .catch(function (err) {
                        $scope.$emit('wait:stop');
                    });
            };

            $scope.saveMonitor('', true);

            $scope.patientDetails = function () {
                $scope.$emit('wait:start');
                PatientService.getPatient($scope.monitor.patientId).then(function (result) {
                    $scope.$emit('wait:stop');

                    $scope.patient = result;
                    $scope.patient.age = moment().diff(moment(new Date(result.dob)), 'years');
                }).catch(function (err) {
                    $scope.$emit('wait:stop');
                    console.log(err);
                });
            }
            if($scope.monitor.patientId != null) $scope.patientDetails();

            $scope.showNotes = function () {
                if ($scope.monitor.note == null || $scope.monitor.note.length == 0) return;
                $scope.monitor.note.sort(function (a, b) {
                    return moment(a.date).diff(moment(b.date));
                });
                $scope.monitor.note.reverse();
                _.forEach($scope.monitor.note, function (data, index) {
                    if($scope.monitor.note[index].duration > 30)
                    $scope.monitor.note[index].duration = data.duration / 60;
                });
            }
            $scope.showNotes();

            $scope.formatDate = function(rawDate){
                return moment(rawDate).format('LLLL');
            }

            $scope.editNote = function (index, note) {
                $scope.editingNoteIndex = index;
                $scope.noteBeforeEditing = note.text;
            };

            $scope.cancelEdit = function() {
                $scope.monitor.note[$scope.editingNoteIndex].text = $scope.noteBeforeEditing;
                $scope.editingNoteIndex = null;
            };

            $scope.confirmEdit = function() {
                $scope.editingNoteIndex = null;
                $scope.saveMonitor();
            };

            $scope.updateNewNoteDuration = function(duration) {
                $scope.newNote.duration = duration;
                $scope.dropdownStatus.new = false;
            };
            $scope.cancelAdd = function() {
                $scope.newNote = null;
            };
            $scope.confirmAdd = function() {
                if(!$scope.newNote.duration && $scope.newNote.duration!==0){
                  return $scope.$emit("notification", {type:'danger',message:"select the time first"});
                }
                $scope.newNote.date = moment().utc().format();
                $scope.monitor.note = $scope.monitor.note || [];
                $scope.monitor.note.unshift($scope.newNote);
                $scope.monitor.addNote = true;
                $scope.monitor.seenNotes = false;
                $scope.saveMonitor('New note successfully added');
                $scope.newNote = null;
            };

            $scope.addNote = function (monitor, seenNotes) {
                $scope.newNote = {};
            }

            $scope.printNote = function () {
                if ($scope.monitor.note == undefined) return;
                var w = 450;
                var h = 450;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);

                var noteContent = '';
                _.forEach($scope.monitor.note, function (note) {
                    noteContent = noteContent + '<div style="float:left">' + note.date + '</div> <br /> <br />' +
                        '<div style="word-wrap:break-word"> ' + note.text + ' </div><br/>' +
                        '<p style=" border-bottom: 2px solid #92ccc5;width: 92%; margin: auto; margin-top: 12px; margin-bottom: 12px;"> </p>'
                });
                var content = '<div>' +
                    '<div style="text-align:center"><h1>Note for ' + $scope.monitor.patientCode + '</h1></div>' +
                    noteContent +
                    '</div>';

                var printWindow = $window.open('', 'PRINT', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
                printWindow.document.write('<html><head><title>' + document.title + '</title>');
                printWindow.document.write('</head><body >');
                printWindow.document.write(content);
                printWindow.document.write('</body></html>');
                printWindow.document.close(); // necessary for IE >= 10
                printWindow.focus(); // necessary for IE >= 10*/
                printWindow.print();
                printWindow.close();
            };


            $scope.deleteNote = function (note) {
                if (!$scope.monitor.note || $scope.monitor.note.length == 0) return;
                var r = confirm("Are you sure you want to delete this note?");
                if (r) {
                    $scope.$emit('wait:start');
                    $scope.notes = angular.copy($scope.monitor.note ? $scope.monitor.note : []);
                    $scope.notes.splice($scope.monitor.note.indexOf(note), 1);
                    $scope.monitor.note = $scope.notes;
                    MonitorService
                        .updateMonitor($scope.monitor)
                        .then(function () {
                            $scope.$emit('wait:stop');
                            $scope.$emit('notification', {
                                type: 'success',
                                message: 'Note Deleted'
                            });
                            if ($scope.monitor.note) $scope.showNotes();
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

            UserService.fetchAllUsers()
                .then(function (users) {
                    _.forEach(users, function (data) {
                        if (data.role == 'Provider') {
                            $scope.providersList.push(data);
                            _.forEach($scope.monitor.providersId, function (id) {
                                if (data.id == id) {
                                    $scope.providersName = $scope.providersName + data.name + ', ';
                                    $scope.providersEmail = $scope.providersEmail + data.email + ', ';
                                }
                            });
                        }
                    });
               $scope.providersName = $scope.providersName.slice(0, -2);
               $scope.providersEmail = $scope.providersEmail.slice(0, -2);
                })
                .catch(function (err) {
                    console.log(err);
                });


            $scope.editPatientDetail = function () {
                var patientinstance = $modal.open({
                    templateUrl: 'javascripts/app/features/settings/editPatient.html',
                    controller: 'SettingsPatientEditController',
                    resolve: {
                        patient: function () {
                            return $.extend({}, $scope.patient);
                        },
                        users: function () {
                            return $scope.providersList;
                        }
                    }
                })
                patientinstance.result.then(function () {
                    $scope.patientDetails();
                })
            };

            $scope.downloadPDF = function () {
                $scope.$emit('wait:start');
                ReportService.getPdfToken($scope.monitor.id)
                    .then(function (token) {
                        $scope.$emit('wait:stop');
                        return ReportService.downLoadPdf(token, $scope.monitor.id);
                    })
                    .catch(function (e) {
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: "Unable to download pdf file."
                        });
                        $scope.$emit('wait:stop');
                    });
            };

            $scope.ok = function () {
                $modalInstance.close();
            };
        }
    ]);
