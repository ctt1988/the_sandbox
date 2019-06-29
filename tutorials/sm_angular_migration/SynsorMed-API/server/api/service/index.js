'use strict';

var router = require('express').Router();
var _ = require('lodash');
var logger = require('logger');

var servicelist = require('../../components/servicemap/servicelist');
var driver = require('./driver');
var EncounterModel = require('models').Encounter;

//list all the services we provide
router.get('/', function (req, res) {
  return res.json(servicelist.getServices());
});

var patientDataSecurity = function (req, res, next) {
    if(process.env.NODE_ENV === 'development')
    {
        next();
    }
    else {
        if(!req.session.userId && !req.session.encounterCode) {
          res.status(401).end();
          return;
        }
        EncounterModel
        .findById(req.params.encounterId)
        .then(function(encounter){
            if(encounter && req.session.encounterCode != encounter.patient_code && req.session.userId != encounter.provider_id)
            {
                res.status(401).end();
                return;
            }
            next();
        });
    }
};

//read oauth data available for encounter
router.get('/read/:encounterId', patientDataSecurity, function(req, res){

  var encounterId = req.params.encounterId;

  //find the encounter
  EncounterModel
  .findById(encounterId)
  .then(function(encounter){

      //if no encounter found
      if(!encounter){
        return res.status(404).send("Encounter code " + encounterId + " not found.");
      }

      //if no oauth data available
      if(!encounter.service_name || !encounter.oauth_data){
        return res.status(200).json(null);
      }

      //get service version
      var serviceData = servicelist.getService(encounter.service_name);
      var oauthData = JSON.parse(encounter.oauth_data);

      if(serviceData === false){
        return res.status(404).send(encounter.service_name + " is no longer supported.");
      }

      //set the oauth model , if the oauth token are updated this model instance will be used to persist them
      oauthData.oauthModelInstance = encounter;

      driver
        .getUserDetails(encounter.service_name, oauthData)
        .then(function(results){
            logger.debug(results);
          if(_.isEmpty(results.data)){
            results.data = null;
          }
          res.status(200).json(results);
        })
        .catch(function(err){
          logger.error(err);
          res.status(500).json(err);
        });

  })
  .catch(function(err){
    logger.error(err);
    res.status(500).json(err);
  });

});

/*
 Perform check on encounter to see if its oauthdata expired or not
*/
router.get('/expired/:encounterId', function(req, res){
  var encounterId = req.params.encounterId;

  //find the encounter
  EncounterModel
  .findById(encounterId)
  .then(function(encounter){

      //if no encounter found
      if(!encounter){
        return res.status(404).send("encounter code " + encounterId + " not found.");
      }

      //if no oauth data available
      if(!encounter.service_name || !encounter.oauth_data){
        return res.status(200).json(null);
      }

      //get service version
      var serviceData = servicelist.getService(encounter.service_name);
      var oauthData = JSON.parse(encounter.oauth_data);

      if(serviceData === false){
        return res.status(404).send(encounter.service_name + " is no longer supported.");
      }

      var callback = function(error, results){
          if(error){
            logger.error(results);
            res.status(401).json(results);
          } else {

            if(_.isEmpty(results)){
              results = false;
            } else if(results === true){

              //clear the service becuase oauth token are expired
              encounter.updateAttributes({
                oauth_data: null,
                service_name: null
              });

              logger.trace('Clearing the service due to oauth token are expired of encounter '+ encounter.id);

            }
            res.status(200).json(results);
          }
      };

      oauthData.oauthModelInstance = encounter;

      var callbackUrl = servicelist.getCallbackUrlByServiceId(encounter.service_name);

      if(serviceData.version === 2){
        require('./oauthv2/auth').expireCheck(encounter.service_name, oauthData, callbackUrl)
        .then(function(results){
            callback(false, results);
        })
        .catch(function(err){
            callback(true, err);
        });
      } else {
        callback(null, "This driver doesn't support expire check.");
      }

  })
  .catch(function(error){
    logger.error(error);
    res.status(500).send(JSON.stringify(error));
  });

});

//oauth v1 services provided will be handled here
router.use("/v1", require('./oauthv1'));

//oauth v2 services provided will be handled here
router.use("/v2", require('./oauthv2'));

router.use('/v3', require('./oauthv3'));


module.exports = router;
