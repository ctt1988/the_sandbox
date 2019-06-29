'use strict';

var expect = require('chai').expect;
var adapter = require('../../../server/api/service/drivers/misfit/adapter');

describe('Service: Misfit works if ', function(){

    it('its adapter exists', function(){
        expect(adapter).to.be.ok;
    });

    it('can parse Sleep data', function(){
        var sleepData = [{
            'sleeps': [
                {
                    'id': '51a4189acf12e53f80000003',
                    'autoDetected': false,
                    'startTime': '2014-05-19T23:26:54+07:00',
                    'duration': 3600,
                    'sleepDetails': [
                        {
                            'datetime': '2014-05-19T23:26:54+07:00',
                            'value': 2
                        },
                        {
                            'datetime': '2014-05-19T23:59:22+07:00',
                            'value': 1
                        }
                    ]
                },
                {
                    'id': '51a4189acf12e53f80000003',
                    'autoDetected': false,
                    'startTime': '2015-12-29T23:26:54+07:00',
                    'duration': 7200,
                    'sleepDetails': [
                        {
                            'datetime': '2014-05-19T23:26:54+07:00',
                            'value': 2
                        },
                        {
                            'datetime': '2014-05-19T23:59:22+07:00',
                            'value': 1
                        }
                    ]
                },
                {
                    'id': '51a4189acf12e53f80000003',
                    'autoDetected': false,
                    'startTime': '2015-12-29T23:26:54+07:00',
                    'duration': 10800,
                    'sleepDetails': [
                        {
                            'datetime': '2014-05-19T23:26:54+07:00',
                            'value': 2
                        },
                        {
                            'datetime': '2014-05-19T23:59:22+07:00',
                            'value': 1
                        }
                    ]
                }
            ]}];
            var sleep = adapter.parseAll( sleepData, 10);
            expect(sleep.Sleep).not.to.be.null;
            expect(sleep.Sleep['29 Dec 2015']).to.eql(5);
            expect(sleep.Sleep['19 May 2014']).to.eql(1);
        });

        it('can parse Steps data', function(){
            var stepData = [{
                summary: [
                    {
                        date: '2015-12-29',
                        points: 210.8,
                        steps: 1200,
                        calories: 25.7325,
                        activityCalories: 10.5,
                        distance: 0.5125
                    },
                    {
                        date: '2015-12-29',
                        points: 210.8,
                        steps: 1200,
                        calories: 25.7325,
                        activityCalories: 10.5,
                        distance: 0.5125
                    },
                    {
                        date: '2014-05-19',
                        points: 210.8,
                        steps: 4000,
                        calories: 25.7325,
                        activityCalories: 10.5,
                        distance: 0.5125
                    }
                ]
            }];

            var parsedData = adapter.parseAll( stepData, 10);
            expect(parsedData.Steps).not.to.be.null;
            expect(parsedData.Steps['29 Dec 2015']).to.eql(2400);
            expect(parsedData.Steps['19 May 2014']).to.eql(4000);
        });
    });
