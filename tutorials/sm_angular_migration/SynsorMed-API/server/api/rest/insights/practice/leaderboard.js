'use strict';

var _ = require('lodash');
var models = require('models');
var router = require('express').Router({mergeParams: true});

router.get('/', function(req, res){
    var org_id = req.params.practiceId;
    models.OrganizationLeaderboard.findOne({
        where: {
            isLeaderboardActive: true,
            org_id: org_id
        }
    })
    .then(function(orgLeaderboard){
        if(!orgLeaderboard) return;
        var leaderboardStartDate = orgLeaderboard.updated_at;
        var currentSessionStartDate = models.OrganizationLeaderboard.getCurrentSessionStartDate(leaderboardStartDate);
        var currentSessionEndDate = models.OrganizationLeaderboard.getCurrentSessionEndDate(currentSessionStartDate);

        var monitorModel =  {
            required: true,
            model: models.Monitor,
            include: [{
                required: true,
                model: models.User,
                include: [{
                    required: true,
                    model: models.Organization,
                    where:{
                        id: org_id
                    },
                    include: [{
                        required: true,
                        model: models.OrganizationLeaderboard,
                        where: {
                            isLeaderboardActive: true
                        }
                    }]
                }]
            },
            models.Patient]
        };

        var LeaderboardActivities = {
            required: false,
            model: models.LeaderboardActivities,
            where: {
                start_date: currentSessionStartDate,
                end_date: currentSessionEndDate
            }
        };
        return models.MeasurementMonitor.findAll({
            where: {
                is_enrolled: true
            },
            include: [monitorModel, LeaderboardActivities, models.Measurement]
        });
    })
    .then(function(measurements){
        var result = {};
        _.forEach(measurements, function(measurement){
            if(!measurement || !measurement.Measurement) return false;
            var key = measurement.Measurement.name;
            var points = measurement.LeaderboardActivity ? measurement.LeaderboardActivity.points : 0;
            result[key] = result[key] || [];
            result[key].push({
                patientCode: measurement.Monitor.patient_code,
                patient: measurement.Monitor.Patient ? measurement.Monitor.Patient.getName() : null,
                points: points,
                measurement: key
            });
        });
        return res.json(result);
    })
    .catch(function(err){
         console.log(err);
         return res.status(500).send(false);
    });
});

module.exports = router;
