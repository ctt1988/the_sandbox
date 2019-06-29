var router = require('express').Router();
var Errors = require('errors');
var logger = require('logger');


var encounterSecure = function(req, res, next){
    var encounter = req.encounterModel;
    if(encounter.patient_code != req.session.encounterCode) {
      throw new Errors.SecurityError('User not authorized');
    } else {
      next();
    }
};

/** update the call duration for encounter **/
router.put('/duration', encounterSecure, function(req, res){

      var encounter = req.encounterModel;
      //calculate duration
      var duration = parseInt(encounter.duration || 0) + parseInt(req.body.duration);

      return encounter.updateAttributes({duration : duration}).then(function(){
          logger.trace('Updated duration in encounter '+ encounter.id);
          return res.status(200).send(true);
      }).catch(function (err) {
        logger.error(err);
        return res.status(500).send(JSON.stringify(err));
      });

});

/** update the call events for encounter **/
router.put('/mark/:event', encounterSecure, function(req, res){
    var encounter = req.encounterModel,
        event = (req.params.event || '').toLowerCase(),
        updateString = {};

    switch(event){

      case 'ready':
        updateString.call_ready = new Date();
        //ready new call remove old call started value
        updateString.call_started = null;
      break;

      case 'start':
        //if user is ready for call then record call start event
        if(encounter.call_ready){
          updateString.call_started = new Date();
        }
      break;

    }

    return encounter.updateAttributes(updateString).then(function(){
        logger.trace('Encounter updated with id ' + encounter.id);
        return res.status(200).send(true);
    }).catch(function (err) {
        logger.error(err);
        return res.status(500).send(JSON.stringify(err));
    });

});


module.exports = router;
