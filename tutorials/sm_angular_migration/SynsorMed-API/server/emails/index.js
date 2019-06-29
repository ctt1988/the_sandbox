'use strict';

//get the mailer object
var nodemailer = require('nodemailer');
var config = require('config');
var moment = require('moment');
var Q = require('q');
var logger = require('logger');
var fs = require('fs');
var sms = require('../components/sms');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(config.get('email.nodemailer'));

// Boolean | mockEmails  , check whether email has to send or not
var mockEmails = config.get('email.mock');

// setup e-mail data
var getmailOptions = function(){
    return {
        from: config.get('email.admin.identity'),
        to: null,
        subject: 'SynsorMed',
        html: null
    };
};

/**
 * @param  String  ,@fileName , name of file from which content would be fetched.
 * @param  boolean ,@isMobileNumber, according to it template will be selected.
 * @return String  , file name
 */
var getSourceFile = function(fileName, isMobileNumber){
   if(!fileName) return;
   return __dirname + (isMobileNumber ? '/sms/' + fileName + '.txt' : '/' +fileName +'.html');
};
var sendEmail = function(options){
    var deferred = Q.defer();
    if(!mockEmails){
        transporter.sendMail(options, function(err, results){
            if(err){
                logger.error('Email failed for : ' + options.to + ' at ' + new Date());
                logger.debug('Error was ' + err);
                deferred.reject(err);
            } else {
                logger.debug('Email sent to : ' + options.to + ' at ' + new Date());
                deferred.resolve(results);
            }
        });
    } else {
        logger.debug('Mock Email sent to : ' + options.to + ' at ' + new Date());
        deferred.resolve(true);
    }
    return deferred.promise;
};


