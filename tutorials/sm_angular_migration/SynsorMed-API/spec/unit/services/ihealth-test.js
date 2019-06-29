'use strict';

var expect = require('chai').expect;
var ihealth = require('../../../server/api/service/drivers/ihealth');
var adapter = require('../../../server/api/service/drivers/ihealth/adapter');

describe('Service: iHealth works if ', function(){
    var activityData = {
        'ARDataList': [
            {
                'Calories': 109,
                'DataID': 'e34032089471451b926a6a4',
                'DistanceTraveled': 0.36088,
                'Lat': 19.579758571265153,
                'Lon': 86.49735491466585,
                'MDate': 1462403523, //5 May 2016
                'Note': '',
                'Steps': 1,
                'TimeZone': '0000'
            },
            {
                'Calories': 109,
                'DataID': 'e34032089471451b926a6a5',
                'DistanceTraveled': 0.38008,
                'Lat': 19.579758571265153,
                'Lon': 86.49735491466585,
                'MDate': 1462483523, //6 May 2016
                'Note': '',
                'Steps': 2,
                'TimeZone': '0000'
            },
            {
                'Calories': 101,
                'DataID': 'e34032089471451b926a6a6',
                'DistanceTraveled': 0.31008,
                'Lat': 19.579758571265153,
                'Lon': 86.49735491466585,
                'MDate': 1462483523, //6 May 2016
                'Note': '',
                'Steps': 3,
                'TimeZone': '0000'
            }
        ],
        'CurrentRecordCount': 50,
        'DistanceUnit': 0,
        'PageLength': 50,
        'PageNumber': 1,
        'PrevPageUrl': '',
        'RecordCount': 3
    };

    it('It exists', function(){
        expect(ihealth).to.be.ok;
        expect(adapter).to.be.ok;
    });

    it('It can parse activity data', function(){
        var parsedData = adapter.parse(null, null, null, null, null, activityData);
        expect(parsedData.Steps).not.to.be.null;
        expect(parsedData.Steps['6 May 2016']).to.eql(5);
        expect(parsedData.Steps['5 May 2016']).to.eql(1);
    });

});
