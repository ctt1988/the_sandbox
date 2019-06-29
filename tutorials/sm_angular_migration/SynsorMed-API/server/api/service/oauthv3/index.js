'use strict';

var url = require('url');
var models = require('models');
var logger = require('logger');
var Errors = require('errors');
var router = require('express').Router();
var servicelist = require('../../../components/servicemap/servicelist');

router.get('/auth/:serviceId', function(req, res){
    var serviceId = req.params.serviceId;
    var urlParsed = url.parse(req.url, true);
    var oauthRow = null;
    if(!servicelist.isServiceAvailable(serviceId)){ //if service is not hosted then return 404
        return res.status(404).send('Service ' + serviceId + ' not present.');
    }
    logger.trace('User want to link monitor '+urlParsed.query.monitorId+ ' with service '+serviceId);
    models.OauthMonitorToken
    .findOne({
        where: {
            monitor_id: urlParsed.query.monitorId,
            service_name: serviceId
        }
    })
    .then(function(result){
        if(!result){
            return models.OauthMonitorToken.create({
                monitor_id: urlParsed.query.monitorId,
                service_name: serviceId,
                oauth_data: JSON.stringify({monitor_id: urlParsed.query.monitorId})
            });
        }
        else{
            return result.updateAttributes({
                oauth_data: JSON.stringify({monitor_id: urlParsed.query.monitorId})
            });
        }
    })
    .then(function(result){
        oauthRow = result;
        return models.MeasurementMonitor.findById(urlParsed.query.measurementMapId);
    })
    .then(function(measure){
        if(!measure) {
            throw new Errors.BadRequestError('No measurement monitor link found for ' + urlParsed.query.measurementMapId);
        }
        measure.oauth_id = oauthRow.id;
        return measure.save();
    })
    .then(function(measure){
        logger.trace('Updated oauth_id field in measurementMap with id ' + measure.id);
        logger.trace('Monitor '+urlParsed.query.monitorId+' linked with service '+serviceId);
        res.writeHeader(200, {'Content-Type': 'text/html'}); //send window close event
        res.write('<script>window.close();</script>');//send back message success
        return res.end();
    })
    .catch(function(err){
        logger.error(err);
        res.send(500).send(err.message);
    });
});

module.exports = router;
