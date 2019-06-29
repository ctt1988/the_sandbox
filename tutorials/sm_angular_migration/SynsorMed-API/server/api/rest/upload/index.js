'use strict';

var router = require('express').Router();
var _ = require('lodash');
var Q = require('q');
var models = require('models');
var Errors = require('errors');
var logger = require('logger');
var fs = require('fs');
var moment = require('moment');
var multer = require('multer');
var upload = multer({ dest: '/tmp/' });
var xlsx = require('node-xlsx');
var PatientModel = models.Patient;
var PatientUserModel = models.PatientUser;
var MonitorModel = models.Monitor;
var PatientMarshaller = require('../../../dto/patient');

router.post('/',upload.single('file'), function(req, res){
    if(!req.file){
      return res.status(421).send('Unable to upload the file. Something went wrong!');
    }
    var fileType = req.file.originalname.split('.')[1];
    if(fileType != 'xls' && fileType != 'csv'){
      return res.status(421).send('Please choose the excel/csv format file.');
    }

    var array = xlsx.parse(req.file.path);
    var patientBatch = {};
    var patientUserBatch = {};
    var patientsDetail= array[0].data.slice(1);
    var arr = [];
    var patient;
    var patientObj;
    var arr1 = [];

    fs.unlink(req.file.path, function(err){
      if(err){
        logger.error(err);
        console.log('Error while deleting the file', err)
      }
    });

    patientsDetail.forEach(function(patient){
      var userId = patient[12] || false;
      if(!userId){
         return res.status(421).send('Cannot create patient without userId');
      }
      patientBatch = {
          firstName: patient[0],
          lastName: patient[1],
          gender: patient[2],
          dob: moment(patient[3], 'MM-DD-YYYY').format('MM-DD-YYYY'),
          mobileNumber: patient[4],
          email: patient[5],
          address: patient[6],
          city: patient[7],
          state: patient[8],
          zip: patient[9],
          socialSecurityNumber: patient[10],
          medicalRecordNumber: patient[11],
          userId: patient[12],
          notify: false
      }

      patient = PatientMarshaller.unmarshal(patientBatch);
      arr.push(patient);
    });

  PatientModel.bulkCreate(arr, {individualHooks: true})
    .then(function(patientData){
        patientObj = patientData;
        patientsDetail.forEach(function(oldPatient){
          patientObj.forEach(function(newPatient){
            if(oldPatient[5] == newPatient.email && oldPatient[0] == newPatient.first_name){
              newPatient.userId = oldPatient[12]
            }
          })
        })
        patientObj.forEach(function(patient){
          patientUserBatch = {
              patient_id : patient.id,
              provider_id : patient.userId
          }
          arr1.push(patientUserBatch);
        });
        PatientUserModel.bulkCreate(arr1)
        .then(function(patientRes){
          res.json(patientRes);
        })
        .catch(function(error){
            logger.error(error);
            logger.trace(error.message);
        });
    })
    .catch(function(error){
        logger.error(error);
        logger.trace(error.message);
    });
});

module.exports = router;
