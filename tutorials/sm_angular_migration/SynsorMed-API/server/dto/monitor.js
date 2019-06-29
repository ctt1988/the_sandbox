'use strict';

var Q = require('q');
var _ = require('lodash');
var logger = require('logger');
var models = require('models');
var eventModel = models.Event;
var oauthModel = models.OauthMonitorToken;
var notificationsModel = models.Notifications;
var locationModel = models.GpsLocation;
var OrganizationModel = models.Organization;
var StatusSurveyQuestionModel = models.StatusSurveyQuestion;
var isOnline = require('../rules/isOnline');

var mapMeasurementsName = function(measurements) {
    var nameArray = [];
    if(measurements){
        measurements.forEach(function(val){
            if(val.Measurement)
            nameArray.push(_.capitalize(val.Measurement.display_name || val.Measurement.name));
        });
    }
    nameArray = _.uniq(nameArray);
    return nameArray;
};

module.exports = {
    marshal: function (monitorModel) {
        var measurements, user, lastSync, events, location, patient, canSendNotification, oauthMonitorData, serial_number, notificationData, notificationTrackData, quesLength;
        var totalChoice = 0;
        var surveyColor = '#808080'
        return Q.all([
            monitorModel.getUser({
                include: [{
                    require: true,
                    model: OrganizationModel,
                    include: [models.OrganizationLeaderboard]
                }]
            }),
            monitorModel.getMeasurementMaps(),
            monitorModel.getLastSyncTime(),
            eventModel.findAll({
                where: {
                    object_id: monitorModel.id,
                    object_type: 'monitor',
                    type: 'document_read'
                }
            }),
            locationModel.findOne({
                where: {
                    object_id: monitorModel.id,
                    object_type: 'monitor'
                }
            }),
            monitorModel.getPatient(),
            models.Device.getMonitorData(monitorModel.id),
            oauthModel.findOne({
              where: {
                  monitor_id: monitorModel.id,
                  service_name:{$eq: "survey"}
              }
            }),
            notificationsModel.find({
              where: {monitor_id: monitorModel.id}
            })
        ])
        .then(function(data){
            user = data[0];
            measurements = data[1];
            lastSync = data[2];
            events = data[3];
            location = data[4] ? JSON.parse(data[4].object_data) : null;
            patient = data[5] || null;
            canSendNotification = !!data[6];
            oauthMonitorData = data[7];
            notificationData = data[8];
            measurements.forEach(function(measurementMap){
              if(measurementMap && measurementMap.status_survey_id){
                models.StatusSurvey.findOne({
                    where: {
                        id: measurementMap.status_survey_id
                    },
                    include: [models.StatusSurveyQuestion]
                })
                .then(function(result){
                    quesLength = result.StatusSurveyQuestions.length;
                    if(quesLength){
                      if(oauthMonitorData && oauthMonitorData.oauth_data){
                        var oauthData =  oauthMonitorData.oauth_data;
                        var oauth_data = JSON.parse(oauthData);
                        if(oauth_data && oauth_data.status){
                          var choice;
                          for(var i=1;i<=quesLength;i++){
                             choice = oauth_data.status[oauth_data.status.length - i].choice;
                             totalChoice += parseInt(choice);
                          }
                          if(totalChoice >= 0 &&  totalChoice <= 12){
                            surveyColor = '#00ABA2'
                          }
                          else if(totalChoice >= 13 &&  totalChoice <= 16){
                            surveyColor = '#FF9F33'
                          }
                          else if(totalChoice >= 18){
                            surveyColor = '#F05F3A'
                          }
                        }
                      }
                    }
                });
              }
            });

            if(user && user.Organization && user.Organization.id){
              return monitorModel.getDocuments(measurements, user.Organization.id);
            }
        })
        .then(function(records){
            var monitorEducation = monitorModel.educationInfo(records, events);
            var isLeaderboardActive = user && user.Organization && user.Organization.OrganizationLeaderboard ?
                                      user.Organization.OrganizationLeaderboard.isLeaderboardActive :
                                      false;

            return {
                id: monitorModel.id,
                patientCode: monitorModel.patient_code,
                description: monitorModel.description,
                createdAt: monitorModel.created_at,
                providerId: monitorModel.provider_id,
                providersId: JSON.parse(monitorModel.providers_id),
                encounterId: monitorModel.encounter_id,
                termsAccepted: monitorModel.terms_accepted,
                autoFetch: monitorModel.auto_fetch,
                notify: monitorModel.notify,
                orgId: user && user.org_id ? user.org_id : null,
                patientId: monitorModel.patient_id,
                patientName:  patient ? patient.getName() : null,
                patientEmail: patient ? patient.email : null,
                patientPhone: patient ? patient.mobile_number : null,
                patientAddress: patient ? patient.address : null,
                patientCity: patient ? patient.city : null,
                patientState: patient ? patient.state : null,
                providerName: user && user.name ? user.name : null,
                phoneNumber: user && user.phone_mobile ? user.phone_mobile : null,
                email: user && user.email ? user.email : null,
                practiceId: user && user.Organization && user.Organization.id ? user.Organization.id : null,
                practiceName: user && user.Organization && user.Organization.name ? user.Organization.name : null,
                isOutofBound: monitorModel.isOutofBounds(measurements),
                isAlarMed: monitorModel.isAlarMed(measurements),
                isMissed: monitorModel.isMissed(measurements),
                appointmentMeta: monitorModel.appointment_meta ? JSON.parse(monitorModel.appointment_meta) : null,
                measurementName: mapMeasurementsName(measurements),
                sensitivity: _.get(measurements, '[0].sensitivity', 2),
                serialNumber: serial_number ? serial_number : 'N/A',
                //need for mobile app auth
                isMonitor: true,
                /** backward app compatibility **/
                code: monitorModel.patient_code,
                reportingEmails: monitorModel.reporting_emails,
                medicationReminder: monitorModel.medication_reminder,
                medication: monitorModel.medication,
                notifyRequested: monitorModel.notify_requested,
                educationChecked: monitorModel.education_checked,
                isConnected: monitorModel.isConnected(measurements),
                lastSync: lastSync,
                startDate: monitorModel.start_date,
                isEduMissed: monitorEducation.status,
                eduSeverity: monitorEducation.severity,
                bioSeverity: monitorModel.bioMissedSeverity(measurements),
                location: location,
                allowNotifications: canSendNotification,
                isLeaderboardActive: isLeaderboardActive,
                isEnrolled: isLeaderboardActive && monitorModel.isEnrolled(measurements),
                note: monitorModel.note ? JSON.parse(monitorModel.note) : null,
                online: isOnline(monitorModel.last_activity),
                isCCM: monitorModel.note ? 1 : null,
                failed_trials:monitorModel.failed_trials,
                deleted_at: monitorModel.deleted_at,
                notificationId: notificationData ? notificationData.id : null,
                notificationMonitorId: notificationData ? notificationData.monitor_id : null,
                notificationRead : notificationData ? JSON.parse(notificationData.read_by) : null,
                surveyColor: surveyColor
            };
        })
        .catch(function(e){
            logger.error(e);
        });
    },
    unmarshal: function (rawData) {
        var monitorData = {
            id: rawData.id,
            description: rawData.description,
            provider_id: rawData.providerId,
            providers_id: JSON.stringify(rawData.providersId),
            terms_accepted: rawData.termsAccepted,
            auto_fetch: rawData.autoFetch,
            notify: rawData.notify,
            reporting_emails: rawData.reportingEmails,
            medication_reminder: rawData.medicationReminder,
            notify_requested: rawData.notifyRequested,
            education_checked: rawData.educationChecked,
            medication: rawData.medication,
            patient_id : rawData.patientId ? rawData.patientId : null,
            start_date: rawData.startDate ? rawData.startDate : null,
            note: rawData.note ? JSON.stringify(rawData.note) : null,
            is_ccm: rawData.note ? 1 : 0
        };
        return monitorData;
    }
};
