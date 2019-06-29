'use strict';

var Q = require('q');
var models = require('models');
var logger = require('logger');
var helper = require('./helpers');

var checkEnrollement = function(measurement){
    var enrolled = false;
    if(measurement.Monitor.User.Organization.OrganizationLeaderboard){
        var isEnrolled = measurement.isEnrolled();
        var isLeaderboardActive = measurement.Monitor.User.Organization.OrganizationLeaderboard.isLeaderboardActive;
        if(isEnrolled && isLeaderboardActive){
            enrolled = measurement.Monitor.User.Organization.OrganizationLeaderboard.updated_at;
        }

    }
    return enrolled;
};

var saveLeaderboard = function(monitorId, MMId, measurementId, points, startDate, endDate){
    var dataObj = {
        start_date: startDate,
        end_date: endDate,
        monitor_id: monitorId,
        measurement_monitor_map_id : MMId,
        measurement_id: measurementId
    };
    return models.LeaderboardActivities.findOrCreate({
        where: dataObj,
        defaults: dataObj
    })
    .spread(function(obj){
        return obj.updateAttributes({
            points: parseInt(points)
        });
    });
};

module.exports = function(measurement, readingObj){
    var defer = Q.defer();
    var enrollementDate = checkEnrollement(measurement);
    if(!enrollementDate){
        defer.resolve(true);
    }
    else{
        var startDate = models.OrganizationLeaderboard.getCurrentSessionStartDate(enrollementDate);
        var endDate = models.OrganizationLeaderboard.getCurrentSessionEndDate(startDate);
        var points = helper.getPoints(readingObj, startDate);
        saveLeaderboard(measurement.Monitor.id, measurement.id, measurement.Measurement.id, points, startDate, endDate)
        .then(function(){
            logger.info('Monitor '+measurement.Monitor.patient_code+ ' have total '+points+ ' points');
            defer.resolve(true);
        })
        .catch(defer.reject);
    }
    return defer.promise;
};
