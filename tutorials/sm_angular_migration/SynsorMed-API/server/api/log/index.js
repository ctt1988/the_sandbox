'use strict';

var logger = require('logger');
var config = require('config');
var models = require('models');
var router = require('express').Router();

router.post('/web', function(req, res){
    if( !req.session.userId || (config.seeds.roles.Provider != req.current_user.role_id)  ){
        return res.status(500).send('Session is expired');
    }
    else{
        return logProviderInCallScreen(req)
        .then(function(){
              return res.status(204).end();
        })
        .catch(function(e){
             res.status(500).send(e.message ? e.message : e);
        });
    }
});

router.post('/web/encounter', function(req, res){
    if(req.session.encounterCode){
        return logPatientInCallScreen(req)
        .then(function(){
            return res.status(204).end();
        })
        .catch(function(e){
            return res.status(500).send(e.message ? e.message : e);
        });
    }
    else{
        return res.status(500).send('Session is expired');
    }
});

router.post('/', function (req, res) {
    if(!req.body.code)  res.status(204).end();
    var prom;
    switch(req.body.tag) {
        case 'InCallScreen':
        if(req.session.encounterCode) {
            prom = logPatientInCallScreen(req, res);
        }
        else if (req.session.userId) {
            prom = logProviderInCallScreen(req, res);
        }

        if(prom){
            prom.then(function () {
                if(req.session.rtccode){
                    return models.RTCUser.find({
                        where: {
                            name: req.session.rtccode
                        }
                    })
                    .then(function (rtcUser){
                        if(rtcUser){
                            return rtcUser.update({
                                last_activity: new Date()
                            });
                        }
                        else{
                            logger.warn('Rtc user in session not found in table : logs');
                            return false;
                        }
                    });
                }
                else{
                    logger.warn('Logging a null RTC code : logs');
                }
            })
            .then(function () {
                res.status(204).end();
            })
            .catch(function(e){
                logger.error(e);
                res.status(500).send(e.message ? e.message : e);
            });
        }
        else {
            logger.warn('Session less InCallScreen logging : logs');
            res.status(204).end();
        }
        break;
        default:
        res.status(204).end();
    }
});

function logPatientInCallScreen(req) {
    return models.Encounter.find({
        where: {
            patient_code: {
                like: req.body.code
            }
        }
    })
    .then(function (encounter) {
        if(!encounter) return false; //encounter is null sometime if like don't match
        return encounter.update({ last_activity: new Date() });
    })
    .catch(function(err){
        console.log(err);
    });
}

function logProviderInCallScreen(req) {
    return req.current_user.update({ last_activity: new Date() });
}

module.exports = router;
