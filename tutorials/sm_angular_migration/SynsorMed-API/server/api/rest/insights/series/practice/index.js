var router = require('express').Router();
var Errors = require('errors');
var sequelize = require('models').sequelize;
var moment = require('moment');
var config = require('config');
var _ = require('lodash');
var logger = require('logger');

//models
var models = require('models');
var UserModel = models.User;
var EncounterModel = models.Encounter;
var EncounterSurveyAnswerModel = models.EncounterSurveyAnswer;
var SurveyQuestionModel = models.SurveyQuestion;

//check if its current user allowed to check practice insights
router.use('/:practiceId/:days',function(req,res,next){
  var practiceId = req.params.practiceId;

  //only admin can access this
  if(req.current_user.org_id == practiceId && req.current_user.role_id == config.seeds.roles.Admin){
    next();
  } else {
    throw new Errors.SecurityError("User not authorized");
    return;
  }
});

// get survey details
router.get('/:practiceId/survey',function(req,res,next){
  var practiceId = req.params.practiceId;

  //sequelize query generation still buggy with assoc so raw query
    sequelize
    .query("SELECT " +
          "`survey_answers`.`encounter_survey_question_id` AS `id`," +
          "`survey_questions`.`text` AS `question`, " +
          "COUNT(*) AS `all`," +
          "SUM(CASE WHEN `survey_answers`.`choice` = 1 THEN 1 ELSE 0 END) as `positive`, " +
          "SUM(CASE WHEN `survey_answers`.`choice` = 0 THEN 1 ELSE 0 END) as `negative` " +
          "FROM `" +EncounterModel.getTableName()+ "` as encounter " +
          "INNER JOIN `" +UserModel.getTableName()+ "` as user ON `encounter`.`provider_id` = `user`.`id` AND `user`.`role_id` = ? AND `user`.`org_id` = ? " +
          "INNER JOIN `" +EncounterSurveyAnswerModel.getTableName()+ "` as survey_answers ON `encounter`.`id` = `survey_answers`.`encounter_id` " +
          "INNER JOIN `" +SurveyQuestionModel.getTableName()+ "` as survey_questions ON `survey_answers`.`encounter_survey_question_id` = `survey_questions`.`id` " +
          "GROUP BY `encounter_survey_question_id` ",{
            replacements : [config.seeds.roles.Provider,practiceId],
            type: sequelize.QueryTypes.SELECT
          })
    .then(function(data){
          var final = {};

          if(_.isEmpty(data)){
            return res.json(final);
          }

          final.series = [];
          final.categories = [];

          var perc = function(pos,neg){
              return parseInt(((pos / (neg + pos)) * 100));
          }

          //dont expose question's pk, rather shown sequential order
          var qID = 1;

          _.forEach(data,function(questResp){

            //empty object to push
            var data_obj = {
              y : 0,
              extra : {
                positive : 0,
                negative : 0,
                all : 0,
                question : null
              }
            };

            //if there is some data then prepare
            data_obj.y = perc(questResp.positive,questResp.negative)  || 0;
            data_obj.extra.positive = questResp.positive || 0;
            data_obj.extra.negative = questResp.negative || 0;
            data_obj.extra.all = questResp.all || 0;
            data_obj.extra.question = questResp.question || null;

            //push final data to response
            final.series.push(data_obj);
            final.categories.push('Q #' + qID);
            qID++;

          });

          return res.json(final);
    })
    .catch(function(e){
        logger.error(e);
        res.status(500).json(e);
    });

});



// get insights about a practiceId
router.get('/:practiceId/:days',function(req,res,next){
  var practiceId = req.params.practiceId;

  //get today andn last n day timestamp
  var today = moment().endOf('day').format("YYYY-MM-DD H:mm:ss");
  var nthday = moment().subtract(req.params.days,'days').startOf('day').format("YYYY-MM-DD HH:mm:ss");

  //sequelize query generation still buggy with assoc so raw query
    sequelize
    .query("SELECT " +
          "COUNT(*) AS `calls`," +
          "SUM(`duration`) AS `duration`," +
          "DATEDIFF(`scheduled_start`,NOW()) AS `date`," +
          "SUM(UNIX_TIMESTAMP(`call_started`) - UNIX_TIMESTAMP(`call_ready`)) AS `wait`," +
          "COUNT(CASE WHEN `encounter`.`duration` > 0 THEN 1 ELSE NULL END) as `active_calls` " +
          "FROM `" +EncounterModel.getTableName()+ "` as encounter " +
          "INNER JOIN `" +UserModel.getTableName()+ "` as user ON `encounter`.`provider_id` = `user`.`id` AND `user`.`role_id` = ? AND `user`.`org_id` = ? " +
          "WHERE `scheduled_start` <= ? AND " +
          "`scheduled_start` >= ? " +
          "GROUP BY DATE(`scheduled_start`) ",{
            replacements : [config.seeds.roles.Provider,practiceId,today,nthday],
            type: sequelize.QueryTypes.SELECT
          })
    .then(function(data){
          var final = {};

          if(_.isEmpty(data)){
            return res.json(final);
          }

          final.series = [];
          final.categories = [];

          //build categories
          for(var i = req.params.days; i >= 0 ; i--){

            //add days to categories
            final.categories.push(moment().subtract(i,'days').format("DD MMM").toString());

            //find the current date data from SQL set
            var tmp_data = _.find(data,function(val){
                return val.date == (i * -1);
            });

            //empty object to push
            var data_obj = {
              y: 0,
              extra : {
                calls : 0,
                duration : 0,
                wait : 0,
                active_calls : 0
              }
            };

            //if there is some data then prepare
            if(!_.isEmpty(tmp_data)){
              data_obj.y = tmp_data.calls;
              data_obj.extra.calls = tmp_data.calls;
              data_obj.extra.active_calls = tmp_data.active_calls;
              data_obj.extra.duration= tmp_data.duration || 0 ;
              data_obj.extra.wait= tmp_data.wait || 0 ;
            }

            //push final data to response
            final.series.push(data_obj);

          }

          return res.json(final);
    })
    .catch(function(e){
        logger.error(e);
        res.status(500).json(e);
    });

  });

module.exports = router;
