var router = require('express').Router();
var Errors = require('errors');
var async  = require('async');
var config = require('config');
var _      = require('lodash');

//models
var UserModel = require('models').User;
var EncounterModel = require('models').Encounter;
var logger = require('logger');

//check if its current user allowed to check provider insights
var UserCheck = function(req,res,next){
  var providerId = req.params.providerId;

  //get provider details
  UserModel
  .findById(providerId)
  .then(function(provider){

      if(!provider){
        throw new Errors.HTTPNotFoundError("No provider found for provider id " + providerId);
        return;
      }

      if(req.current_user.org_id === provider.org_id){
        next();
      }
  })
  .catch(function(e){
      logger.error(e);
      return res.status(500).send(JSON.stringify(e));
  });

};

var SuperAdminCheck = function(req,res,next){
    if(req.current_user.role_id === config.get('seeds.roles.SuperAdmin')){
      logger.debug('Super Admin Access');
      next();
    } else {
      throw new Errors.SecurityError("Access Denied. Only SuperAdmin are allowed.");
    }
};

// get insights about a provider
router.get('/:providerId',UserCheck,function(req,res,next){
  var providerId = req.params.providerId;

  async.parallel([
      function(callback){
        EncounterModel.sum('duration',{ where:{ provider_id : providerId }}).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });;
      },
      function(callback){
        EncounterModel.count({ where:{ provider_id : providerId } }).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });
      },
      function(callback){
        EncounterModel.max('duration',{ where:{ provider_id : providerId }}).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });
      }
    ],function(err,results){

      if(err){
        logger.error(err);
        return res.status(500).send(err.message);
      }

      var final = {};

      final.duration    = results[0] || 0;
      final.calls       = results[1] || 0;
      final.maxDuration = results[2] || 0;

      return res.status(200).json(final);
  });

});


// get insights about a provider
router.get('/:providerId/statistics',SuperAdminCheck,function(req,res,next){
  var providerId = req.params.providerId;

  async.parallel([
      function(callback){ //count all encounters
        EncounterModel.count({ where:{ provider_id : providerId }}).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });;
      },
      function(callback){ //get total call time
        EncounterModel.sum('duration',{ where:{ provider_id : providerId } }).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });
      },
      function(callback){
        EncounterModel.count({ //get patient without notes
          where:{
            provider_id : providerId,
            note : {
              $ne : null
            }
          }
        }).then(function(data){
          callback(null,data);
        }).catch(function(e){
          callback(e,null);
        });
      },
      function(callback){ //get avg wait time
        EncounterModel.findAll({ where:{ provider_id : providerId } })
        .then(function(data){
          var count = 0, wait = 0;
          _.forEach(data,function(val){
            var temp = val.getWaitingTime();
              wait += temp;
              if(temp > 0){
                count++;
              }
          })

          callback(null,wait/count);
        }).catch(function(e){
          callback(e,null);
        });
      }
    ],function(err,results){

      if(err){
        logger.error(err);
        return res.status(500).send(err.message);
      }

      var final = {};

      final.patients    = results[0] || 0;
      final.avg_call_time = parseInt(results[1] / results[0]) || 0;
      final.with_notes    = results[2] || 0;
      final.avg_wait_time = parseInt(results[3]) || 0;

      return res.status(200).json(final);
  });

});


module.exports = router;
