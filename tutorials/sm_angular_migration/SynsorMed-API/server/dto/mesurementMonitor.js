'use strict';

var _ = require('lodash');
var Q = require('q');

module.exports = {
    marshal: function (measurementModel) {

        var deffered = Q.defer();
          var obj = measurementModel.toJSON();
          measurementModel
          .getAuthData()
          .then(function(data){
                  deffered.resolve({
                    id: obj.id,
                    measurementId: obj.measurement_id,
                    monitorId: obj.monitor_id,
                    upperbound: obj.upperbound,
                    lowerbound: obj.lowerbound,
                    sensitivity: obj.sensitivity,
                    repeatInterval: obj.repeat_within_seconds,
                    oauthAvailable: !!measurementModel.oauth_id,
                    serviceName: data ? _.capitalize(data.service_name) : null,
                    isOutOfBound: measurementModel.isOutofBounds(),
                    isMissed: measurementModel.isMissed(),
                    isAlarMed: measurementModel.isAlarMed(),
                    updated_at: obj.updated_at,
                    last_recorded: obj.last_recorded,
                    latest_reading: obj.latest_reading,
                    diseasesId : obj.diseases_id,
                    isEnrolled: obj.is_enrolled,
                    statusSurveyId: obj.status_survey_id,
                    isEducationChecked : obj.is_education
                });
          })
          .catch(function(err){
              deffered.reject(err);
          });

         return deffered.promise;
    },
    unmarshal: function (rawData) {

        return {
            id : rawData.id,
            measurement_id: rawData.measurementId,
            monitor_id: rawData.monitorId,
            upperbound: rawData.upperbound,
            lowerbound: rawData.lowerbound,
            repeat_within_seconds: rawData.repeatInterval,
            sensitivity: rawData.sensitivity,
            diseases_id: rawData.diseasesId || null,
            is_enrolled: !!rawData.isEnrolled,
            status_survey_id: rawData.statusSurveyId || null,
            is_education: !!rawData.isEducationChecked
        };
    }
};
