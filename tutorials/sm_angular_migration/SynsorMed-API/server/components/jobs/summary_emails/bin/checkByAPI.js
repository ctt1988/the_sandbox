'use strict';

var _ = require('lodash');
var Q = require('q');
var models = require('models');
var logger = require('logger');
var sendEmail = require('../../../../emails');
var OrganizationPreferenceModel = require('models').OrganizationPreference;

module.exports = function(fullData){
console.log("*** During summary email task, the fullData is: " + JSON.stringify(fullData));

var defer = Q.defer();

_.forEach(fullData,function(org,index){

	 var orgEmails = org.orgEmails.split(',');
	 var highRiskPatientList = org.highRisk;
	 var surveyNotGivenList = org.surveyNotGiven;
	 _.forEach(orgEmails,function(email,ind){
	 	sendEmail.sendSummaryEmail(highRiskPatientList, surveyNotGivenList, email);
	 });

});

defer.resolve();

return defer.promise;


};
