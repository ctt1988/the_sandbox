'use strict';

var Q = require('q');
var _ = require('lodash');
var models = require('models');
var logger = require('logger');
var helpers = require('./helpers');
var router = require('express').Router();

router.get('/', function(req, res){
    var orgMonitors;
    var orgMeasurements;
    var orgDocuments;
    models.Monitor.findAll({
        include: [
            models.Measurement,
            {
                require: true,
                model: models.User,
                where: { org_id: req.current_user.org_id }
            },
            models.Patient
        ]
    })
    .then(function(results){
        orgMonitors = results;
        orgMeasurements = helpers.getOrgMeasurements(orgMonitors);
        return models.Document.findAll({
            where: {
                org_id : req.current_user.org_id
            }
        });
    })
    .then(function(results){
        orgDocuments = results;
        var measurementIds = helpers.getIds(orgMeasurements);
        var monitorIds = helpers.getIds(orgMonitors);
        return Q.all([
            models.Event.findAll({
                where: {
                    object_id: {
                        in : monitorIds
                    },
                    object_type: 'monitor',
                    type: 'document_read'
                }
            }),
            models.Event.findAll({
                where: {
                    object_id: {
                        in : measurementIds
                    },
                    object_type: 'measurement',
                    type: 'data_recieved',
                    event_data: {
                        $notLike: '%missed%'
                    }
                }
            })
        ]);
    })
    .then(function(events){
        var monitorDocumentEvents = events[0];
        var readingEvents = events[1];

        var response = [];
        _.forEach(orgMonitors, function(monitor){
            var monitorMeasurements = helpers.getMonitorMeasurements(monitor);
            var startDate = monitor.start_date;
            var monitorInfo = helpers.getMonitorReport(monitorMeasurements, startDate,  monitorDocumentEvents, readingEvents, orgDocuments);
            monitorInfo.code = monitor.patient_code;
            monitorInfo.patientName =  monitor.Patient ? monitor.Patient.getName() : null,
            monitorInfo.providerId = monitor.provider_id;
            response.push(monitorInfo);
        });
        res.send(response);
    })
    .catch(function(err){
        logger.trace(err);
        console.log(err);
    });
});

module.exports = router;
