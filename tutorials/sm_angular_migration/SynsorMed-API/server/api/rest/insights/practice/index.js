var router = require('express').Router();
var Errors = require('errors');
var async  = require('async');
var models = require('models');
var sequelize = models.sequelize;
var moment = require('moment');
var _ = require('lodash');
var config = require('config');
var logger = require('logger');

var MonitorDTO = require('../../../../dto/monitor');
var Q = require('q');


//models
var UserModel = models.User;
var EncounterModel = models.Encounter;
var OrganizationModel = models.Organization;
var MonitorModel = models.Monitor;

var SuperAdminCheck = function(req, res, next){
    if(req.current_user.role_id === config.get('seeds.roles.SuperAdmin')){
      logger.debug('Super Admin Access');
      next();
    } else {
      throw new Errors.SecurityError('Access Denied. Only SuperAdmin are allowed.');
    }
};

//check if its current user allowed to check practice insights
var UserSecurityCheck = function(req, res, next){
  var practiceId = req.params.practiceId;

  //only admin can access this
  if(req.current_user.org_id == practiceId && req.current_user.role_id == config.seeds.roles.Admin){
    next();
  } else {
    throw new Errors.SecurityError('User not authorized');
  }
};

// get insights about a practiceId
router.get('/:practiceId', UserSecurityCheck, function(req, res){
  var practiceId = req.params.practiceId;

  //get today andn last n day timestamp
  var today = moment().endOf('day').format('YYYY-MM-DD H:mm:ss');
  var nthday = moment().subtract(6, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');

  // these are set of scopes used to choose only the providers belonging to current practice
  var providerOnlyScopes = ['role_id = ' + config.seeds.roles.Provider + ' AND org_id = ?', practiceId];

  /* actual scopes to be used , but Sequelize driver bug #3001 ,#2589
  var providerOnlyScopes = [
    { method : ['isProvider']},
    { method : ['ofOrganization',practiceId]}
  ]; */


  async.parallel([
      //count all the doctors we have
      function(callback){
        UserModel
        .count({
          where : providerOnlyScopes
        })
        .then(function(data){ callback(null, data); })
        .catch(function(e){ callback(e, null); });
      },

      //get doctor with call sessions highest call session
      function(callback){

        //sequelize query generation still buggy with assoc so raw query

        sequelize
        .query("SELECT user.* FROM `" +UserModel.getTableName()+ "` as user " +
              "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
              "WHERE role_id = ? AND org_id = ? " +
              "GROUP BY encounter.provider_id " +
              "ORDER BY SUM(encounter.duration) DESC " +
              "LIMIT 1",{
                model : UserModel,
                replacements : [config.seeds.roles.Provider, practiceId],
                type: sequelize.QueryTypes.SELECT
              }
          )
        // UserModel
        // .findAll({
        //     where : providerOnlyScopes,
        //     include : [{
        //         model : EncounterModel,
        //       }],
        //     order : [[sequelize.fn('SUM',sequelize.col('Encounters.duration')),'DESC']],
        //     group : ['Encounters.provider_id'],
        // })
        .then(function(data){
            if(!_.isEmpty(data[0])){
                callback(null, data[0].name);
            } else {
                callback(null, null);
            }
        })
        .catch(function(e){ callback(e, null); });
      },

      //get doctor with call sessions highest call session in last 7 days
      function(callback){

        sequelize
        .query("SELECT user.* FROM `" +UserModel.getTableName()+ "` as user " +
              "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
              "WHERE role_id = ? AND org_id = ? " +
              "AND scheduled_start <= ? AND scheduled_start >= ? " +
              "GROUP BY encounter.provider_id " +
              "ORDER BY SUM(encounter.duration) DESC " +
              "LIMIT 1",{
                model : UserModel,
                replacements : [config.seeds.roles.Provider, practiceId, today, nthday],
                type: sequelize.QueryTypes.SELECT
              }
          )
          // UserModel
          // .findAll({
          //     where : providerOnlyScopes,
          //     include : [{
          //         model : EncounterModel,
          //         where : {
          //           scheduled_start: {
          //             $lte: today,
          //             $gte: nthday,
          //           }
          //         }
          //       }],
          //     order : [[sequelize.fn('SUM',sequelize.col('Encounters.duration')),'DESC']],
          //     group : ['Encounters.provider_id']
          // })
        .then(function(data){
            if(!_.isEmpty(data[0])){
                callback(null, data[0].name);
            } else {
                callback(null, null);
            }
        })
        .catch(function(e){ callback(e, null); });
      },

      //get doctor with least call session
      function(callback){

        //sequelize query generation still buggy with assoc so raw query

        sequelize
        .query("SELECT user.* FROM `" +UserModel.getTableName()+ "` as user " +
              "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
              "WHERE role_id = ? AND org_id = ? " +
              "GROUP BY encounter.provider_id " +
              "ORDER BY SUM(encounter.duration) " +
              "LIMIT 1",{
                model : UserModel,
                replacements : [config.seeds.roles.Provider,practiceId],
                type: sequelize.QueryTypes.SELECT
              }
          )
        .then(function(data){
            if(!_.isEmpty(data[0])){
                callback(null, data[0].name);
            } else {
                callback(null, null);
            }
        })
        .catch(function(e){ callback(e, null); });
      },

      //get doctor with least call session in last 7 days
      function(callback){

        sequelize
        .query("SELECT user.* FROM `" +UserModel.getTableName()+ "` as user " +
              "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
              "WHERE role_id = ? AND org_id = ? " +
              "AND scheduled_start <= ? AND scheduled_start >= ? " +
              "GROUP BY encounter.provider_id " +
              "ORDER BY SUM(encounter.duration) " +
              "LIMIT 1",{
                model : UserModel,
                replacements : [config.seeds.roles.Provider, practiceId, today, nthday],
                type: sequelize.QueryTypes.SELECT
              }
          )
        .then(function(data){
            if(!_.isEmpty(data[0])){
                callback(null, data[0].name);
            } else {
                callback(null, null);
            }
        })
        .catch(function(e){ callback(e, null); });
      },

      //count all the patients we have
      function(callback){
        EncounterModel
        .count({
          include : [{
              model : UserModel,
              where : providerOnlyScopes,
              required : true
            }]
        })
        .then(function(data){ callback(null, data); })
        .catch(function(e){ callback(e, null); });
      },

      //count all the patients we have in last n days
      function(callback){
        EncounterModel
        .count({
          where : {
            scheduled_start: {
              $lte: today,
              $gte: nthday
            }
          },
          include : [{
              model : UserModel,
              where : providerOnlyScopes,
              required : true
            }]
        })
        .then(function(data){ callback(null, data); })
        .catch(function(e){ callback(e, null); });
      },

      //count all Monitors
      function(callback){

         var monitorStatus = {
             monitors: 0,
             activeMonitors: 0,
             connectedMonitorRatio: 0
         };

         MonitorModel
         .count({
             include: [{
                        model : UserModel,
                        where: {
                          org_id: practiceId
                        }
                      }]
         })
         .then(function(monitorsCount){
             monitorStatus.monitors = monitorsCount;

             return models.MeasurementMonitor
             .findAll({
                 include: [{
                     model: MonitorModel,
                     include: [{
                                model : UserModel,
                                where: {
                                  org_id: practiceId
                                }
                              }]
                 }]
             });
         })
         .then(function(org_measurements){

             var connectedMonitors = 0;
             var monitorConnections = {};

            _.forEach(org_measurements, function(measurement){
                 var key = measurement.monitor_id;
                 var prevValue = monitorConnections[key] || false;
                 monitorConnections[key] = prevValue || !!measurement.oauth_id;
            });

            _.forEach(monitorConnections, function(monitorConnection){
                 if(monitorConnection){
                     connectedMonitors++;
                 }
            });

             monitorStatus.activeMonitors = connectedMonitors;
             monitorStatus.connectedMonitorRatio = monitorStatus.monitors ? (connectedMonitors/monitorStatus.monitors).toFixed(2) : 0;

             callback(null, monitorStatus);
         })
         .catch(function(err){
             callback(err, null);
         });
      }

    ], function(err, results){

      if(err){
        logger.error(err);
        return res.status(500).send(err.message);
      }

      var final = {};

      final.providers    = results[0] || 0;

      final.longestSession    = results[1] || false;
      final.longestSession7days    = results[2] || false;

      if(final.providers > 1){

        if(final.longestSession != results[3]){
          final.lowestSession    = results[3] || false;
        }

        if(final.longestSession7days != results[4]){
          final.lowestSession7days    = results[4] || false;
        }

      }

      final.patients    = results[5] || 0;
      final.patients7days    = results[6] || 0;
      final.monitorStatus = results[7];

      return res.status(200).json(final);
  });
});

router.get('/', function(req, res, next){
  if(req.current_user.role_id === config.get('seeds.roles.SuperAdmin') || req.current_user.role_id === config.get('seeds.roles.Admin') || req.current_user.role_id === config.get('seeds.roles.OrgCreator')){
    logger.debug('Super Admin Access');
    next();
  } else {
    throw new Errors.SecurityError('Access Denied. Only SuperAdmin are allowed.');
  }
}, function(req, res){
  OrganizationModel
  .findAll()
  .then(function(orgs){
      var orgData = [];

      if(_.isEmpty(orgs)){
          res.json(orgData);
      } else {
          res.json(orgs);
      }
  })
  .catch(function(e){
    res.status(500).send(e);
  });
});

router.use('/:practiceId/ccm/:days', UserSecurityCheck);
router.use(require('./ccm'));

router.use('/:practiceId/statistics', SuperAdminCheck);
router.use(require('./statistics'));

router.use('/:practiceId/leaderboard', UserSecurityCheck, require('./leaderboard'));

module.exports = router;
