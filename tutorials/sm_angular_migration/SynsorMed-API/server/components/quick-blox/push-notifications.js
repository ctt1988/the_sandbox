'use strict';

var Q = require('q');
var qb = require('./index');
var logger = require('logger');
var getUserCredentials = require('./user-credentials');
var mockPush = require('config').get('push_notifications.mock');

module.exports.getOrganizationTag = function(orgId, patientType){
    if(!orgId) return false;
    return  (patientType + '-' + 'org-' + orgId);
};

module.exports.sendPushNotificationByQBId = function(quickBloxUserIds, message, date){
    var user = {ids: quickBloxUserIds};
    console.log("*** about to call createPushEvent");
    return qb.createPushEvent(user, message, date);
};

module.exports.sendPushNotificationByTags = function(tags, message, username){
    var defer = Q.defer();
    var tagList = {tags: {any: tags} };
    if(mockPush){
        logger.debug('Mock Push notification sent to : ' + JSON.stringify(tags) + ' tags at ' + new Date());
    }
    else{
         qb.initialize()
        .then(function(){
            return getUserCredentials(username);
        })
        .then(function(credentials){
            return qb.login(credentials.username, credentials.password);
        })
        .then(function(){
            return qb.createPushEvent(tagList, message)
            .then(function(response){
                logger.debug('Push notification sent to : ' + JSON.stringify(tags) + ' tags at ' + new Date());
                defer.resolve(response);
            });
        })
        .catch(defer.reject);
    }
    return defer.promise;
};

module.exports.sendPushNotificationByUser = function(username, message, date){
    var defer = Q.defer();
    qb.getUser(username.trim())
    .then(function(user){
        return qb.login(user.login, user.password);
    })
    .then(function(response){
        return module.exports.sendPushNotificationByQBId([response.id], message, date);
    })
    .then(defer.resolve)
    .catch(defer.reject);
    return defer.promise;
};

module.exports.scheduleAllMedReminders = function(reminders){
    var defer = Q.defer();
    var oneIDs, twoIDs, threeIDs;
    var idPromises = [];
    var pushPromises = [];
    qb.getUser("medReminderScheduler")
    .then(function(user){
        return qb.login(user.login, "synsormed");
    })
    .then(function(response){
        //send messages based on reminders json
        console.log("*** the response for login is: " + JSON.stringify(response));
        console.log("*** I received the reminders array: " + JSON.stringify(reminders));
        if(reminders.three) idPromises.push(qb.getUserIDs(reminders.three[0]));
        if(reminders.two) idPromises.push(qb.getUserIDs(reminders.two[0]));
        if(reminders.one) idPromises.push(qb.getUserIDs(reminders.one[0]));
        //return qb.getUserIDs(reminders.three[0]);
        return Q.allSettled(idPromises);
              
    })
    .then(function(response){
        console.log("*** the response from id conversion is: " + JSON.stringify(response));

        //Populate the ID arrays based on the order they are returned. 
        //Since the ThreeIDs were pushed first, they will always be returned in the zero place if exists
        //If the twoIDs are only sent and nothing else, they will bein the zero place, however
        //if they are with the threeIDs, they will be in the ones place. so on and so on.
        if(reminders.three) threeIDs = response[0].value;

        if(reminders.two && !reminders.three) twoIDs = response[0].value;

        if(reminders.two && reminders.three) twoIDs = response[1].value;

        if(reminders.one && !reminders.two && !reminders.three) oneIDs = response[0].value;

        if(reminders.one && reminders.two && !reminders.three) oneIDs = response[1].value;

        if(reminders.one && reminders.two && reminders.three) oneIDs = response[2].value;

        console.log("*** At this point, threeIDs is: " + threeIDs);
        console.log("*** At this point, twoIDs is: " + twoIDs);
        console.log("*** At this point, oneIDs is: " + oneIDs);

        /*
        At this point, we have all of the IDs that need to be sent to in indpendent arrays.
        Now we are going try to send to each ID according to their send times. Their sendTimes
        are stored in reminders.<number>[2].  We will go through each of the end times and make a call
        to quickblox to schedule that group of userIDs for that sendtime.
        */

        if(reminders.three){
            reminders.three[2].forEach(function(sendTime){
                console.log("** pushing for each of the three times");
                pushPromises.push(module.exports.sendPushNotificationByQBId(threeIDs, reminders.three[1], sendTime));
            });
        }

        if(reminders.two){
            reminders.two[2].forEach(function(sendTime){
                console.log("*** pushing for each of the two times");
                pushPromises.push(module.exports.sendPushNotificationByQBId(twoIDs, reminders.two[1], sendTime));
            });
        }

        if(reminders.one){
            reminders.one[2].forEach(function(sendTime){
                console.log("*** pusing for the one time");
                pushPromises.push(module.exports.sendPushNotificationByQBId(oneIDs, reminders.one[1], sendTime));
            });
        }

        console.log("**** The size of the pushPromises is: " + pushPromises.length);

        return Q.allSettled(pushPromises);
    })
    .then(defer.resolve)
    .catch(defer.reject);
    return defer.promise;

};
