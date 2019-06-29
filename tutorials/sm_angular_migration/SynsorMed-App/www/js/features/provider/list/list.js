angular.module('synsormed.controllers.provider.list', [
	'synsormed.services.user',
	'synsormed.services.weemo',
	'synsormed.services.provider',
	'synsormed.services.notification',
	'synsormed.services.oauth',
	'synsormed.services.awake'
])
.controller('patientListController', [
	'$scope',
	'$q',
	'$interval',
	'$timeout',
	'$location',
	'$http',
	'waiting',
	'worklist',
	'synsormed.services.video.Connector',
	'synsormed.services.provider.ProviderService',
	'synsormed.services.logging.time',
	'synsormed.services.error.generic',
	'synsormed.services.user.UserService',
	'synsormed.services.oauth.OauthService',
	'synsormed.services.notification.NotificationSchedulerService',
	'media',
	'$modal',
	'synsormed.services.awake.awakeService',
	function($scope, $q, $interval, $timeout, $location, $http, waiting, worklist, videoConnector, ProviderService, TimeLogger, GenericError,
		UserService, OauthService, NotificationSchedulerService, Media, $modal, awakeService){
			$scope.$emit('wait:stop');
			// keep app awake on worklist
			awakeService.keepAwake();

			var user = UserService.getUser();
			console.log("User object: " + JSON.stringify(user));
			var callHappened = false;
			var userAthenticated = false;
			var audio = new Media('media/patient-online.mp3');
			currentPatient = null;

			$scope.callTokens = null;
			$scope.status = null;
			$scope.calling = false;
			$scope.wait = true;
			$scope.worklist = worklist;
			$scope.waiting = waiting;

			//api data
			$scope.apiData = null;
			$scope.apiNoti = null;

			$scope.orderOptions = [{
				name: 'Online Status',
				id: 'isWaiting'
			}, {
				name: 'Code',
				id: 'code'
			}, {
				name: 'Appointment Time',
				id: 'appointmentTime'
			}];
			$scope.sort = {};
			$scope.sort.sortOrder = $scope.orderOptions[0];

			/** Perform Authentication and Prelogin the Provider **/
			function auth() {
				return videoConnector.initialize()
				.then(function(){
					return videoConnector.authenticate(user.email)
					.then(function() {
						//WeemoConnector.setName("Provider");
						userAuthenticated = true;
						return ProviderService
						.listWaitingPatients(user.id)
						.then(function(patients) {
							$scope.patients = patients;
							console.log("The waiting patients are: " + JSON.stringify(patients));
							updateWorklist();
						});
					});
				});

			}

			function updateWorklist() {

				var newlyWaitingPeople = false;
				var rtcIdArr = [];
				var promiseArr = [];

				_.each($scope.worklist, function(patient) {
					var waitRecord = _.find($scope.waiting, function(w) {
						return w.code === patient.code;
					});

					patient.startedWaitingOn = waitRecord ? waitRecord.startedWaitingOn : null;
					patient.callerId = waitRecord ? waitRecord.callerId : null;
					//If patient has callerID from API, the API thinks patient is logged into server
					if(!_.isEmpty(patient.callerId)) rtcIdArr.push(patient.callerId);
					else patient.isWaiting = false;
					patient.oauthAvailable = waitRecord ? waitRecord.oauthAvailable : false;
				});

				if(!_.isEmpty(rtcIdArr))
				{
					//Now that we know the API thinks patient is logged in, let's doublecheck video server
					console.log('NON EMPTY RTC ID ARR');
					rtcIdArr.forEach(function(id){
						//promiseArr.push(videoConnector.isRtcIDConnected(id));
						promiseArr.push(true);
					});

					if(!_.isEmpty(promiseArr))
					{
						console.log('NON EMPTY PROMISE ARR');
						$q.all(promiseArr)
						.then(function(data){
							data.forEach(function(val, k){
								var index = _.findIndex($scope.worklist, function(patient) {
									return patient.callerId == rtcIdArr[k];
								});
								//At this point, we are confirming that the API and the video service are in sync that the patient is logged in
								//Check to see if patient is newlywaiting to play audio tone
								if($scope.worklist[index].isWaiting == false && val == true){
									audio.play();
								}
								if(val){
									console.log($scope.worklist[index].callerId + " is a waiting patient");
								}
								$scope.worklist[index].isWaiting = val;
							});
							$scope.worklist.forEach(function(patient){
								if(_.isEmpty(patient.callerId)) patient.isWaiting = false;
							});
						})
						.catch(function(error){
							$scope.$emit('wait:stop');
							$scope.$emit('service:error', new GenericError(error.error ? error.error : error.message));
							$scope.status = null;
							$scope.calling = false;
						});
					}
				}

				$scope.worklist = $scope.worklist.sort(function(a, b) {
					var aVal = a[$scope.sort.sortOrder.id];
					var bVal = b[$scope.sort.sortOrder.id];
					if ($scope.sort.sortOrder.id === 'code') {
						aVal = aVal.toLowerCase();
						bVal = bVal.toLowerCase();
					}
					if ($scope.sort.sortOrder.id === 'isWaiting') {
						//Force into a number and reverse sort
						aVal = aVal ? -1 : 1;
						bVal = bVal ? -1 : 1;
					}
					if (aVal > bVal) {
						return 1;
					} else if (aVal < bVal) {
						return -1;
					}
					return 0;
				});

				/** Notitifcation Disabled
				//keep the notifiying list updated
				NotificationSchedulerService.updatedNotifyingList($scope.worklist);
				NotificationSchedulerService.setNotificationForFurture();
				**/
			}

			$scope.$emit('wait:start');
			auth()
			.then(function(){
				$scope.$emit('wait:stop');
			})
			.catch(function(error){
				$scope.$emit('wait:stop');
				$scope.$emit('service:error', new GenericError(error.error ? error.error : error.message));
			});

			$scope.createEncounter = function(){
				$modal.open({
					templateUrl: 'js/features/provider/list/createEncounter.html',
					controller: 'newEncounterModalController',
					resolve: {
						user: function(){
							return user;
						}
					}
				});
			};

			$scope.reloadView = function() {
				$scope.$broadcast('scroll.refreshComplete');
				//We want to use our own wait spinner
				$scope.$emit('wait:start');
				$q.all(ProviderService.getWorkList(user.id).then(function(worklist) {
					$scope.worklist = worklist;
					/** Notitifcation Disabled
					//keep the notifiying list
					NotificationSchedulerService.updatedNotifyingList($scope.worklist);
					**/
				}), ProviderService.listWaitingPatients(user.id).then(function(waiting) {
					$scope.waiting = waiting;
				})).then(function() {
					$scope.$emit('wait:stop');
					updateWorklist();
				}).catch(function(err) {
					$scope.$emit('wait:stop');
					$scope.$emit('service:error', err)
				});
			};

			var waitingPatientsInterval = $interval(function() {
				ProviderService.listWaitingPatients(user.id).then(function(waiting) {
					$scope.waiting = waiting;
					console.log('UPDATING  WORKLIST');
					updateWorklist();
				});
			}, 15000);

			$scope.$watch('sort.sortOrder', function() {
				updateWorklist();
			}, true);

			$scope.call = function(patient) {
				$scope.$emit('network:scan:stop');
				currentPatient = patient;
				//clear api data as we make call
				clearAPIData();
				//is oauth available
				var oauthAvailable = currentPatient.oauthAvailable || false;
				console.log("The patient object is: " + JSON.stringify(patient));
				console.log("The callTokens are: " + $scope.callTokens);
				$scope.callTokens = user.email;
				if(userAthenticated){
					$scope.wait = false;
					$scope.calling = true;
					$scope.status = 'connecting';
					console.log('HERE NOW CREATING CALL');
					//true, indicate call is from provider side
					return videoConnector.createCall(patient.patientCode, true, oauthAvailable, $scope.callTokens);
				} else {
					$scope.$emit('wait:start');
					$scope.wait = true;
					$scope.calling = false;
					$scope.status = 'connectingToWeemo';
					return auth()
					.then(function(){
						$scope.$emit('wait:stop');
						$scope.wait = false;
						$scope.calling = true;
						$scope.status = 'connecting';
						console.log('AUTH THEN HERE NOW CREATING CALL');
						//true, indicate call is from provider side
						return videoConnector.createCall(patient.patientCode, true, oauthAvailable, $scope.callTokens);
					});
				}
			};

			/**
			* Using $scope.$watch doesn't work here for some reason - maybe
			* due to the window losing focus?
			*/
			var lastCallStatus = null;

			var loggingInterval = $interval(function() {
				TimeLogger.log("InCallScreen");
			}, 15000);

			/*Instead of checking every 500ms for status change, wait for broadcast from WeemoConnector*/
			$scope.$on('callchange', function(event, data) {
				console.log("I received the emit from the broadcast: " + data);

				//if (videoConnector.hasCall()) {
				if(true){
					lastCallStatus = data;
					switch(data) {
						case "CREATED":
						videoConnector.callWasCreated();
						break;
						case "NONE":
						$scope.status = null;
						if (lastCallStatus != videoConnector.CallStatus.NONE || lastCallStatus === null) {
							TimeLogger.log("Call connecting");
						}
						break;
						case "PROCEEDING":
						$scope.status = 'ringing';
						if (lastCallStatus != videoConnector.CallStatus.WAITING_ON_RECIPIENT) {
							TimeLogger.log("Call ringing");
						}
						break;
						case "ACTIVE":
						callHappened = true;
						$scope.status = 'active';
						if (lastCallStatus != videoConnector.CallStatus.ACTIVE) {
							TimeLogger.log("Call accepted");

							//load API data if call started
							if (!$scope.apiData) {
								$scope.getPatientData();
							}
						}
						break;

						case "ENDED":

						// necessary to clear the pause timeout on android
		                $scope.$emit('prevent:pause:timeout');

						$scope.calling = false;
						//videoConnector.removeCall();
						if (!callHappened) {
							$scope.$emit('notification:information', 'Call to ' + currentPatient.code + ' did not connect');
							$scope.status = null;
						} else {
							$scope.$emit('notification:information', 'Call to ' + currentPatient.code + ' complete');
							$scope.status = 'complete';
							TimeLogger.log("Call completed");
						}

						currentPatient = null;
						callHappened = false;
						clearAPIData();

						//WeemoConnector.disconnect(false);
						$timeout(function() {
							$scope.status = null;
						}, 1000);

						//update waiting patient list when call finish,
						//refresh call status instantly
						ProviderService.listWaitingPatients(user.id).then(function(waiting) {
							$scope.waiting = waiting;
							updateWorklist();
						});

						$scope.$emit('network:scan:start');
						break;

					}

				} else {
					lastCallStatus = null;
				}

			});

			//            var interval = $interval(function () {
			//                if(WeemoConnector.hasCall()) {
			//                    console.log("Call Status: " + WeemoConnector.getCallStatus());
			//                    if(WeemoConnector.getCallStatus() == WeemoConnector.CallStatus.ENDED) {
			//                        $scope.calling = false;
			//                        WeemoConnector.removeCall();
			//
			//                        if(!callHappened) {
			//                            $scope.$emit('notification:information', 'Call to ' + currentPatient.code + ' did not connect');
			//                            $scope.status = null;
			//                        } else {
			//                            $scope.$emit('notification:information', 'Call to ' + currentPatient.code + ' complete');
			//                            $scope.status = 'complete';
			//                            TimeLogger.log("Call completed");
			//                        }
			//                        currentPatient = null;
			//                        callHappened = false;
			//                        clearAPIData();
			//
			//                        WeemoConnector.disconnect();
			//                        $timeout(function () {
			//                            $scope.status = null;
			//                        }, 1000);
			//
			//                        //update waiting patient list when call finish,
			//                        //refresh call status instantly
			//                        ProviderService.listWaitingPatients(user.id).then(function (waiting) {
			//                            $scope.waiting = waiting;
			//                            updateWorklist();
			//                        });
			//
			//                        $scope.$emit('network:scan:start');
			//                    }
			//                    if(WeemoConnector.getCallStatus() == WeemoConnector.CallStatus.NONE) {
			//                        $scope.status = null;
			//                        if(lastCallStatus != WeemoConnector.CallStatus.NONE || lastCallStatus === null) {
			//                            TimeLogger.log("Call connecting");
			//                        }
			//                    }
			//                    if(WeemoConnector.getCallStatus() == WeemoConnector.CallStatus.WAITING_ON_RECIPIENT) {
			//                        $scope.status = 'ringing';
			//                        if(lastCallStatus != WeemoConnector.CallStatus.WAITING_ON_RECIPIENT) {
			//                            TimeLogger.log("Call ringing");
			//                        }
			//                    }
			//                    if(WeemoConnector.getCallStatus() == WeemoConnector.CallStatus.ACTIVE) {
			//                        callHappened = true;
			//                        $scope.status = 'active';
			//                        if(lastCallStatus != WeemoConnector.CallStatus.ACTIVE) {
			//                            TimeLogger.log("Call accepted");
			//
			//                            //load API data if call started
			//                            if(!$scope.apiData){
			//                              $scope.getPatientData();
			//                            }
			//                        }
			//                    }
			//                    lastCallStatus = WeemoConnector.getCallStatus();
			//                } else {
			//                    lastCallStatus = null;
			//                }
			//            }, 500);

			$scope.disconnectCall = function() {
				videoConnector.disconnectCall();
			};

			/** Notitification Disabled
			//when application is in background it will update worklist in each 15 sec
			var backgroundWorklistUpdater = null;
			//if application is in foreground, no need to send notifications
			$scope.$on('app:resume',function(){
			$interval.cancel(backgroundWorklistUpdater);
			NotificationSchedulerService.removeNotifications();
		});
		//if application is in background send notifications
		$scope.$on('app:pause',function(){
		//if android device then it will run inbackground to update the notifications
		backgroundWorklistUpdater = $interval(function(){
		ProviderService.getWorkList(user.id).then(function (worklist) {
		$scope.worklist = worklist;
		//keep the notifiying list updated
		NotificationSchedulerService.updatedNotifyingList($scope.worklist);
		NotificationSchedulerService.setNotificationForFurture();
	}).catch(function(err){
	console.error(err);
});
},15000);
});

**/

$scope.$on('$destroy', function() {
	//$interval.cancel(interval);
	$interval.cancel(loggingInterval);
	$interval.cancel(waitingPatientsInterval);
	//$interval.cancel(backgroundWorklistUpdater);
	ProviderService.dropToken(user.id);
	// allow app to sleep again
	awakeService.allowSleep();
});

// pull current patient records from API
$scope.getPatientData = function() {

	//get current patient, it is set by callCreate function
	var patientId = currentPatient.id;

	//check if patient id is valid or not
	if (patientId === undefined) {
		$scope.$emit("notification:error", "Invalid Patient");
		return;
	}

	//start loading animation
	$scope.$emit("wait:start");

	//get the encounter
	OauthService.readAPIServiceData(patientId).then(function(patientData) {

		$scope.$emit('wait:stop');

		//prevent notification update break the API data
		if (!patientData.hasOwnProperty("message")) {
			var tmp = {};
			tmp.data = patientData;
			tmp.message = null;

			patientData = tmp;
		}

		//check if api data is valid
		if ( typeof patientData.data === 'string' || patientData.data === null) {
			//indicate if there was some failture
			$scope.apiData = false;
			$scope.apiNoti = null;
		} else {
			$scope.apiData = patientData.data;
			$scope.apiNoti = patientData.message;
		}
	}).catch(function() {
		$scope.apiNoti = null;
		$scope.$emit('wait:stop');
		$scope.$emit("notification:error", "No Additional Patient Data Available");
	});

};

//helper function to check if an object has childs or not
$scope.hasChilds = function(data) {
	if ( typeof data === 'object' || typeof data === 'array') {
		return true;
	} else {
		return false;
	}
};

//clear the api data
var clearAPIData = function() {
	$scope.apiData = null;
	$scope.apiNoti = null;
};

}])
.controller('newEncounterModalController', [
	'$scope',
	'$location',
	'$modalInstance',
	'user',
	'synsormed.services.encounter.EncounterService',
	function ($scope, $location, $modalInstance, User, EncounterService) {
		$scope.data = {};
		$scope.User = User;
		$scope.minDate = new Date();
		$scope.hstep = 1;
		$scope.mstep = 1;
		$scope.useUser = {
			id: $scope.User.id
		};
		$scope.data = {
			providerId: $scope.User.id,
			followupTime: new Date(),
			followupDate: new Date()
		};
		$scope.data.scheduledStartTime = moment($scope.data.followupDate).hour($scope.data.followupTime.getHours()).minute($scope.data.followupTime.getMinutes()).toString();
		$scope.ok = function(){
			$scope.$broadcast('validate');
			$scope.form.$setDirty();
			if($scope.form.$valid)
			{
				$scope.$emit('wait:start');
				EncounterService
				.createEncounter($scope.data)
				.then(function(data){
					if(data)
					{
						$modalInstance.close();
						$scope.$emit('wait:stop');
						$scope.$emit("notification:success", "Encounter Created");
						$location.path('/showEncounter').search({id: data.id});
					}
					else {
						$modalInstance.close();
						$scope.$emit('wait:stop');
						$scope.$emit("notification:error", "Unable to Create encounter");
					}
				})
				.catch(function(err){
					console.log(err);
					$modalInstance.close();
					$scope.$emit('wait:stop');
					$scope.$emit("notification:error", "Server Error");
				});
			}
		};
		$scope.change = function(){
			$scope.data.scheduledStartTime = moment($scope.data.followupDate).hour($scope.data.followupTime.getHours()).minute($scope.data.followupTime.getMinutes()).toString();
		};
		$scope.cancel = function(){
			$modalInstance.close();
		};
	}]);
