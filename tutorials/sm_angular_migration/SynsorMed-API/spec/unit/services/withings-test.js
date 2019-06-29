'use strict';

var expect = require('chai').expect;
var withings = require('../../../server/api/service/drivers/withings');
var adapter = require('../../../server/api/service/drivers/withings/adapter');

describe('Service: Withings works if', function(){
    var activityData = {
        'activities': [
            {
                'date': '2013-10-06',
                'steps': 10233,
                'distance': 7439.44,
                'calories': 530.79,
                'elevation': 808.24,
                'soft': 9240,
                'moderate': 960,
                'intense': 0,
                'timezone':'Europe/Berlin'
            },
            {
                'date': '2013-10-07',
                'steps': 6027,
                'distance': 5015.6,
                'calories': 351.71,
                'elevation': 153.82,
                'soft': 17580,
                'moderate': 1860,
                'timezone':'Europe/Berlin'
            },
            {
                'date': '2013-10-08',
                'steps': 2552,
                'distance': 2127.73,
                'calories': 164.25,
                'elevation': 33.68,
                'soft': 5880,
                'moderate': 1080,
                'intense': 540,
                'timezone':'Europe/Berlin'
            }
        ]
    };
    it('exists', function(){
        expect(withings).to.be.ok;
        expect(adapter).to.be.ok;
    });
    it('Function: parse works', function(){
        var parsedData = adapter.parse(null, activityData);
        expect(parsedData.Steps).not.to.be.null;
        expect(parsedData.Steps['2013-10-06']).to.eql(10233);
        expect(parsedData.Steps['2013-10-07']).to.eql(6027);
        expect(parsedData.Steps['2013-10-08']).to.eql(2552);
    });
});
