'use strict';

var Q = require('q');
var _ = require('lodash');
var models = require('models');
var logger = require('logger');
var router = require('express').Router({mergeParams: true});
var MeasurementMonitorDTO = require('../../../../dto/mesurementMonitor');

router.put('/', function(req, res){
    if(!req.body) res.status(500).send('No measurements to modify');
    var arr = [];
    req.body.forEach(function(measurementJson){
        arr.push(updater(measurementJson, req.monitorModel));
    });

    Q.all(arr)
    .then(function(){
        res.send(true);
    })
    .catch(function(e){
        console.error(e);
        res.status(500).json(null);
    });
});

//function to marshal and update/create measurement
var updater = function(measurementJson, monitor){
    var monitorMeasurement = MeasurementMonitorDTO.unmarshal(measurementJson);
    var prevSurvey = monitorMeasurement.status_survey_id || false;

    return models.MeasurementMonitor
    .findOne({
        where: {
            id: monitorMeasurement.id,
            monitor_id: monitor.id
        }
    })
    .then(function(mapInstance){
        //monitorMeasurement - marshalled data from portal
        if(mapInstance){
            var newSurvey = mapInstance.status_survey_id || false;
            var resetMeasurement = monitorMeasurement.measurement_id
            ? mapInstance.measurement_id !== monitorMeasurement.measurement_id
            : false;

            if(resetMeasurement){ //if the measurement type is updated, dont reset when undefined
                monitorMeasurement.latest_reading = null;
            }
            logger.trace('Updating measurement with id '+monitorMeasurement.id);
            if(prevSurvey && newSurvey && (prevSurvey != newSurvey) && mapInstance.oauth_id){
                models.OauthMonitorToken.findOne({where:{
                    id: mapInstance.oauth_id
                }})
                .then(function(oauthData){
                     oauthData.updateAttributes({oauth_data: null});
                     logger.info('Cleared survey data for measurementId '+mapInstance.id);
                })
                .catch(function(err){
                    console.log(err);
                });
            }
            return mapInstance.update(monitorMeasurement);
        }
        else {
            logger.debug('Adding measurement');
            monitorMeasurement.monitor_id = monitor.id;

            return monitor
            .addMeasurements([monitorMeasurement.measurement_id], monitorMeasurement)
            .then(function(measurementMap){
                logger.trace('Added measurements into monitor '+ monitor.id+' with measurementId '+monitorMeasurement.measurement_id);
                // TODO: Bug in Sequelize https://github.com/sequelize/sequelize/issues/3455
                if(_.isNumber(measurementMap[0][0])){
                    logger.debug('Manually adding MeasurementMonitor record on update');
                    return models.MeasurementMonitor
                    .create(monitorMeasurement);
                }
            });
        }
    });
};

module.exports = router;
