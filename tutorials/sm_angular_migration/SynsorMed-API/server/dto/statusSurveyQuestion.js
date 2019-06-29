'use strict';

module.exports = {
    marshal: function(StatusSurveyQuestion){
        return {
            id: StatusSurveyQuestion.id,
            text: StatusSurveyQuestion.text,
            choices: JSON.parse(StatusSurveyQuestion.choices)
        };
    },
    unmarshal: function(rawData){
        return rawData;
    }
};
