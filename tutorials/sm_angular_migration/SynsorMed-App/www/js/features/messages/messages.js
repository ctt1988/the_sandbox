angular.module('synsormed.controllers.messages', [
    'synsormed.services.user',
    'synsormed.services.pushNotification'
])
.controller('MessagesController',[
    '$scope',
    'synsormed.services.user.UserService',
    'synsormed.services.pushNotification.messageStorageService',
    function($scope, UserService, messageStorageService){
        var user = UserService.getUser();
        $scope.messages = messageStorageService.getMessages(user.code);
    }
]);
