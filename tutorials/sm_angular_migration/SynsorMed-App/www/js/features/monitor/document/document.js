angular.module('synsormed.controllers.monitor.document',[
    'synsormed.services.user',
    'synsormed.services.monitor'
])
.controller('MonitorDocumentController',[
    '$scope',
    'synsormed.services.user.UserService',
    'synsormed.services.monitor.MonitorDocumentService',
    function($scope, UserService, MonitorDocumentService){
        var monitor = UserService.getUser();

        $scope.getDocumentList = function(){
            $scope.$emit("wait:start");
            MonitorDocumentService
            .getDocuments(monitor.id)
            .then(function(documents){
                $scope.documents = documents;
                $scope.$emit("wait:stop");
            })
            .catch(function(err){
                console.log(err);
                $scope.$emit("wait:stop");
                $scope.$emit('notification:error', 'Server Error');
            });
        };
        $scope.getDocumentList();

        $scope.getDocumentName = function(fileName){
            var file = fileName.split('.');
            return file[file.length-2] + '.' + file[file.length-1];
        };

        $scope.getFile = function(diseasesId, file){
            if(!diseasesId || !file) return false;

            $scope.$emit("wait:start");
            MonitorDocumentService
            .getToken(monitor.id, file, diseasesId)
            .then(function(token){
                return MonitorDocumentService.getFile(token, file)
            })
            .then(function(response){
                return MonitorDocumentService.markRead(monitor.id, diseasesId, file);
            })
            .then(function(){
                moveFileIntoRead(diseasesId, file);
                $scope.$emit("wait:stop");
            })
            .catch(function(err){
                console.log(err);
                $scope.$emit("wait:stop");
                if(error == 53) {
                    $scope.$emit('notification:error', 'No app that handles this file type.');
                }
                else{
                    $scope.$emit('notification:error', 'Error in downloading file');
                }
            });
        };

        var moveFileIntoRead = function(diseasesId, file){
            $scope.documents.forEach(function(document, index){
                if(document.diseases_id == diseasesId){
                    var fileIndex = document.files.indexOf(file);
                    if(fileIndex != -1){
                        $scope.documents[index].files.splice(fileIndex, 1);
                        $scope.documents[index].read_files.push(file);
                    }
                }
            });
        };

    }]);
