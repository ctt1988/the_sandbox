angular.module('synsormed.services.pageState', ['LocalStorageModule'])
    .service('synsormed.services.WorkListStateService', ['localStorageService', function (localStorageService) {
        return{
            setWorkListState: function(value){
                return localStorageService.set('worklistData', value);
            },
            getWorkListState:function(){
                return localStorageService.get('worklistData');
            },
            removeWorkListState:function(){
                return localStorageService.remove('worklistData');
            },
            clearState:function(){
                return this.removeWorkListState();
            }
        };
    }])
    .service('synsormed.services.MonitorStateService', ['localStorageService', function (localStorageService) {
        return{
            setMonitorState:function(value){
                return localStorageService.set('monitorlistData', value);
            },
            getMonitorState:function(){
                 return localStorageService.get('monitorlistData');
            },
            removeMonitorState:function(){
                return localStorageService.remove('monitorlistData');
            },
            clearState:function(){
                this.removeMonitorState();
            }
        };
    }])
    .service('synsormed.services.PatientStateService', ['localStorageService', function (localStorageService) {
        return{
            setPatientState:function(value){
                return localStorageService.set('patientListData', value);
            },
            getPatientState:function(){
                 return localStorageService.get('patientListData');
            },
            removePatientState:function(){
                return localStorageService.remove('patientListData');
            },
            clearState:function(){
                this.removePatientState();
            }
        };
    }]);
