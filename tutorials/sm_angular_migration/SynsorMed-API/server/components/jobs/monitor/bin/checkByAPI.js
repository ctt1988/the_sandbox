'use strict';

var bin = require('./index');
var config = require('config');
var logger = require('logger');
var push = require('../../../quick-blox/push-notifications');
var moment = require('moment');
var Q = require('q');

module.exports = function(monitorGroups){
        var fullDate;
        var date;
        //var username =  admin.email;
        //var orgTag = bin.getTags(monitor.User.org_id);
        //var patientCode =  monitor.patient_code;
        var message = 'This is a friendly notification to take your medication';
        var promises = [];
        var oneDaySendTimes = [];
        var twoDaySendTimes = [];
        var threeDaySendTimes = [];
        var allReminders = {};


        if(monitorGroups.one.length){ //If there are any 1 per day people
          fullDate = moment().hour(15).minute(0).second(0).valueOf();
          date = fullDate / 1000;
          oneDaySendTimes.push(date);

          console.log("*** the times for once day: " + oneDaySendTimes);
          allReminders.one = [monitorGroups.one,message,oneDaySendTimes];
        }
        

        if(monitorGroups.two.length){ //If there are any 2 per day people
          for(var i = 1; i<=2; i++){
            if(i == 1){
              fullDate = moment().hour(15).minute(0).second(0).valueOf();
              date = fullDate / 1000;
            }
            else if(i == 2){
              fullDate = moment().hour(23).minute(0).second(0).valueOf();
              date = fullDate / 1000;
            }
            twoDaySendTimes.push(date);
          }

          console.log("*** the times for twice day: " + twoDaySendTimes);
          allReminders.two = [monitorGroups.two,message,twoDaySendTimes];
        }

        

        if(monitorGroups.three.length){ //If there are any 3 per day people
          for(var i = 1; i<=3; i++){
              if(i == 1){
                fullDate = moment().hour(12).minute(0).second(0).valueOf(); // 8AM ET
                date = fullDate / 1000;
              }
              else if(i == 2){
                fullDate = moment().hour(16).minute(0).second(0).valueOf(); // 12PM ET
                date = fullDate / 1000;
              }
              else if(i == 3){
                fullDate = moment().hour(1).minute(0).second(0).add(1,'d').valueOf(); // 9PM ET. Had to put it for 1am the next day
                date = fullDate / 1000;
              }
              threeDaySendTimes.push(date);
            }

            console.log("*** the times for 3 day: " + threeDaySendTimes);
            allReminders.three = [monitorGroups.three,message,threeDaySendTimes];
        }


        console.log("**** the allReminders array before sending over: " + JSON.stringify(allReminders));

        var promise = push.scheduleAllMedReminders(allReminders);
        promises.push(promise);


        return Q.allSettled(promises);
};
