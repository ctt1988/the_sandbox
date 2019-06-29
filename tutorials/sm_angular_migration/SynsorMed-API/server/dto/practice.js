'use strict';

var Q = require('q');
var logger = require('logger');

module.exports = {
    marshal: function (practiceModel) {
        return Q.spread([
            practiceModel.getSurveyQuestions(),
            practiceModel.getOrganizationPreferences(),
            practiceModel.getOrganizationLeaderboard()
        ], function (surveyQuestions, preferences, leaderBoard) {
            var obj = {
                id: practiceModel.id,
                name: practiceModel.name,
                isActive: practiceModel.is_active,
                surveyQuestions: surveyQuestions.map(function (q) {
                    return {
                        id: q.id,
                        text: q.text
                    };
                })
            };
            preferences.forEach(function (p) {
                obj[p.key] = p.value;
            });

            if(obj.defaultFee) obj.defaultFee = parseFloat(obj.defaultFee);
            obj.isLeaderboardActive = leaderBoard ? !!leaderBoard.isLeaderboardActive : false;

            return obj;
        })
        .catch(function () {
            logger.error(arguments);
        });
    },
    unmarshal: function (rawData) {
        return rawData;
    }
};
