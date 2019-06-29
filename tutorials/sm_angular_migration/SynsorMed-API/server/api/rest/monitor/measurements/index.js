'use strict';

var Q = require('q');
var logger = require('logger');
var Errors = require('errors');
var models = require('models');
var router = require('express').Router({mergeParams: true});
var MeasurementDTO = require('../../../../dto/measurement');
var MeasurementMonitorDTO = require('../../../../dto/mesurementMonitor');

/**
* Get all the measurement map records for a monitorModel
*/
var measurementMarshaller = function(measurementMap){
    var measurementMonitor;
    return MeasurementMonitorDTO.marshal(measurementMap)
    .then(function(data){
        measurementMonitor = data;
        var measurement = MeasurementDTO.marshal(measurementMap.Measurement);
        measurementMonitor.name = measurement.name;
        measurementMonitor.unit = measurement.unit;
        measurementMonitor.display_name = measurement.display_name;
        return measurementMonitor;
    });
};

router.get('/', function(req, res){
    req.monitorModel.getMeasurementMaps()
    .then(function(measurements){
        var final = [];
        measurements.forEach(function(measurementMap){
            final.push(measurementMarshaller(measurementMap));
        });
        return Q.all(final)
        .then(function(data){
            if(data && data[0] && data[0].id){
              logger.trace('User is looking monitor ' +data[0].id);
            }
            res.json(data);
        });
    })
    .catch(function(e){
        logger.error(e);
        res.status(500);
        res.json(e.message);
    });
});

//put request for adding/updating measurements of a monitor
router.put('/', require('./put'));

/**
* Delete a single measurement of monitor
* @param :measurementId , Interger , MeasurementMonitorMap Table id to delete
*/
router.delete('/:measurementId', function(req, res){
    req
    .monitorModel
    .getMeasurementMaps()
    .then(function(measurements){
        if(measurements.length <= 1){
            throw new Errors.BadRequestError('Can\'t delete health indicator. At least one indicator is required.');
        }

        return models.MeasurementMonitor
        .destroy({
            where: {
                id: req.params.measurementId,
                monitor_id: req.monitorModel.id
            }
        })
        .then(function(deleted){
            logger.trace('Deleted measurment with id '+ deleted.id);
            return res.send(true);
        });
    })
    .catch(function(err){
        logger.error(err);
        res.status(500).send(err);
    });
});

router.put('/:monitorMeasurementId', require('./authData'));
router.use('/:measurementId/insights', require('./insights.js'));
router.use('/:measurmentId/survey', require('./survey'));

module.exports = router;
