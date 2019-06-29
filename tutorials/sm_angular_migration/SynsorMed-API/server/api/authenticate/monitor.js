'use strict';
var config = require('config');
var logger = require('logger');
var models = require('models');
var moment = require('moment');
var router = require('express').Router();
var saveDeviceInfo = require('./savedeviceinfo');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var MonitorMarshaller = require('../../dto/monitor');
var quickblox = require('../../components/quick-blox');

/**
* Route which can handle monitor codes
*/

router.post('/', function(req, res, next){

    var monitorData = null;
    var code = req.body && req.body.code ? req.body.code.toUpperCase() : null;
    var monitorProvider = null;
    var orgId;

    models.Monitor.find({
        where: {
            patient_code: {
                $like: code
            }
        },
        include: [models.Encounter]
    })
    .then(function(monitor){
        monitorData = monitor;
        if(!monitor){
            logger.debug('Code ' + code + ' doesn\'t belong to monitor, checking for encounter');
            return next();
        }

        if(monitor.Encounter){ //if there is encounter
            var scheduleDate = moment(monitor.Encounter.scheduled_start);
            if(scheduleDate.isSame(new Date(), 'day')){ //today is appointment so login the encounter
                logger.debug('Code ' + code + ' is a monitor with an appointment today. Login as encounter');
                return next();
            }
        }
        return monitorData.getUser()
        .then(function(result){
            monitorProvider = result;
            var tag = models.Monitor.getOrganizationTag(monitorProvider.org_id);
            return quickblox.createUser(code, tag);
        })
        .then(function(qbUser){
            csrf.attachToSession(req.session, function (token) {
                req.session.monitorCode = code;
                req.session.save(function () {
                    MonitorMarshaller.marshal(monitorData).then(function (monitorJson) {
                        logger.info('Logging in Monitor ' + code);
                        res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                        monitorJson.csrfToken = token;
                        if(config.get('org')){
                            orgId = config.get('org.id');
                        }
                        if(orgId && monitorJson && monitorJson.orgId && orgId.indexOf(monitorJson.orgId) != -1){
                          monitorJson.theme = 'synsormedWhite';
                        }
                        res.json(monitorJson);
                    });
                });
            });

            if(req.body.device && req.body.device.registrationId != null){
                return saveDeviceInfo('monitor', monitorData.id, req.body.device)
                .then(function(){
                    var active_org_ids = config.get('push_notifications.active_org_ids') || [];
                    //if(active_org_ids.indexOf(monitorProvider.org_id) != -1){ // if acitve org monitor
                        //no longer care about active org ids. All members get push notifications 030319 Amin
                    if(qbUser.id){ //This means that if the ID exists that the QB function worked correctly
                       return require('./subscribeForPushNotification')(code, req.body.device, qbUser);
                    }
                    else{
                       console.log('There was an issue with quickblox and we could not subscribe this user for notifications:' + code);
                    }
                });
            }
        });
    })
    .catch(function(err){
        console.log(err);
        logger.trace(err);
        return res.status(401).end(err.message);
    });
});

module.exports = router;
