'use strict';

var logger = require('logger');
var models = require('models');
var Errors = require('errors');
var router = require('express').Router();
var push = require('../../../components/quick-blox/push-notifications');

var SecurityCheck = function(req, res, next) {
    if(req.session.userId) {
        next();
    } else {
        throw new Errors.SecurityError('Access to monitor denied - not authenticated ');
    }
};

router.use(SecurityCheck);

router.post('/monitor', function(req, res){
    var monitorId = req.body.monitorId;
    var message = req.body.message;
    if(!monitorId || !message){
        throw new Errors.ValidationError('MonitorId and message is required to send push notification');
    }
    models.Monitor.findById(monitorId)
    .then(function(monitor){
        if (!monitor) {
            throw new Errors.HTTPNotFoundError('No monitor found for monitor id ' + monitorId);
        }
        return push.sendPushNotificationByUser(monitor.patient_code, message);
    })
    .then(function(){
        return res.status(200).send(true);
    })
    .catch(function(err){
        logger.error(err);
        var statusCode = err.code ? err.code : 500;
        return res.status(statusCode).send(err);
    });
});

router.post('/encounter', function(req, res){
    var encounterId = req.body.encounterId;
    var message = req.body.message;
    if(!encounterId || !message){
        throw new Errors.ValidationError('MonitorId and message is required to send push notification');
    }
    models.Encounter.findById(encounterId)
    .then(function(encounter){
        if (!encounter) {
            throw new Errors.HTTPNotFoundError('No monitor found for monitor id ' + encounterId);
        }
        return push.sendPushNotificationByUser(encounter.patient_code, message);
    })
    .then(function(){
        return res.status(200).send(true);
    })
    .catch(function(err){
        logger.error(err);
        var statusCode = err.code ? err.code : 500;
        return res.status(statusCode).send(err);
    });
});

module.exports = router;
