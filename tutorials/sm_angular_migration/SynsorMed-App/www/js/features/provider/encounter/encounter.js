angular
.module('synsormed.controllers.provider.createEncounter',['synsormed.services.user', 'synsormed.services.encounter'])
.controller('createEncounterController', [
	'$scope',
	'$location',
	'synsormed.services.user.UserService',
	'synsormed.services.encounter.EncounterService',
	function ($scope, $location, UserService, EncounterService) {
		$scope.data = {};
		$scope.User = UserService.getUser();
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
						$scope.$emit('wait:stop');
						$scope.$emit("notification:success", "Encounter Created");
						$location.path('/showEncounter').search({id: data.id});
					}
					else {
						$scope.$emit('wait:stop');
						$scope.$emit("notification:error", "Unable to Create encounter");
					}
				})
				.catch(function(err){
					console.log(err);
					$scope.$emit('wait:stop');
					$scope.$emit("notification:error", "Server Error");
				});
			}
		};
		$scope.change = function(){
			$scope.data.scheduledStartTime = moment($scope.data.followupDate).hour($scope.data.followupTime.getHours()).minute($scope.data.followupTime.getMinutes()).toString();
		};
}]);
