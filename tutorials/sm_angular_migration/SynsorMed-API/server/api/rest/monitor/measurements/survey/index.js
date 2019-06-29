'use strict';

var _ = require('lodash');
var logger = require('logger');
var models = require('models');
var router = require('express').Router({mergeParams: true});
var SurveyDto = require('../../../../../dto/statusSurveyQuestion');

router.get('/questions', function(req, res){
    models.MeasurementMonitor.findOne({
        where: {
            id: req.params.measurmentId
        }
    })
    .then(function(measurement){
        if(!measurement || !measurement.status_survey_id){
           throw new Error('No status survey data found for MeasurementMonitor ' + measurement.id);
        }
        return models.StatusSurvey.findOne({
            where: {
                id: measurement.status_survey_id
            },
            include: [models.StatusSurveyQuestion]
        });
    })
    .then(function(result){
        var instructions = result ? result.survey_instructions : [];
        var questions = result.StatusSurveyQuestions || [];
        _.forEach(questions, function(question, index){
            questions[index] = SurveyDto.marshal(question);
        });
        return res.json({
            instructions: JSON.parse(instructions),
            questions: questions
        });
    })
    .catch(function(err){
        logger.error(err);
        return res.status(500).end();
    });
});

module.exports = router;
