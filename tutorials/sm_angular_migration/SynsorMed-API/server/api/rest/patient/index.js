'use strict';

var models = require('models');
var PatientModel = models.Patient;
var MonitorModel = models.Monitor;
var PatientMarshaller = require('../../../dto/patient');
var logger = require('logger');
var Errors = require('errors');
var router = require('express').Router();
var moment = require('moment');


router.post('/', function(req, res){
     var rawData = req.body;
     var userId = req.body.userId || false;

     if(!userId){
        return res.status(421).send('Cannot create patient without userId');
     }

     var patient = PatientMarshaller.unmarshal(rawData);
     var patientObj;

      PatientModel.create(patient)
     .then(function(patientData){
         patientObj = patientData;
         return patientObj.addUser(userId);
     })
     .then(function(){
         logger.debug('Created new patient with id '+ patientObj.id);
         return PatientMarshaller.marshal(patientObj);
     })
     .then(function(patientMarshelled){
          res.json(patientMarshelled);
     })
     .catch(function(error){
         logger.error(error);
         logger.trace(error.message);
     });
});

router.get('/:patientId', function(req, res){
    var patientId = req.params.patientId;
    PatientModel
    .findById(patientId)
    .then(function(patient){
        if (!patient) {
            throw new Errors.HTTPNotFoundError('No patients found ');
        }
      return PatientMarshaller.marshal(patient);
    })
    .then(function(response){
        response.currentUTCDateTime = moment().utc().format()
        console.log('response'.response);
        res.json(response);
    })
    .catch(function(error){
        logger.error(error);
        logger.trace(error.message);
        res.status(500).send(JSON.stringify(error));
    });
});

router.put('/:patientId', function(req, res){
    var patientId = req.params.patientId;
    var userId = req.body.userId || false;
    var patientData = PatientMarshaller.unmarshal(req.body), patientObj;
    if(!userId){
       return res.status(421).send('Cannot create patient without userId');
    }

    PatientModel.findById(patientId)
    .then(function(patient){
        if(!patient){
            throw new Errors.HTTPNotFoundError('No patient found for patient id ' + patientId);
        }
        return patient.update(patientData);
    })
    .then(function(updated){
        patientObj = updated;
        return patientObj.setUsers(userId);
    })
    .then(function(){
        logger.trace('Updated patient with id ' +patientId);
        return PatientMarshaller.marshal(patientObj);
    })
    .then(function(patientMarshelled){
        res.json(patientMarshelled);
    })
    .catch(function(error){
        logger.error(error);
        logger.trace(error.message);
        res.status(500).send(JSON.stringify(error));
    });

});

router.delete('/:patientId', function(req, res){
    var patientId = req.params.patientId;
    var patientInstance;
    var paranoid = true;
    var force = false;
    if(req.query.permanentDelete){
      force = true;
      paranoid = false;
    }
    PatientModel.find({
      where: {id: patientId},
      paranoid: paranoid
    })
    .then(function(patient){
        if(!patient){
            throw new Errors.HTTPNotFoundError('No patient found for patient id ' + patientId);
        }
        patientInstance = patient;
        //return patientInstance.setUsers([]);
        return patientInstance;
    })
    .then(function(){
        return patientInstance.destroy({ force: force });
    })
    // .then(function(){
    //     return MonitorModel.update({patient_id:null}, {where:{patient_id:patientId}});
    //})
    .then(function(){
        logger.trace('Patient deleted with id '+patientId);
        return res.json({success: true});
    })
    .catch(function(error){
        logger.error(error);
        logger.trace(error.message);
        res.status(500).send(JSON.stringify(error));
    });
});

module.exports = router;
