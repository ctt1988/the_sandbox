var router = require('express').Router();

//models
var models = require('models');
var UserModel = models.User;
var EncounterModel = models.Encounter;
var OrganizationModel = models.Organization;
var UserMarshaller = require('../../../../dto/user');
var OrganizationMarshaller = require('../../../../dto/practice');

var sequelize = models.sequelize;
var config = require('config');
var _ = require('lodash');
var async = require('async');
var Q = require('q');
var logger = require('logger');

// get insights about a provider
router.get('/:practiceId/statistics',function(req,res){
    var org_id = req.params.practiceId;

    async.parallel([

        //get org data
        function(callback){
          OrganizationModel.findById(org_id).then(function(data){
            OrganizationMarshaller.marshal(data).then(function(parsedData){
              callback(null,parsedData);
            }).catch(function(e){
              callback(null,data);
            })
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the Admins count for this org
        function(callback){
          UserModel.count({
            where : {
              role_id : config.get('seeds.roles.Admin'),
              org_id : org_id
            }
          }).then(function(data){
            callback(null,data);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the provider count for this org
        function(callback){
          UserModel.count({
            where : {
              role_id : config.get('seeds.roles.Provider'),
              org_id : org_id
            }
          }).then(function(data){
            callback(null,data);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the encounters count
        function(callback){
          sequelize
          .query("SELECT COUNT(*) as `count` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? ",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].count);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get encounter with oauth_data
        function(callback){
          sequelize
          .query("SELECT COUNT(*) as `count` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? " +
                "AND oauth_data IS NOT NULL",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].count);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the encounter with notes
        function(callback){
          sequelize
          .query("SELECT COUNT(*) as `count` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? " +
                "AND note IS NOT NULL",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].count);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the encounter with ccm
        function(callback){
          sequelize
          .query("SELECT COUNT(*) as `count` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? " +
                "AND is_ccm = true",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].count);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the past encounter with no activity
        function(callback){
          sequelize
          .query("SELECT COUNT(*) as `count` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? AND " +
                "encounter.last_activity IS NULL AND " +
                "DATE(encounter.scheduled_start) < CURDATE()",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].count);
          }).catch(function(e){
            callback(e,null);
          });
        },

        //get the avg fee for encounter
        function(callback){
          sequelize
          .query("SELECT SUM(encounter.fee)/COUNT(*) as `fee` FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? ",{
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
          .then(function(data){
            callback(null,data[0].fee);
          }).catch(function(e){
            callback(e,null);
          });
        },


        //get the avg wait-time for encounter
        function(callback){
          sequelize
          .query("SELECT encounter.* FROM `" +UserModel.getTableName()+ "` as user " +
                "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
                "WHERE role_id = ? AND org_id = ? ",{
                  model : EncounterModel,
                  replacements : [config.get('seeds.roles.Provider'),org_id],
                  type: sequelize.QueryTypes.SELECT
                }
            )
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
        },


        //get all the providers
        function(callback){
          UserModel.findAll({
            where: {
              org_id : org_id,
              role_id : config.get('seeds.roles.Provider')
            }
          })
          .then(function (users) {
              var promises = [];
              var userData = [];
              users.map(function (user) {
                  var promise = UserMarshaller.marshal(user);
                  promises.push(promise.then(function (userJSON) {
                      userData.push(userJSON);
                  }));
              })

              Q.all(promises).then(function () {
                callback(null,userData);
              }).catch(function (e) {
                callback(e,null);
              })
          }).catch(function (e) {
            callback(e,null);
          })
        }
      ],function(err,results){

        if(err){
          logger.error(err);
          return res.status(500).send(err.message);
        }

        var final = {};

        final.name = results[0].name || null;
        final.id = results[0].id || null;
        final.status = results[0].isActive;

        final.stats = {};
        final.encounter = {};

        final.stats.admin     = results[1] || 0;
        final.stats.provider  = results[2] || 0;

        final.encounter.count  = results[3] || 0;
        final.encounter.with_oauth  = results[4] || 0;
        final.encounter.with_notes  = results[5] || 0;
        final.encounter.ccm         = results[6] || 0;
        final.encounter.no_activity = results[7] || 0;

        final.encounter.avg_fee     = (results[8] ? results[8].toFixed(2) : results[0].defaultFee) || 0;
        final.encounter.wait_time   = parseInt(results[9]) || 0;

        final.providers = results[10] || {};

        return res.status(200).json(final);
    });

});

module.exports = router;
