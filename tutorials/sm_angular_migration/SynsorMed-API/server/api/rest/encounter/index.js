'use strict';

var _ = require('lodash');
var router = require('express').Router();
var Errors = require('errors');
var moment = require('moment');
var logger = require('logger');

var models = require('models');
var EncounterModel = models.Encounter;
var OrganizationModel = models.Organization;
var MonitorModel = models.Monitor;
var UserModel = models.User;
var PatientModel = models.Patient;

var EncounterDTO = require('../../../dto/encounter');
var UniqueCode = require('../../../components/unique');

var encounterIndex = require('express').Router();
var jwt = require('../../service/drivers/base/jwt');


var checkPatientOfProvider = function(req, res, next){
    var patientId = req.body.patientId;
    var providerId = req.body.providerId ? parseInt(req.body.providerId) : req.session.userId;

    // if patientId is not set
    if(!patientId) return next();

    PatientModel.findOne({
        where: { id: patientId },
        include:[{
            model : UserModel
        }]
    })
    .then(function(patient){
        if(!patient || !patient.Users.length){
            throw new Errors.ValidationError('No patient found with id '+patientId);
        }
        var users = patient.Users;
        var isPatientOfUser = false;
        users.forEach(function(user){
            if(user.id == providerId){
                isPatientOfUser = true;
                return;
            }
        });
        if(isPatientOfUser){
          return next();
        }
        else{
            throw new Errors.ValidationError(patientId + ' is not a patient of user '+providerId);
        }
    })
    .catch(function(err){
       logger.error(err);
       logger.trace(err.message);
       res.status(500).send(JSON.stringify(err));
    });
};

encounterIndex.post('/', checkPatientOfProvider, function (req, res) {
    if(!req.body.providerId) {
        req.body.providerId = req.session.userId;
    }
    if(!req.body.scheduledStartTime) {
        return res.status(400).send();
    }

    var encounter = EncounterModel.build(EncounterDTO.unmarshal(req.body));

    UniqueCode.generateUniqueCode().then(function (code) {

        encounter.patient_code = code;

        return UserModel.getFee(req.body.providerId).then(function (fee) {
                encounter.fee = encounter.fee || fee;
                return encounter.save().then(function (encounter) {
                  logger.trace('Created encounter with id '+ encounter.id);
                  EncounterDTO.marshal(encounter).then(function (encounterJSON) {
                    res.json(encounterJSON);
                });
            });
        });
    }).catch(function (e) {
      logger.error(e);
      res.status(500).send(JSON.stringify(e));
    });

});

/**
 * Api to check the encounters for a practice for last N number of days (including today)
 *
 * (required) practiceId : User's practice
 * (required) days       : Days (Integer) (N number of past days)
 *
 * @return Integer
 */

encounterIndex.post('/count', function(req, res){

    if(!req.body.providerId) {
      return res.status(400).send("Practice missing");
    }

    if(!req.body.days){
         return res.status(400).send("Days field missing");
    }

    if(isNaN(req.body.days)){
         return res.status(400).send("Days field must be numerical");
    }

    //get today and last n day timestamp
    var today = moment().endOf('day').format("YYYY-MM-DD H:mm:ss");
    var nthday = moment().subtract(req.body.days, 'days').startOf('day').format("YYYY-MM-DD HH:mm:ss");

    //access the organization model
    return OrganizationModel
            .findById(req.current_user.org_id)
            .then(function (practice) {

                if(!practice){
                  return res.status(400).send("Practice not found");
                }

                //count encounter for today
                EncounterModel.count({
                  where: {
                    scheduled_start: {
                      $lte: today,
                      $gte: nthday,
                    },
                    provider_id: req.body.providerId
                  }})
                .then(function(encounterCount){
                    res.json(encounterCount);
                });
            })
            .catch(function (e) {
                  logger.error(e);
                  return res.status(500).send(JSON.stringify(e));
            });

});

router.use('/', function (req, res, next) {
  if(req.session.userId || req.session.encounterCode) {
    next();
  } else {
    throw new Errors.SecurityError("Access to encounter denied - not authenticated ");
  }
}, encounterIndex);

var encounterItem = require('express').Router({mergeParams: true});

encounterItem.use(function (req, res, next) {
    EncounterModel.find({
      where: {id: req.params.encounterId},
      include: [UserModel]
    }).then(function (encounter) {
        if (!encounter) {
            throw new Errors.HTTPNotFoundError("No encounter found for encounter id" + req.params.encounterId);
        }

        if(encounter.User.org_id != req.current_user.org_id && encounter.patient_code != req.session.encounterCode) {
            throw new Errors.SecurityError("User not authorized");
        }

        req.encounterModel = encounter;
        next();
    }).catch(function (err) {
      throw new Errors.SQLExceptionError(err);
    });
});

//unlink the encounter by clearing its oauth data
encounterItem.delete('/unlink', require('./unlink'));

encounterItem.delete('/', function (req, res) {
    req.encounterModel.destroy().then(function () {

      logger.trace('Encounter '+ req.encounterModel.id + ' deleted.');

      MonitorModel
      .findOne({
        encounter_id: req.params.encounterId
      })
      .then(function(monitor){
          if(!monitor){
            return res.json({success: true});
          }

          //monitor exists
          monitor.encounter_id = null;
          monitor
          .save()
          .then(function(){
            logger.trace('Updated monitor ' + monitor.id + ' after delete the encounter ' + req.encounterModel.id);
            return res.json({success: true});
          });
      });


    }).catch(function (err) {
      return res.status(500).send(JSON.stringify(err));
    });
});

encounterItem.get('/', function (req, res) {
    EncounterDTO.marshal(req.encounterModel).then(function (encounterJSON) {
        res.json(encounterJSON);
    });
});

encounterItem.put('/', checkPatientOfProvider, function (req, res) {
    var encounterFromJSON = EncounterDTO.unmarshal(req.body);
    if(!req.session.userId) {
      encounterFromJSON = _.pick(encounterFromJSON, 'terms_accepted');
    }
    logger.debug('The data being put to encounter is:' + encounterFromJSON);
    return EncounterModel.findById(req.params.encounterId).then(function (encounter) {
      return encounter.update(encounterFromJSON).then(function (updated) {
        logger.trace('Updated encounter '+ updated.id);
        return EncounterDTO.marshal(encounter).then(function (encounterJSON) {
          res.json(encounterJSON);
        });
      });
    });
});

encounterItem.put('/link', function(req, res){
    var service = req.body.service;
    var oauthData = req.body.data;

    if(!service && !oauthData){
       return res.status(401).end();
    }

    EncounterModel.findById(req.params.encounterId)
    .then(function(encounter){
       //decode the data if its encoded
       oauthData = jwt.decode(oauthData);
       return encounter.updateAttributes({
          service_name: service,
          oauth_data: _.isEmpty(oauthData) ? null : JSON.stringify(oauthData)
       });
    })
    .then(function(updated){
        logger.trace('Encounter '+updated.id+' linked with service '+service);
        return res.json(updated);
    })
    .catch(function(){
        return res.status(401).end();
    });

});

router.use('/:encounterId', encounterItem);
encounterItem.use('/payment', require('./payment'));
encounterItem.use('/token', require('./token'));
encounterItem.use('/answers', require('./answers'));
encounterItem.use('/call', require('./call'));
encounterItem.use('/code/name', require('./name'));
encounterItem.use('/quickBloxDetails', require('./quickBloxDetails'));

module.exports = router;
