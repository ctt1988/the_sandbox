'use strict';

module.exports.marshal = function(patientStatusModel){
   return {
       id: patientStatusModel.id,
       surveyName: patientStatusModel.survey_name,
       displayName: patientStatusModel.display_name,
       instructions: patientStatusModel.survey_instructions ? patientStatusModel.survey_instructions : null
   };
};

module.exports.unmarshal = function(rawData){
  return rawData;
};
