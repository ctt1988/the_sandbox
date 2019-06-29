var router = require('express').Router();

//models
var UserModel = require('models').User;
var EncounterModel = require('models').Encounter;
var MonitorModel = require('models').Monitor;
var Q = require('q');

var sequelize = require('models').sequelize;
var moment = require('moment');
var config = require('config');
var _ = require('lodash');
var logger = require('logger');

// get insights about a provider
router.get('/:practiceId/ccm/:days',function(req,res,next){
    var org_id = req.params.practiceId;
    var days   = req.params.days || 7;

    //get today andn last n day timestamp
    var today = moment().endOf('day').format("YYYY-MM-DD H:mm:ss");
    var nthday = moment().subtract(req.params.days,'days').startOf('day').format("YYYY-MM-DD HH:mm:ss");
    var final = [];

    Q.all([
        sequelize
        .query("SELECT user.first_name,user.middle_name,user.last_name,encounter.patient_code,encounter.scheduled_start,encounter.duration,encounter.provider_id FROM `" +UserModel.getTableName()+ "` as user " +
              "JOIN `" +EncounterModel.getTableName()+ "` as encounter ON user.id = encounter.provider_id " +
              "WHERE role_id = ? AND org_id = ? AND " +
              "`scheduled_start` <= ? AND " +
              "`scheduled_start` >= ? AND " +
              "`is_ccm` = 1 " +
              "ORDER BY encounter.scheduled_start DESC ",{
                replacements : [config.seeds.roles.Provider,org_id,today,nthday],
                type: sequelize.QueryTypes.SELECT
              }
          ),
          MonitorModel
           .findAll({
               attributes: ['patient_code', 'note', 'start_date'],
               where:{
                   is_ccm: true
               },
               include : [{
                       model : UserModel,
                       attributes: ['first_name', 'middle_name', 'last_name'],
                       where : {
                         org_id : org_id,
                         role_id : config.seeds.roles.Provider
                       }
                     }]
          })
    ])
    .spread(function(data, monitor){
       if(_.isEmpty(data)){
         return res.json(final);
       }


      _.forEach(data, function(val){
          final.push({
            name : val.first_name + " " + val.middle_name + " " + val.last_name,
            code : val.patient_code,
            date : val.scheduled_start,
            duration : val.duration
          });
      });

      _.forEach(monitor, function(val){
          var totalDuration = 0;
          if(val.note){
              var note = JSON.parse(val.note);
              _.forEach(note, function(data){
                  totalDuration += data.duration ;
              });
          }

          final.push({
            name : val.User.first_name + " " + val.User.middle_name + " " + val.User.last_name,
            code : val.patient_code,
            date : val.start_date,
            duration : totalDuration
          });
      });

      return res.json(final);
    })
    .catch(function(e){
      logger.error(e);
      res.status(500).json(e);
    });


});

module.exports = router;
