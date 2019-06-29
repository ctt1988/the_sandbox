'use strict';
var router = require('express').Router();
var cors = require('cors');
var url = require('url');
var oauthTokenModel = require('models').OauthMonitorToken;
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var servicelist = require('../../../components/servicemap/servicelist');
var auth = require('./auth');
var jwt = require('../drivers/base/jwt');
var Errors = require('errors');
var assert = require('assert');
var logger = require('logger');

router.get('/auth/:serviceId', function(req, res){

    var serviceId = req.params.serviceId;
    var urlParsed = url.parse(req.url, true);

    //if service is not hosted then return 404
    if(!servicelist.isServiceAvailable(serviceId)){
        return res.status(404).send('Service ' + serviceId + ' not present.');
    }

    logger.trace('User want to link monitor '+urlParsed.query.monitorId+ ' with service '+serviceId);

    var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

    //we have to register the service
    auth.beginOauth(serviceId, callbackUrl, res.redirect.bind(res), req.sessionID);

    //if request has monitorId then assign it to session
    if(urlParsed.query.monitorId){
        req.session.monitorId = urlParsed.query.monitorId;
        req.session.measurementMapId = (urlParsed.query.measurementMapId ? urlParsed.query.measurementMapId : null);

        req.session.save(function(e){
            if(e) { logger.error(e); }
        });
    }

});


//call back handler for all apis , it will return code from the Oauth services
// CORS is required here
router.get('/handle/:serviceId', cors(), function(req, res){
    var urlParsed = url.parse(req.url, true);
    var code = urlParsed.query.code;
    var serviceId = req.params.serviceId;
    var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);
    assert(callbackUrl, 'Callback URL is falsy');

    auth  // now get the access token
    .getAccessToken(serviceId, code, callbackUrl, urlParsed.query.state)
    .then(function(results){
        var response = {};

        response.success = true;
        response.data = jwt.encode(results);
        if(urlParsed.query.state){
            req.sessionStore.load(urlParsed.query.state, function(err, sessionData){
                //no session data
                if(err || !sessionData){
                    //send success response with code
                    return res.status(200).json(response);
                }
                var data = {
                    monitor_id: sessionData.monitorId,
                    service_name: serviceId
                };
            return oauthTokenModel
                .findOrCreate({
                    where: data
                })
                .spread(function(oauthRow) {
                    return oauthRow.refreshToken(results);
                }).then(function(oauthRow){
                    return MeasurementMonitorModel
                        .findById(sessionData.measurementMapId)
                        .then(function(measure){
                            if(!measure) {
                                throw new Errors.BadRequestError('No measurement monitor link found for ' + sessionData.measurementMapId);
                            }
                            measure.oauth_id = oauthRow.id;
                            return measure.save()
                            .then(function(){
                                logger.trace('Updated oauth_id field in measurementMap with id ' + measure.id);
                                logger.trace('Monitor '+data.monitor_id+' linked with service '+data.service_name);
                                //send window close event
                                res.writeHeader(200, {'Content-Type': 'text/html'});
                                //send back message success
                                res.write('<script>window.close();</script>');
                                return res.end();
                            })
                            .catch(function(err){
                                logger.error(err);
                                return res.send(err);
                            });
                        });
                })
                .catch(function(err){
                    logger.error(err);
                    res.send(500).send(err.message);
                });
            });

        } else {
            //send success response with code
            return res.status(200).json(response);
        }
    })
    .catch(function(err){
        logger.error(err);
        return res.status(401).send(err.message);
    });

});

module.exports = router;
