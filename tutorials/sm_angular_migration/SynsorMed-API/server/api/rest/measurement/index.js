'use strict';

var router = require('express').Router();
var MeasurementModel = require('models').Measurement;
var MeasurementDTO = require('../../../dto/measurement');

router.get('/', function(req, res){
    MeasurementModel.findAll({
        where: {
            name: {
                $in: [
                    'glucose', 'blood pressure', 'steps', 'weight', 'sleep',
                    'heartrate', 'temperature', 'breath', 'oxygen flow', 'oxygen purity',
                    'caloric intake', 'oxygen saturation', 'status', 'peak flow rate'
                ]
            }
        }
    })
    .then(function(measurements){
        var final = [];
        measurements.forEach(function(data){
            final.push(MeasurementDTO.marshal(data));
        });
        return res.json(final);
    });
});

module.exports = router;
