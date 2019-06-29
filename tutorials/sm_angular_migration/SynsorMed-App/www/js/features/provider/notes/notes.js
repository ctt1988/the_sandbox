angular.module('synsormed.controllers.provider.notes', [
        'synsormed.services.user',
        'synsormed.services.weemo',
        'synsormed.services.provider'
    ]).
    controller('providerNoteWritingController', [
        '$scope',
        '$location',
        'synsormed.services.encounter.EncounterService',
        '$route',
        'synsormed.services.logging.time',
        'encounter',
        function($scope, $location, EncounterService, $route, TimeLogger, encounter) {
            $scope.encounter = encounter;
            $scope.patientId = encounter.patientCode;
            $scope.save = function () {
                EncounterService.updateEncounter(encounter).then(function () {
                    TimeLogger.log('Note saved');
                    $location.path('/provider/list');
                });
            };
        }
    ]);
