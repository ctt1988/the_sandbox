'use strict';

var _ = require('lodash');
var models = require('models');
var units = require('../base/units');
var moment = require('moment');

var getQuestion = function(questions, questionId){
    var text = false;
    var options = [];
    _.forEach(questions, function(question){
         if(question.id == questionId){
            text = question.text;
            options = question.getOptions();
         }
    });
    return {text: text, options: options};
};

module.exports = function(data, fetchDays, startDate, endDate){
    var qIds = _.map(data, function(record){
        return record.questionId;
    });

    data = data.reverse();

    return models.StatusSurveyQuestion.findAll({
        where:{
            id: {
                $in: qIds
            }
        }
    })
    .then(function(questions){
        var days = [];
        var returns = {};
        if (startDate && !endDate) endDate = new Date();

        _.forEach(data, function(record){
            var tmpKey = units.getFormattedDate(record['endDate']);
            var question = getQuestion(questions, record.questionId);
            if(!question) return;
            if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
            if (fetchDays && !startDate && moment().subtract(fetchDays, 'days').isAfter(record['endDate'])) {
              return;
            }

            if (startDate && endDate && (moment(record.endDate).isBefore(startDate) || moment(record.endDate).isAfter(endDate))) {
              return;
            }
            returns[units.getFormattedDateTimeMilli(record['endDate'])]= {
                questionId: record.questionId,
                question: question.text,
                options: question.options,
                choice: record.choice
            };
        });
        return returns;
    });
};
