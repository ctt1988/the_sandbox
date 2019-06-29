'use strict';

angular.module('synsormed.services.touchId',[])
.service('synsormed.services.touchId.TouchIdStorage', [
    'localStorageService',
    function(localStorageService){
        return {
             setAssociation: function(key, ans){
                 var all = this.getAssociation();
                 all[key] = ans;
                 return localStorageService.set('synsormed-touch-id-association', all);
             },
             getAssociation: function(){
                 return localStorageService.get('synsormed-touch-id-association') || {};
             },
             getAssociationForKey: function(key){
                 var all =  this.getAssociation();
                 return all[key];
             },
             setCancelCount : function(count){
                 return localStorageService.set('synsormed-touch-id-cancel-count', count);
             },
             getCancelCount: function(){
                 return localStorageService.get('synsormed-touch-id-cancel-count');
             },
             removeCancelCount: function(){
                 var count = this.getCancelCount();
                 if(count) return localStorageService.remove('synsormed-touch-id-cancel-count');
                 return true;
             }

        };
    }
])
.service('synsormed.services.touchId.TouchIdService',[
    '$q',
    function($q){
        return {
            checkTochIdPlugin: function(){
                var plateform = window.device.platform ? window.device.platform.toLowerCase() : false;
                if(plateform == 'ios' && window.plugins && window.plugins.touchid){
                    return true;
                }
                else{
                    console.error("TochId Plugin not found. Please install https://github.com/EddyVerbruggen/cordova-plugin-touch-id");
                    return false;
                }
            },
            checkAvailable: function(){
                var defer = $q.defer();
                window.plugins.touchid.isAvailable(
                    function() {
                        defer.resolve(true); // success handler: TouchID available
                    },
                    function(msg) {
                        defer.reject(msg); // error handler: no TouchID available
                    }
                );
                return defer.promise;
            },
            checkKey: function(Key){
                var defer = $q.defer();
                window.plugins.touchid.has(Key, function() {
                    defer.resolve(true);
                }, function() {
                    defer.resolve(false);
                });
                return defer.promise;
            },
            checkPatientKey: function(){
                return this.checkKey('patient');
            },
            checkProviderKey: function(){
                return this.checkKey('synsormed-touchid-provider');
            },
            verifyUser: function(key, msg){
                var defer = $q.defer();
                window.plugins.touchid.verify(key, msg, function(password){
                     defer.resolve(password);
                }, function(err){
                    defer.reject(err);
                });
                return defer.promise;
            },
            verifyPatient: function(msg){
               return this.verifyUser('patient', msg);
            },
            verifyProvider: function(msg){
                return this.verifyUser('synsormed-touchid-provider', msg);
            },
            saveKey: function(key, password){
                var defer = $q.defer();
                window.plugins.touchid.save(key, password, function(){
                    defer.resolve(true);
                },
                function(err){
                    defer.reject(err);
                });
                return defer.promise;
            },
            savePatient: function(pwd){
                return this.saveKey('patient', pwd);
            },
            saveProvider: function(pwd){
                return this.saveKey('synsormed-touchid-provider', pwd);
            },
            deleteKey: function(key){
                var defer = $q.defer();
                window.plugins.touchid.delete(key, function() {
                     defer.resolve(true);
                },
                function(err){
                    defer.reject(err);
                });
                return defer.promise;
            }
        };
    }
]);
