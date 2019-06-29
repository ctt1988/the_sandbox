var router = require('express').Router();
var EncounterSurveyAnswerModel = require('models').EncounterSurveyAnswer;
var OrganizationModel = require('models').Organization;
var logger = require('logger');

router.post('/', function (req, res) {

  var answers = [];

  return req.encounterModel.getUser({
    include: [OrganizationModel]
  }).then(function (user) {
    return user.Organization.getSurveyQuestions().then(function (surveyQuestions) {

      for(var i = 0, l = surveyQuestions.length; i < l; i++) {
        logger.trace('Creating answer for encounterId '+ req.encounterModel.id + ' and survey questionId '+surveyQuestions[i].id);
        answers.push({encounter_id: req.encounterModel.id, encounter_survey_question_id: surveyQuestions[i].id, choice: req.body[i]});
      }

      return EncounterSurveyAnswerModel.bulkCreate(answers).then(function () {
        res.status(204).end();
      });
    });
  });


});

module.exports = router;
