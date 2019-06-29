'use strict';

var Q = require('q');
var logger = require('logger');
var models = require('models');
var isOnline = require('../rules/isOnline');

module.exports = {
    marshal: function (encounterModel) {
        var user = null, surveyQuestions = null, payment = null;

        return encounterModel.getUser({ include: [models.Organization] })
        .then(function(userDetails){
            user = userDetails;
            return user.Organization.getSurveyQuestions();
        })
        .then(function(questions){
            surveyQuestions = questions;
            return encounterModel.getPayment();
        })
        .then(function(pay){
            payment = pay;
            return Q.all([
                models.RTCUser.find({ where: { id: encounterModel.rtc_user_id } }),
                models.GpsLocation.findOne({
                    where: {
                        object_id: encounterModel.id,
                        object_type: 'encounter'
                    }
                }),
                 encounterModel.getPatient(),
                 models.Device.getEncounterData(encounterModel.id)
            ]);
        })
        .then(function(data){
            var rtcuser = data [0];
            var location = data[1] ? JSON.parse(data[1].object_data) : null;
            var patient = data[2] ? data[2] : null;
            return {
                id: encounterModel.id,
                patientCode: encounterModel.patient_code,
                patientId: encounterModel.patient_id,
                patientName: patient ? patient.getName() : null,
                patientEmail: patient ? patient.email : null,
                patientPhone: patient ? patient.mobile_number : null,
                reasonForVisit: encounterModel.reason_for_visit,
                scheduledStartTime: encounterModel.scheduled_start,
                providerId: encounterModel.provider_id,
                providerName: user.name,
                practiceId: user.Organization.id,
                practiceName: user.Organization.name,
                fee: encounterModel.fee,
                paymentStatus: !payment ? 'NOT_PAID' : payment.charged ? 'PAID' : 'AUTHORIZED',
                paid: !!payment,
                termsAccepted: encounterModel.terms_accepted,
                surveyQuestions: surveyQuestions.map(function (q) {
                    return { id: q.id, text: q.text };
                }),
                note: encounterModel.note,
                callReady: encounterModel.call_ready,
                callCompleted: !!encounterModel.duration,
                callDuration: encounterModel.duration,
                callStarted: encounterModel.call_started,
                waitingTime: encounterModel.getWaitingTime(),
                callerId: !rtcuser ? 'NONE' : rtcuser.name,
                /* backwards compat */
                code: encounterModel.patient_code,
                /** if oauth secret keys available in this encounter **/
                oauthAvailable: !!encounterModel.service_name && !!encounterModel.oauth_data,
                isCCM: !!encounterModel.is_ccm,
                online: isOnline(encounterModel.last_activity),
                location: location,
                isEncounter: true,
                allowNotifications: !!data[3]
            };
        })
        .catch(function(err){
            console.log(err);
            logger.trace(err);
        });

    },
    unmarshal: function (rawData) {
        var encounterData = {
            id: rawData.id,
            patient_code: rawData.patientCode,
            reason_for_visit: rawData.reasonForVisit,
            scheduled_start: new Date(rawData.scheduledStartTime),
            terms_accepted: rawData.termsAccepted,
            provider_id: rawData.providerId,
            fee: rawData.fee,
            fee_paid: (rawData.paymentStatus == 'PAID' || rawData.paymentStatus == 'AUTHORIZED') ? true : false,
            note: rawData.note,
            is_ccm: rawData.isCCM,
            patient_id: rawData.patientId ? rawData.patientId : null
        };
        return encounterData;
    }
};
