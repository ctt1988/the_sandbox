'use strict';

var Q = require('q');
var helpers = require('./helpers');

var messages = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are doing very good.',
        'Hello '+ data.name +', Your readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your readings are missed for '+measurementName+' from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', Your readings are missed for '+measurementName+'. Login today for more details.',
        'Hi '+ data.name +', Where are you ? Your readings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range from last '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var stepsMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are doing very good. Keep it up.',
        'Hello '+ data.name +', Your readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your readings are missed for '+measurementName+' from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', Your readings are missed for '+measurementName+'. Login today for more details.',
        'Hi '+ data.name +', Where are you ? Your readings are missed from last '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range from '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var hearrateMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', Your '+measurementName+' readings are in the range. Its perfect.',
        'Hello '+ data.name +', Your '+measurementName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average reading is '+ data.average + ' for '+measurementName+'.'
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Login today for more info.',
        'Hello '+ data.name +', We did\'t found your '+measurementName+' reaadings from last some days. Please update your readings.',
        'Hi '+ data.name +', Where are you ? Your '+measurementName+' readings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range for '+measurementName+'. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your '+measurementName+' readings are out of range from '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var temperatureMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', Your body temperature reaadings are normal. All readings are in range.',
        'Hello '+ data.name +', Your body temperature is in the range and perfect.',
        'Hi '+ data.name +', Your average body temperature for last two weeks is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your body temperature readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', Your readings are missed for '+measurementName+'. Login today for more details.',
        'Hi '+ data.name +', Where are you ? Your body temperature adings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your body temperature reaadings are out of bound. Login on synsormed for more details.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range from last '+data.readings.length+' days. Please check on SynsorMed for more deatils.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var weightMsgs = function(data, measurmentName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are keep doing good for '+measurmentName+'.',
        'Hello '+ data.name +', Your '+measurmentName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing very good. Your average '+measurmentName+' is '+ data.average + '.'
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurmentName+' readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', Your '+measurmentName+' reading is missed for few days. Login for more info.',
        'Hi '+ data.name +', Where are you ? Your readings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurmentName+' readings are out of bound. Please try to keep your weight in range.',
        'Hello '+ data.name +', Your '+data.readings.length+' days  '+measurmentName+' reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your  '+measurmentName+' readings are out of range from '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var BPMsgs = function(data, measurmentName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', Your '+measurmentName+' readings are in range. Its too good for you.',
        'Hello '+ data.name +', Your '+measurmentName+ ' readings are continously in the range and perfect.',
        'Hi '+ data.name +', Its all going fine for '+measurmentName+'. Keep it up.'
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your readings are missed for '+measurmentName+' from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', We did\'t find your '+measurmentName+' readings for few days. Please login on SynsorMed for more info.',
        'Hi '+ data.name +', Where are you ? Your '+measurmentName+' readings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurmentName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days '+measurmentName+' reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your '+measurmentName+' readings are out of range from '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var glucoseMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', Your readings are normal for '+measurementName+'. Login on SynsorMed for more info.',
        'Hello '+ data.name +', Your readings are continously in the range and perfect. Its too good for you.',
        'Hi '+ data.name +', Your readings are in range. Your average reading is '+ data.average +'.'
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Login today for more info.',
        'Hello '+ data.name +', You have missed '+measurementName+' readings. Check it on SynsorMed.',
        'Hi '+ data.name +', Where are you ? Your readings was missed for '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your readings are out of bound for '+measurementName+'. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range for '+measurementName+'. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your '+measurementName+' readings are out of range from '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var sleepMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are doing very good for '+measurementName+'. Your all readings are in range.',
        'Hello '+ data.name +', Your '+measurementName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average '+measurementName+' reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', We did\'t find your '+measurementName+' readings from few days. Login today for more info.',
        'Hi '+ data.name +', Where are you ? Your readings is missed from last '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range for '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var oxygenFlowMsgs = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are doing very good for '+measurementName+'. Your all readings are in range.',
        'Hello '+ data.name +', Your '+measurementName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average '+measurementName+' reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', We did\'t find your '+measurementName+' readings from few days. Login today for more info.',
        'Hi '+ data.name +', Where are you ? Your readings is missed from last '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range for '+data.readings.length+' days. I think you will try to keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var breathMessages = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', Everything is going fine for your '+measurementName+' readings. Your all readings are in range.',
        'Hello '+ data.name +', Your '+measurementName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average '+measurementName+' reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', We did\'t got your '+measurementName+' readings from few days. Login today for more info.',
        'Hi '+ data.name +', Where are you ? Your readings is missed from last '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', We are getting out of range readings from last '+data.readings.length+' days for '+ measurementName +'. Please try to keep it in the range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

var caloricIntakeMessages = function(data, measurementName){
    var msgs ={};
    msgs.goodMessages = [
        'Hi '+ data.name +', You are doing great for '+measurementName+'. Your all readings are in range.',
        'Hello '+ data.name +', Your '+measurementName+' readings are continously in the range and perfect.',
        'Hi '+ data.name +', You are doing good. Your average '+measurementName+' reading is '+ data.average
    ];
    msgs.missedMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are missed from last few days. Come back on SynsorMed.',
        'Hello '+ data.name +', We did\'t find your '+measurementName+' readings from few days. Login today for more info.',
        'Hi '+ data.name +', Where are you ? Your readings is missed from last '+data.readings.length+' days. Keep it regular.'
    ];
    msgs.outOfBoundMsgs = [
        'Hi '+ data.name +', Your '+measurementName+' readings are out of bound. Please check it on synsormed.',
        'Hello '+ data.name +', Your '+data.readings.length+' days reading is out of range. You should keep it in '+data.lowerbound+' and '+data.upperbound+'.',
        'Hi '+ data.name +', Your readings are out of range from last '+data.readings.length+' days. Please keep it in range.'
    ];
    return data.messageOk ? msgs.goodMessages : (data.isOutOfBound ? msgs.outOfBoundMsgs : msgs.missedMsgs);
};

module.exports = function(data, measurementName){
    measurementName = measurementName.toLowerCase();
    var defer = Q.defer();
    var messageList;
    switch (measurementName) {
        case 'blood pressure':
              messageList = BPMsgs(data, measurementName);
        break;
        case 'glucose':
              messageList = glucoseMsgs(data, measurementName);
        break;
        case 'heartrate':
              messageList = hearrateMsgs(data, measurementName);
        break;
        case 'sleep':
              messageList = sleepMsgs(data, measurementName);
        break;
        case 'steps':
              messageList = stepsMsgs(data, measurementName);
        break;
        case 'temperature':
              messageList = temperatureMsgs(data, measurementName);
        break;
        case 'weight':
              messageList = weightMsgs(data, measurementName);
        break;
        case 'oxygen flow':
              messageList = oxygenFlowMsgs(data, measurementName);
        break;
        case 'caloric intake':
              messageList = caloricIntakeMessages(data, measurementName);
        break;
        case 'breath':
              messageList = breathMessages(data, measurementName);
        break;
        default:
              messageList = messages(data, measurementName);
    }
    var message = helpers.getRandomRecord(messageList);
    message ? defer.resolve(message) : defer.reject('no messages in message list');
    return defer.promise;
};
