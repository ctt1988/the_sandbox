var router = require('express').Router();
var logger = require('logger');
var _ = require('lodash');
var moment = require('moment');

var EncounterModel = require('models').Encounter;
var UserModel = require('models').User;

var EncounterDTO = require('../../../dto/encounter');

//Get the encounter linked
router.get('/', function(req, res){
    var currentMonitor = req.monitorModel;

    //get the encounter related to this model
    currentMonitor
    .getEncounter()
    .then(function(encounter){

      if(_.isEmpty(encounter)){
        res.json(null);
        return;
      }

      EncounterDTO
      .marshal(encounter)
      .then(function(encounterData){
        res.json(encounterData);
     });

    })
    .catch(function(e){
      logger.error(e);
      res.send(500).json(e);
   });
});


/** When the provider want to offer monitor some dates on which appointment can be set **/
router.post('/offer', function(req, res){
    var currentMonitor = req.monitorModel;
    var appointmentDates = req.body;

    if(_.isEmpty(appointmentDates)){
      res.status(422).send('No dates were specified');
      return;
    }

    //get only the future dates
    appointmentDates = _.filter(appointmentDates, function(val){
      // if date is after current time
      return moment(new Date(val)).isAfter();
    });

    if(_.isEmpty(appointmentDates)){
      res.status(422).send('No future dates were specified');
      return;
    }

    //get only the future dates
    appointmentDates = _.map(appointmentDates, function(val){
      // if date is after current time
      return new Date(val).toJSON();
    });


    currentMonitor.appointment_meta = JSON.stringify(appointmentDates);
    currentMonitor
    .save()
    .then(function(updated){
      logger.trace('appointment_meta field updated with MonitorId '+ updated.id);
      res.send(true);
    })
    .catch(function(e){
      logger.error(e);
      res.status(500).send();
    });

});

/** When the provider want to offer monitor some dates on which appointment can be set **/
router.post('/confirm', function(req, res){
    var currentMonitor = req.monitorModel;
    var appointmentDate = req.body.date;

    if(_.isEmpty(appointmentDate)){
      return res.status(422).send('Missing date field');
    }

    //convert to JS object
    appointmentDate = new Date(appointmentDate);

    //find if encounter with this code already exists
    EncounterModel.findOne({
      where : {
        patient_code : currentMonitor.patient_code
      }
    })
    .then(function(encounter){

      //same encoutner already exists
      if(encounter){

        UserModel
        .getFee(encounter.provider_id)
        .then(function(fee){

          //reset its data
          encounter.fee = encounter.fee || fee;
          encounter.scheduled_start = appointmentDate;
          encounter.fee_paid = false;
          encounter.payment_id = null;
          //save encounter
          return encounter.save();
        })
        .then(function(){
          logger.trace('Encounter '+ encounter.id + 'updated');
          //reset appointment_meta
          currentMonitor.appointment_meta = null;
          return currentMonitor.save();
        })
        .then(function(){
          res.json(true);
        })
        .catch(function(e){
          logger.error(e);
          res.status(500).json(e);
        });

      } else {

      //create new encounter
      UserModel
      .getFee(currentMonitor.provider_id)
      .then(function(fee){
        return EncounterModel.build({
            patient_code: currentMonitor.patient_code,
            reason_for_visit: currentMonitor.description,
            provider_id: currentMonitor.provider_id,
            scheduled_start: appointmentDate,
            fee: fee
          })
          .save();
      })
      .then(function(newEncounter){
          logger.trace('Encounter '+ newEncounter.id + 'updated');
          return currentMonitor.setEncounter(newEncounter);
      })
      .then(function(){
        //reset appointment_meta
        currentMonitor.appointment_meta = null;
        return currentMonitor.save();
      })
      .then(function(updated){
        logger.trace('appointment_meta field updated with MonitorId '+ updated.id);
        res.json(true);
      })
      .catch(function(e){
        logger.error(e);
        res.status(500).json(e);
      });

      }
    })
    .catch(function(e){
      logger.error(e);
      res.status(500).json(e);
    });

});

module.exports = router;
