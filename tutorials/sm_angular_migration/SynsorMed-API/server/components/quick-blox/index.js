'use strict';

var Q = require('q');
var QB = require('quickblox');
var config = require('config');
var environment = process.env.NODE_ENV;
var getUserCredentials = require('./user-credentials');

var initialize = function(){
    var defer = Q.defer();

    if(config.get('qb')){
        var appId = config.get('qb.appId');
        var authKey = config.get('qb.authKey');
        var authSecret = config.get('qb.authSecret');
    }
    var qbConfig = {
        mode: 1 // Display logs on console
    };

    QB.init(appId, authKey, authSecret, qbConfig );

    QB.createSession(function(err, result){
        if(err) {
            return defer.reject(err);
        }
        else {
            return defer.resolve(result);
        }
    });
    return defer.promise;
};

module.exports.initialize = initialize;

module.exports.login = function(login, password){
    var defer = Q.defer();
     QB.login({login: login, password: password}, function(err, result){
         if(err) return defer.reject(err);
         else return defer.resolve(result);
     });
     return defer.promise;
};

module.exports.createPushEvent = function(user, message, date){
    var defer = Q.defer();
    var params = {
        notification_type: 'push',
        user: user, // recipients.
        environment: (environment == 'production' ? 'production' : 'development'),
        message: QB.pushnotifications.base64Encode(message)
    };
    if(date){
      params.event_type = 'fixed_date';
      params.date = date;
    }

    setTimeout(function(){//Using delay to only do push notifications 10/sec. 
        QB.pushnotifications.events.create(params, function(err, response){
            if(err){
                console.log("*** The push event had an error: " + JSON.stringify(err));
                console.log("*** the params were: " + JSON.stringify(params));
              return defer.reject(err);
            }
            else{
                console.log("*** The push event was succesfull: " + JSON.stringify(response));
              return defer.resolve(response);
            }
        });
    },100);

    return defer.promise;
};

module.exports.subscribe = function(deviceInfo){
    var defer = Q.defer();

    var params = {
        notification_channels: deviceInfo.platform.toLowerCase() == 'android' ? 'gcm' : 'apns',
        device: {
            platform: deviceInfo.platform.toLowerCase(),
            udid: deviceInfo.device_id
        },
        push_token: {
            environment: (environment == 'production' ? 'production' : 'development'),
            client_identification_sequence: deviceInfo.registrationId
        }
    };

    QB.pushnotifications.subscriptions.create(params, function(err, response){
        if(err) return defer.reject(err);
        else return defer.resolve(response);
    });

    return defer.promise;
};

module.exports.getSessionToken = function(){
    var defer = Q.defer();
    QB.getSession(function(err, session){
        var token = session.token ? session.token : session.session.token;
        if(err) {
            initialize().then(function(newSession){
                var newToken = newSession.token ? newSession.token : newSession.session.token;
                return defer.resolve(newToken);
            })
            .catch(defer.reject);
        }
        else return defer.resolve(token);
    });
    return defer.promise;
};

var isAlreadyExists = function(params){
    var defer = Q.defer();
    QB.users.get(params, function(err, user){
        if(err){
            if(err.code == 404) return defer.resolve(false);
            else return defer.reject(err);
        }
        else return defer.resolve(user);
    });
    return defer.promise;
};

var createQBUser = function(params){
    var defer = Q.defer();
    QB.users.create(params, function(err, user){
        if(user) defer.resolve(user);
        else defer.reject(err);
    });
    return defer.promise;
};

module.exports.getUser = function(username){
    var defer = Q.defer();
    var userCredentials = null;
    initialize()
    .then(function(){
        return getUserCredentials(username);
    })
    .then(function(credentials){
        userCredentials = credentials;
        return isAlreadyExists({'login': credentials.username});
    })
    .then(function(existedUser){
        if(existedUser){
            existedUser.password = userCredentials.password;
            return defer.resolve(existedUser);
        }
        else {
            return defer.reject({code: 404, message: 'User not found'});
        }
    })
    .catch(defer.reject);
    return defer.promise;
};

module.exports.createUser = function(username, tagsArray){
    var defer = Q.defer();
    var params = null;
    var cred = null;
    initialize()
    .then(function(){
        return getUserCredentials(username);
    })
    .then(function(credentials){
        cred = credentials;
        params = { 'login': credentials.username, 'password': credentials.password};
        if(tagsArray) params['tag_list'] = tagsArray;
        return isAlreadyExists({'login': credentials.username});
    })
    .then(function(existedUser){
        if(existedUser) {
            existedUser.password = cred.password;
            return defer.resolve(existedUser);
        }
        else {
            createQBUser(params)
            .then(function(user){
                user.password = cred.password;
                return defer.resolve(user);
            })
            .catch(defer.reject);
        }
    })
    .catch(function(err){
        console.log("*** There was an issue doing createUser in quickblox: " + JSON.stringify(err));
        console.log("*** We are logging this but allowing to proceed");
        //defer.reject(err);
        defer.resolve(err);
    });
    return defer.promise;
};

module.exports.getUserIDs = function(usernames){

    var defer = Q.defer();
    var idArray = [];

    if(!usernames){
        console.log("*** the usernames were blank");
        defer.resolve(false);
    } 

    //assuming session is already active
    //default is 10 results per page. max is 100 users per query to listUsers
    //in the future, will need to put loop to change page for over 100 users
    console.log("*** the usernames were not blank, so going to get listUsers");
    var params = {page: '1', per_page: '100', filter: {field: 'login' , param: 'in' , value: usernames}};
    QB.users.listUsers(params,function(err, result){
        if(result){
            console.log("*** I was able to get all of the users: " + JSON.stringify(result));
            result.items.forEach(function(item){
                idArray.push(item.user.id)
            });
            console.log("*** After converting to IDs: " + idArray);
            defer.resolve(idArray);
        } else {
            console.log("*** There was an error getting listUsers: " + JSON.stringify(err));
            defer.reject(err);
        }
    });

    return defer.promise;

};

module.exports.getUserCredentials = getUserCredentials;
