'use strict';

var _ = require('lodash');
var moment = require('moment');
var request = require('request');
var helpers = require('./helpers');
var weightData = require('./weight');


module.exports = function(apiURL, userid, access_token, measurementName){
    var tasks = [];
    var today = moment().format('YYYY-MM-DD').toString();
    var ago31Day = moment().subtract(31, 'days').format('YYYY-MM-DD').toString();
    var profileUrl = apiURL + '1/user/' + userid + '/profile.json';
    var stepsUrl = apiURL + '1/user/' + userid + '/activities/steps/date/' + today + '/30d.json';
    var sleepUrl = apiURL + '1/user/' + userid + '/sleep/timeInBed/date/' + today + '/' + ago31Day + '.json';
    var lastSyncUrl = apiURL + '1/user/'+ userid +'/devices.json';
    var foodLogUrl = apiURL + '1/user/' +userid+ '/foods/log/caloriesIn/date/'+ today + '/' + ago31Day +'.json';
    var dataKeys = {
        user: { url: profileUrl },
        steps: { url: stepsUrl, key: 'activities-steps' },
        sleep: { url: sleepUrl, key: 'sleep-timeInBed' },
        weight: { key: 'weight' },
        lastSync:{ url: lastSyncUrl },
        'caloric intake':{ url: foodLogUrl, key: 'foods-log-caloriesIn' }
    };

    measurementName = measurementName ? measurementName.toLowerCase() : false;

    _.forEach(dataKeys, function(chunk, dataKey){
        if(!measurementName){
            if(dataKey == 'weight'){
                tasks.push(function(cb){
                    weightData(apiURL, userid, access_token)
                    .then(function(data){
                        cb(null, data);
                    })
                    .catch(function(err){
                        cb(null, err);
                    });
                });
            }
            else{
                tasks.push(function(cb){
                    request.get({ url: chunk.url, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                        helpers.asyncReqParser(body, cb);
                    });
                });
            }
        }
        else{
            if(dataKey == 'user' || dataKey == 'lastSync'){
                tasks.push(function(cb){
                    request.get({ url: chunk.url, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                        helpers.asyncReqParser(body, cb);
                    });
                });
            }
            else{
                if(dataKey == measurementName){
                    if(dataKey == 'weight'){
                        tasks.push(function(cb){
                            weightData(apiURL, userid, access_token)
                            .then(function(data){
                                cb(null, data);
                            })
                            .catch(function(err){
                                cb(null, err);
                            });
                        });
                    }
                    else{
                        tasks.push(function(cb){
                            request.get({ url: chunk.url, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                                helpers.asyncReqParser(body, cb);
                            });
                        });
                    }
                }
                else{
                    tasks.push(function(cb){
                        var data = {};
                        data[chunk.key] = [];
                        cb(null, data);
                    });
                }
            }
        }
    });
    return tasks;
};
