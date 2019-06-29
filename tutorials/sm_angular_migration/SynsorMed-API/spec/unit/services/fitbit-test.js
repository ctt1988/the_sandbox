'use strict';

var expect = require('chai').expect;
var fitbit = require('../../../server/api/service/drivers/fitbit');
var adapter = require('../../../server/api/service/drivers/fitbit/adapter');

describe('Serivce: Fitbit works if ', function(){

    var allData = [
        { user:
            { age: 23,
                avatar: 'https://static0.fitbit.com/images/profile/defaultProfile_100_male.gif',
                avatar150: 'https://static0.fitbit.com/images/profile/defaultProfile_150_male.gif',
                averageDailySteps: 0,
                corporate: false,
                dateOfBirth: '1992-10-13',
                displayName: 'Mansa',
                distanceUnit: 'en_US',
                encodedId: '38JV7D',
                features: [Object],
                fullName: 'Mansa',
                gender: 'NA',
                glucoseUnit: 'METRIC',
                height: 188,
                heightUnit: 'en_US',
                locale: 'en_US',
                memberSince: '2015-02-24',
                offsetFromUTCMillis: 19800000,
                startDayOfWeek: 'SUNDAY',
                strideLengthRunning: 100.2,
                strideLengthRunningType: 'default',
                strideLengthWalking: 77.60000000000001,
                strideLengthWalkingType: 'default',
                timezone: 'Asia/Colombo',
                topBadges: [],
                weight: 77.1,
                weightUnit: 'en_US'
            }
        },
        { 'activities-steps':
           [
              { dateTime: '2016-04-03', value: '5000' },
              { dateTime: '2016-04-04', value: '6669' },
              { dateTime: '2016-04-05', value: '6000' },
              { dateTime: '2016-04-06', value: '7000' },
              { dateTime: '2016-04-07', value: '5000' }
           ]
        },
        { 'sleep-timeInBed':
          [
             { dateTime: '2016-04-05', value: '1' },
             { dateTime: '2016-04-06', value: '2' },
             { dateTime: '2016-04-07', value: '0.89' },
             { dateTime: '2016-04-08', value: '5' },
             { dateTime: '2016-04-09', value: '7' }
          ]
        },
        { weight:
            [
                {
                    bmi: 13.86,
                    date: '2016-04-09',
                    logId: 1460246399000,
                    source: 'Web',
                    time: '23:59:59',
                    weight: 48.9
                },
                {
                     bmi: 13.73,
                     date: '2016-04-10',
                     logId: 1460332799000,
                     source: 'Web',
                     time: '23:59:59',
                     weight: 48.5
                }
            ]
        }
    ];

        it('It exists', function(){
            expect(fitbit).to.be.ok;
            expect(adapter).to.be.ok;
        });

        it('It can parse fitbit data', function(){
            var parsedData = adapter.parseAll(allData, 3);
            expect(parsedData).to.be.ok;
            expect(parsedData.Sleep['9 Apr 2016']).to.eql(0.12);
            expect(parsedData['Weight (lbs)']['10 Apr 2016 23:59:59']).to.eql(106.92);
            expect(parsedData.Steps['7 Apr 2016']).to.eql('5000');
        });

});