exports.sendAlarmChangeMail = function(email, patientCode, description, visitDate, alarms){
  var isMobileNumber = sms.mailIsANumber(email);
  var newAlarms = null;

  alarms.forEach(function(alarm){
       var keys = Object.keys(alarm.value);
       keys.forEach(function(key){
           newAlarms = newAlarms ? newAlarms + ' and ' + key : key;
       });
  });

  var opts = getmailOptions();
      opts.to = email;
      opts.subject = 'SynsorMed - Alarm Changed';

  var streamSourceFile = getSourceFile('alarmchanged', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', patientCode);
      stream = stream.replace('zzzDetailszzz', description);
      stream = stream.replace('zzzDatezzz', moment(visitDate).format('D MMM YYYY').toString());
      stream = stream.replace('zzzNewAlarmzzz', newAlarms);
      if(isMobileNumber) opts.text = stream;
      else opts.html = stream;

   return sendEmail(opts);
};


/**
* Encounter Details Email
*
* @param encounter | object , @patient_code,reason,scheduled_start    , encounter object for which mail is sent
* @param String    | Email , @to                                      , email address of receiver
*
* @return Promise
*/
exports.sendEncounterEmail = function(encounter, email){
  var visitDate = moment(encounter.scheduled_start).format('D MMM YYYY : H:m:s').toString();
  var isMobileNumber = sms.mailIsANumber(email);
  var opts = getmailOptions();
      opts.to = email;
      opts.subject = 'SynsorMed - New Visit Code';
  var streamSourceFile = getSourceFile('encounter', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', encounter.patient_code);
      stream = stream.replace('zzzReasonzzz', encounter.reason_for_visit);
      stream = stream.replace('zzzDatezzz', visitDate);

      if(isMobileNumber){
         opts.text = stream;
      }
      else{
         opts.html = stream;
      }
   return sendEmail(opts);
};


/**
* Moniter Details Email
*
* @param monitor | object , @patient_code,description,created_at     , monitor object for which mail is sent
* @param String  | Email  , @to                                      , email address of receiver
*
* @return Promise
*/
exports.sendMonitorEmail = function(monitor, email){
  var visitDate = moment(monitor.created_at).format('D MMM YYYY : H:m:s').toString();
  var isMobileNumber = sms.mailIsANumber(email);
  var opts = getmailOptions();
      opts.to = email;
      opts.subject = 'SynsorMed - New Monitor Code';
  var streamSourceFile = getSourceFile('monitor', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', monitor.patient_code);
      stream = stream.replace('zzzDescriptionzzz', monitor.description);
      stream = stream.replace('zzzDatezzz', visitDate);

      if(isMobileNumber){
         opts.text = stream;
      }
      else{
         opts.html = stream;
      }
  return sendEmail(opts);
};


/**
* Missed Monitor Email
*
* @param String      | Email   , @to          , email address of provider
* @param String                , @monitorCode , unique code attached with monitor
* @param Date        | String  , @dated       , date when monitor was scheduled to record
* @param Boolean               , @extDate     , boolean for showing timestamp with date or not.
* @param String                , @description , description attached with monitor
*
* @return Promise
*/
exports.sendMissedMonitorMail = function(to, monitorCode, dated, extDate, description){
  var details = description ? description  : '';
  var date = extDate ? moment(dated).format('D MMM YYYY hh a').toString() : moment(dated).format('D MMM YYYY').toString();
  var isMobileNumber = sms.mailIsANumber(to);
  var opts = getmailOptions();
      opts.to = to;
      opts.subject = 'SynsorMed - Missed Survey';
  var streamSourceFile = getSourceFile('missedreading', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', monitorCode);
      stream = stream.replace('zzzDatezzz', date);
      stream = stream.replace('zzzDetailszzz', details);
      if(isMobileNumber){
        opts.text = stream;
      }
      else{
        opts.html = stream;
      }
  return sendEmail(opts);
};


/**
* Out of Bound Monitor Email
* @param String      | Email    , @to          , email address of provider
* @param String                 , @monitorCode , unique code attached with monitor
* @param Date        | String   , @dated       , date when monitor reading was taken
* @param String                 , @description , description attached with monitor
* @return Promise
*/

exports.sendOverflowMonitorMail = function(to, monitorCode, dated, description, readingValue, readingUnit){
  var details = description ? description : '';
  var reading = readingValue + ' ' +(readingUnit || '');
  var isMobileNumber = sms.mailIsANumber(to);
  var opts = getmailOptions();
      opts.to = to;
      opts.subject = 'SynsorMed - Out of Range Reading';
  var streamSourceFile = getSourceFile('outofrange', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', monitorCode);
      stream = stream.replace('zzzDatezzz', moment(dated).format('D MMM YYYY hh a').toString());
      stream = stream.replace('zzzDetailszzz', details);
      stream = stream.replace('zzzReadingzzz', reading);
      if(isMobileNumber){
         opts.text = stream;
      }
      else{
         opts.html = stream;
      }
  return sendEmail(opts);
};


/**
* Send Raw Html Email
* @param String | Email   , @to     , email address of provider
* @param String           , @title  , title for the monitor
* @param Date   | String  , @html   , html to send
* @return Promise
*/
exports.sendRawMail = function(to, title, message){
  var isMobileNumber = sms.mailIsANumber(to);
  var opts = getmailOptions();
      opts.to = to;
      opts.subject = title;
      if(isMobileNumber){
         opts.text = message;
      }
      else{
         opts.html = message;
      }
  return sendEmail(opts);
};


/**
* Send Password Reset Email
* @param String | Email , @to     , email address
* @param String         , @hash   , hash to send to user
* @return Promise
*/
exports.sendForgotPasswordMail = function(to, hash){
  var opts = getmailOptions();
      opts.to = to;
      opts.subject = 'SynsorMed - Password Reset';
  var isMobileNumber = sms.mailIsANumber(to);
  var streamSourceFile = getSourceFile('forgotpassword', isMobileNumber);
  var stream = fs.readFileSync(streamSourceFile, 'utf8');
      stream = stream.replace('zzzCodezzz', hash);
      stream = stream.replace('zzzTimezzz', config.get('password_reset_code_expire'));
      if(isMobileNumber){
         opts.text = stream;
      }
      else{
         opts.html = stream;
      }
  return sendEmail(opts);
};


/**
 *Send Notification to provider
 * @param String | Email , @to     , email address
 * @param String, @patient_code , unique code attached with encounter
 */
 exports.sendProviderNotification = function(to, patient_code){
    var opts = getmailOptions();
    opts.to = to;
    opts.subject = 'SynsorMed Notification';
    var isMobileNumber = sms.mailIsANumber(to);
    var streamSourceFile = getSourceFile('notifyprovider', isMobileNumber);
    var htmlstream = fs.readFileSync(streamSourceFile, 'utf8');
    htmlstream = htmlstream.replace('zzzCodezzz', patient_code);
    if(isMobileNumber){
       opts.text = htmlstream;
    }
    else{
       opts.html = htmlstream;
    }
    return sendEmail(opts);
 };

 exports.sendLeaderboardWinnerNotification = function(to, code, description, measurement, startDate, endDate, points){
     var details = description ? description  : '';
     startDate = moment(startDate).format('D MMM YYYY').toString();
     endDate = moment(endDate).format('D MMM YYYY').toString();
     var isMobileNumber = sms.mailIsANumber(to);
     var opts = getmailOptions();
         opts.to = to;
         opts.subject = 'SynsorMed - Leaderboard winner';
     var streamSourceFile = getSourceFile('leaderboardwinner', isMobileNumber);
     var stream = fs.readFileSync(streamSourceFile, 'utf8');
         stream = stream.replace('zzzCodezzz', code);
         stream = stream.replace('zzzDetailszzz', details);
         stream = stream.replace('zzzMeasurementzzz', measurement);
         stream = stream.replace('zzzStartDatezzz', startDate);
         stream = stream.replace('zzzEndDatezzz', endDate);
         stream = stream.replace('zzzPointszzz', points);
         if(isMobileNumber){
           opts.text = stream;
         }
         else{
           opts.html = stream;
         }
     return sendEmail(opts);
 };


 /**
* Patient Summary Email
*
* @param Array | object , @patient_code of high risk
* @param Array | object , @patient_code of not given Status survey
* @param String  | Email  , @to                                      , email address of receiver
*
* @return Promise
*/
exports.sendSummaryEmail = function(highRiskPatientList, surveyNotGivenList, to){
    var opts = getmailOptions();
    opts.to = to;
    opts.subject = 'SynsorMed - Daily Patient Summary';
    var isMobileNumber = sms.mailIsANumber(to);
    var streamSourceFile = getSourceFile('summaryemail', isMobileNumber);
    var stream = fs.readFileSync(streamSourceFile, 'utf8');
    var surveyNotGivenData = '';
    if(!surveyNotGivenList || surveyNotGivenList.length == 0) {
      surveyNotGivenData = '<p style="margin: 0;font-size: 16px;line-height: 19px;text-align: center"><span style="color: rgb(7, 150, 139); font-size: 16px; line-height: 19px;">No Data Available</span></p>';
    }else{
      for(var i = 0; i<surveyNotGivenList.length; i++) {
        surveyNotGivenData = surveyNotGivenData + '<p style="margin: 0;font-size: 16px;line-height: 19px;text-align: center"><span style="color: rgb(7, 150, 139); font-size: 16px; line-height: 19px;">' + surveyNotGivenList[i] + '</span></p>';
      }
    }


    var highRiskPatientData = '';
    if(!highRiskPatientList || highRiskPatientList.length == 0) {
      highRiskPatientData = '<p style="margin: 0;font-size: 16px;line-height: 19px;text-align: center"><span style="color: rgb(219, 84, 57); font-size: 16px; line-height: 19px;">No Data Available</span></p>';
    }else{
      for(var i = 0; i < highRiskPatientList.length; i++) {
        highRiskPatientData = highRiskPatientData + '<p style="margin: 0;font-size: 16px;line-height: 19px;text-align: center"><span style="color: rgb(219, 84, 57); font-size: 16px; line-height: 19px;">' + highRiskPatientList[i] + '</span></p>';
      }
    }

        stream = stream.replace('zzzzHRPLzzzz',  highRiskPatientData);
        stream = stream.replace('zzzzSNGLzzzz',  surveyNotGivenData);
        stream = stream.replace('zzzzDATEzzzz', moment().format('MMMM Do YYYY'));
        if(isMobileNumber){
           opts.text = stream;
        }
        else{
           opts.html = stream;
        }
    return sendEmail(opts);
  };

  /**
  * Moniter Details Email
  *
  * @param String  | Email  , @to                                      , email address of receiver
  * @param String  | Name  , @to                                       , first name of receiver
  * @param String  | Organization  , @to                               , organization name of receiver
  *
  * @return Promise
  */
  exports.sendUserReminderEmail = function(email, firstName, orgName, totalMonitor){
    console.log(email+' '+firstName+' '+orgName+' '+totalMonitor );
    var isMobileNumber = sms.mailIsANumber(email);
    var opts = getmailOptions();
        opts.to = email;
        opts.subject = 'SynsorMed - Patient Review';
    var streamSourceFile = getSourceFile('userreminder', isMobileNumber);
    var stream = fs.readFileSync(streamSourceFile, 'utf8');
        stream = stream.replace('zzzNamezzz', firstName);
        stream = stream.replace('zzzOrgzzz', orgName);
        stream = stream.replace('zzzTotalmonitorszzz', totalMonitor);

        if(isMobileNumber){
           opts.text = stream;
        }
        else{
           opts.html = stream;
        }
    return sendEmail(opts);
  };
