'use strict';

var Q = require('q');
var _ = require('lodash');
var bin = require('./bin');
var moment = require('moment');
var models = require('models');
var logger = require('logger');

var getWinners = function(activities){
    var winners = {};
    _.forEach(activities, function(activity){
        if(winners[activity.measurement_id]){
            var prevPoints = parseInt(winners[activity.measurement_id].points);
            var currentPoints = parseInt(activity.points);
            if(currentPoints > prevPoints){
                winners[activity.measurement_id] = activity;
            }
        }
        else{
            winners[activity.measurement_id] = activity;
        }
    });
    return winners;
};

var findOrgActivities = function(board){
    return models.LeaderboardActivities.findAll({
        where: {
            start_date: board.startDate,
            end_date: board.endDate
        },
        include: [{
            required: true,
            model: models.MeasurementMonitor,
            include:[{
                required: true,
                model: models.Monitor,
                include: [{
                    required: true,
                    model: models.User,
                    where:{
                        org_id: board.orgId
                    }
                }]
            }, models.Measurement],
            where: {
                is_enrolled: true
            }
        }]
    });
};

var notifyWinners = function(winners, startDate, endDate){
    var promises = [];
    _.forEach(winners, function(winner){
        var promise = bin.getReceiverEmails(winner.MeasurementMonitor.Monitor.User, winner.MeasurementMonitor.Monitor.reporting_emails, true)
        .then(function(emails){
            emails.forEach(function(email){
                bin.sendLeaderboardWinnerNotification(
                    email, winner.MeasurementMonitor.Monitor.patient_code,
                    winner.MeasurementMonitor.Monitor.description,
                    winner.MeasurementMonitor.Measurement.name,
                    startDate, endDate, winner.points
                );
            });
            return true;
        });
        promises.push(promise);
    });
    return Q.allSettled(promises);
};

var checkBoards = function(boards){
    var promises = [];
    _.forEach(boards, function(board){
        var promise = findOrgActivities(board)
        .then(function(activities){
            var winners = getWinners(activities);
            return notifyWinners(winners, board.startDate, board.endDate);
        })
        .then(function(){
            return true;
        });
       promises.push(promise);
    });
    return Q.allSettled(promises);
};

module.exports.sendNotificationToWinners = function(){
    return models.OrganizationLeaderboard.findAll({
        where: {
            isLeaderboardActive: true
        }
    })
    .then(function(leaderboards){
        var currentBoards = [];
        _.forEach(leaderboards, function(leaderboard){
             var initialDate = leaderboard.updated_at;
             var startDate = models.OrganizationLeaderboard.getCurrentSessionStartDate(initialDate);
             var endDate = models.OrganizationLeaderboard.getCurrentSessionEndDate(startDate);
             var today = moment().endOf('day');
             if(!today.isSame(moment(endDate).endOf('day'))) return false;
             currentBoards.push({
                 orgId: leaderboard.org_id,
                 startDate: startDate,
                 endDate: endDate
             });
        });
        logger.info('Processing ' + currentBoards.length + ' leaderboard organizations');
        return checkBoards(currentBoards);
    })
    .catch(function(err){
       console.log(err);
    });
};
