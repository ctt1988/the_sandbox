'use strict';
var _ = require('lodash');

var basicCodes = [
    {code: '000001', name: 'EEPROM'},
    {code: '000004', name: 'Under 70'},
    {code: '000008', name: 'Under 85'},
    {code: '000020', name: 'Low Flow Rate'},
    {code: '000040', name: 'High Flow Rate'},
    {code: '000080', name: 'Ambient Pressure'}
];

var updateResponse = function(basicKey, basicRecord, response){
    _.forEach(basicCodes, function(basicRecordcp){
        var basicKeycp = parseInt(basicRecordcp.code);
        if(basicKey != basicKeycp){
            var dataKey = ('000000' + (basicKey + basicKeycp)).slice(-6);
            var dataRecord = {};
            dataRecord [basicRecord.name] = 1;
            dataRecord [basicRecordcp.name] = 1;
            response[parseInt(dataKey)] = dataRecord;
        }
    });
    return response;
};

var getAllCodes = function(){
    var response = {};
    _.forEach(basicCodes, function(basicRecord){
        var basicKey = parseInt(basicRecord.code);
        var currentRecord = {};
        currentRecord[basicRecord.name] = 1;
        response[parseInt(basicRecord.code)] = currentRecord;
        response = updateResponse(basicKey, basicRecord, response);
    });
    response['00'] = {'Cleared': 1}; // cleared alarm
    return response;
};

module.exports.getFromCode = function(alarmCode){
    var possibelCodes = getAllCodes();
    alarmCode = alarmCode == '000000' ? '00' : alarmCode;  //This was inserted to cover the case of C5 firmware differences where sometimes cleared=000000 or 00
    if(alarmCode == '00' && possibelCodes[alarmCode]) return possibelCodes[alarmCode];
    else if(alarmCode != '00' && possibelCodes[parseInt(alarmCode)]) return possibelCodes[parseInt(alarmCode)];
    else return {};
};
