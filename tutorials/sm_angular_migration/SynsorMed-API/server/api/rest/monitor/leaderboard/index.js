'use strict';

var _ = require('lodash');
var moment = require('moment');
var models = require('models');
var router = require('express').Router();

router.get('/', function(req, res){
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
                    id: req.monitorModel.User.org_id
                },
                include: [{
                    required: true,
                    model: models.OrganizationLeaderboard,
                    where: {
                        isLeaderboardActive: true
                    }
                }]
            }]
        }]
    };

    var LeaderboardActivities = {
        required: false,
        model: models.LeaderboardActivities,
        where: {
            end_date:{
                $gte: moment().format()
            }
        }
    };

    models.MeasurementMonitor.findAll({
        where: {
            is_enrolled: true,
            monitor_id: req.monitorModel.id
        }
    })
    .then(function(measurements){
        var measurementIds = _.map(measurements, function(measurement){
            return measurement.measurement_id;
        });
        return models.MeasurementMonitor.findAll({
            where: {
                measurement_id: {
                    $in: measurementIds
                },
                is_enrolled: true
            },
            include: [monitorModel, LeaderboardActivities]
        });
    })
    .then(function(measurements){
        var response = [];
        _.forEach(measurements, function(measurement){
            var points = measurement.LeaderboardActivity ? measurement.LeaderboardActivity.points : 0;
            response.push({
                points: points,
                patientCode: measurement.Monitor.patient_code
            });
        });
        return res.json(response);
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send(err);
    });
});

module.exports = router;
