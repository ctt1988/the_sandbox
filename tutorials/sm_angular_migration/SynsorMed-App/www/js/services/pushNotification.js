angular.module('synsormed.services.pushNotification', [
    'LocalStorageModule',
    'synsormed.services.user',
    'synsormed.services.syncData'
])
.service('synsormed.services.pushNotification.messageStorageService',[
    'localStorageService',
    function(localStorageService){
        return {
            getMessages: function(loginId){
                return (localStorageService.get(loginId) || []);
            },
            setMessege: function(loginId, messageObj){
                var oldMsgs = this.getMessages(loginId);
                oldMsgs.push(messageObj);
                return localStorageService.set(loginId, oldMsgs) ;
            },
            clearMessages: function(loginId){
                return localStorageService.set(loginId, []);
            }
        }
    }
])
.service('synsormed.services.pushNotification.pushNotificationService',[
    'synsormed.env.androidSenderId',
    'synsormed.services.syncData.c5',
    'synsormed.services.user.UserService',
    'synsormed.services.syncData.Support',
    'synsormed.services.pushNotification.messageStorageService',
    function(androidSenderId, c5, UserService, Support, messageStorageService){
        var browserServiceURL = 'http://push.api.phonegap.com/v1/push';

        return {
            pushObj: null,
            registrationId: null,
            onRegistration: function(registraionCallback){
                if(!this.pushObj || !registraionCallback) return false;
                this.pushObj.on('registration', registraionCallback); // register on registration event
            },
            onNotification: function(notificationCallback){
                if(!this.pushObj || !notificationCallback) return false;
                this.pushObj.on('notification', notificationCallback);
            },
            onError: function(errorCallback){
                if(!this.pushObj || !errorCallback) return false;
                this.pushObj.on('error', errorCallback);
            },
            init : function(){
                var that = this;
                if(!window.PushNotification) return console.log('PushNotification plugin not found');
                this.pushObj = PushNotification.init({
                    android: {
                        senderID: androidSenderId
                    },
                    browser: {
                        pushServiceURL: browserServiceURL
                    },
                    ios: {
                        alert: "true",
                        badge: "true",
                        sound: "true"
                    }
                });

                this.onRegistration(function(data){
                    that.registrationId = data.registrationId;
                    console.log('*********Registration data is here******************');
                    console.log(JSON.stringify(data));
                });

                this.onNotification(function(data){
                    console.log('*********notification data is here******************');
                    var user = UserService.getUser();
                    if(data && data.message){
                        if(user && user.code){
                            var message = {text: data.message, date: new Date()};
                            messageStorageService.setMessege(user.code, message);

                             c5.startSync(user)
                            .then(function(response){
                                console.log('Usercode: Push notification data sycning success response');
                                console.log(JSON.stringify(response));
                            })
                            .catch(function(err){
                                console.log('Push notification data syncing error');
                                console.log(JSON.stringify(err));
                            });
                        }
                        else{
                            console.log('Push notification creating new session');
                            Support.createNewSession()
                            .then(function(monitor){
                              return c5.startSync(monitor);
                            })
                            .then(function(response){
                                console.log('Push notification data sycning success response');
                                console.log(JSON.stringify(response));
                            })
                            .catch(function(err){
                                console.log('Push notification data syncing error');
                                console.log(JSON.stringify(err));
                            });
                        }
                    }
                });

                this.onError(function(data){
                    console.log('*********error data is here******************');
                    console.log(JSON.stringify(data));
                });

                return this.pushObj;
            },
            getRegistrationId: function(){
                return this.registrationId;
            }
        };
    }
]);
