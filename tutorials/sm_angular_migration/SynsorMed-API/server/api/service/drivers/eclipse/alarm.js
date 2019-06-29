'use strict';
var _ = require('lodash');

var basicCodes = [
    {code: '0100', name: 'Warning'},
    {code: '0001', name: 'Warning'},
    {code: '0008', name: 'Low Oxygen Levels'},
    {code: '0020', name: 'Flow Out of Range'},
    {code: '0040', name: 'Warning'},
    {code: '0080', name: 'Fail Circuit Board'},
    {code: '0081', name: 'Fail Circuit Board'},
    {code: '0082', name: 'Fail Circuit Board'},
    {code: '0083', name: 'Fail Circuit Board'},
    {code: '0084', name: 'Fail Circuit Board'},
    {code: '0090', name: 'Fail Circuit Board'},
    {code: '0091', name: 'Malfunction'},
    {code: '0092', name: 'Malfunction'},
    {code: '0094', name: 'Malfunction'},
    {code: '0095', name: 'Malfunction'},
    {code: '00A0', name: 'Fail Circuit Board'},
    {code: '00A1', name: 'Fail Circuit Board'},
    {code: '00A2', name: 'Fail Circuit Board'},
    {code: '00A3', name: 'Fail Circuit Board'},
    {code: '00A4', name: 'Fail Circuit Board'},
    {code: '00A5', name: 'Malfunction'},
    {code: '00A6', name: 'Fail Circuit Board'},
    {code: '00A7', name: 'Fail Circuit Board'},
    {code: '00A8', name: 'Fail Circuit Board'},
    {code: '00A9', name: 'Fail Circuit Board'},
    {code: '00AA', name: 'Fail Circuit Board'},
    {code: '00AB', name: 'Fail Circuit Board'}
];

var updateResponse = function(basicKey, basicRecord, response){
    _.forEach(basicCodes, function(basicRecordcp){
        var basicKeycp = parseInt(basicRecordcp.code);
        if(basicKey != basicKeycp){
            var dataKey = ('0000' + (basicKey + basicKeycp)).slice(-6);
            var dataRecord = {};
            dataRecord [basicRecord.name] = 1;
            dataRecord [basicRecordcp.name] = 1;
            response[dataKey] = dataRecord;
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
        response[basicRecord.code] = currentRecord;
        response = updateResponse(basicKey, basicRecord, response);
    });
    response['0000'] = {'Cleared': 1}; // cleared alarm
    return response;
};

module.exports.getFromCode = function(alarmCode){
    var possibelCodes = getAllCodes();
    if(possibelCodes[alarmCode]) return possibelCodes[alarmCode];
    else return {};
};
