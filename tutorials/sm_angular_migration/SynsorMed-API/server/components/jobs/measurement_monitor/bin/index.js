'use strict';

var mailer = require('../../../../emails');
var config = require('config');

module.exports.checkByAPI = require('./checkByAPI');
module.exports.sendMissedEmail = mailer.sendMissedMonitorMail;
module.exports.sendOutOfRangeEmail = mailer.sendOverflowMonitorMail;
module.exports.sendAlarmChangeMail = mailer.sendAlarmChangeMail;
module.exports.sendLeaderboardWinnerNotification = mailer.sendLeaderboardWinnerNotification;
module.exports.isAPIDataOutofBound = require('./isAPIDataOutofBound');
module.exports.updateAndReset = require('./updateAndReset');
module.exports.getReceiverEmails = require('./getReceiverEmails');
module.exports.setInfraction = require('./setInfraction');
module.exports.isAlarmChanged = require('./isAlarmChanged');
module.exports.oxygenAPI = require('./oxygenAPI');
module.exports.leaderboard = require('./leaderboard');
module.exports.surveyAlert = require('./surveyAlert');
module.exports.measurementIds = config.get('leaderboard.measurement_ids') || [];
