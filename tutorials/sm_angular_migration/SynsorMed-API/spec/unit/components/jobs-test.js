'use strict';

var moment = require('moment');
var expect = require('chai').expect;
var measurementMonitorHelper = require('../../../server/components/jobs/measurement_monitor/bin/helpers');
var isApiDataOutofBound = require('../../../server/components/jobs/measurement_monitor/bin/isAPIDataOutofBound');

describe('Component: Job works if', function(){

    describe('Module: helpers work if', function(){
        it('exists', function(){
            expect(measurementMonitorHelper).to.be.ok;
        });

        it('Function: removeFractionalZero works', function(){
            expect(measurementMonitorHelper.removeFractionalZero()).to.be.false;
            expect(measurementMonitorHelper.removeFractionalZero(null)).to.be.false;
            expect(measurementMonitorHelper.removeFractionalZero('abdcef')).to.be.false;
            expect(measurementMonitorHelper.removeFractionalZero(-123.45)).not.to.be.false;
            expect(measurementMonitorHelper.removeFractionalZero('123.45')).to.eql('123.45');
            expect(measurementMonitorHelper.removeFractionalZero('123.00')).to.eql(123);
            expect(measurementMonitorHelper.removeFractionalZero(127.000)).to.eql(127);
            expect(measurementMonitorHelper.removeFractionalZero(127.456)).to.eql(127.456);
        });

        it('Function: getRangeReadings works', function(){
            var readingObj = {};
            readingObj[moment().subtract('1', 'minutes').format('D MMM YYYY HH:mm:ss').toString()] = '70';
            readingObj[moment().subtract('1', 'days').format('D MMM YYYY HH:mm:ss').toString()] = '65';
            readingObj[moment().subtract('2', 'days').format('D MMM YYYY HH:mm:ss').toString()] = '80';
            expect(measurementMonitorHelper.getRangeReadings(readingObj, 86400)).to.eql([
                { date: moment().subtract('1', 'minutes').unix(), value: '70' },
                { date: moment().subtract('1', 'days').unix(), value: '65' }
            ]);
        });
    });


    describe('Module: isAPIDataOutofBound works if', function(){
        it('exists', function(){
            expect(isApiDataOutofBound).to.be.ok;
        });

        it('it can detect consective failures', function(done){
            var readings = [12, 13, 9, 15, 16, 17, 18, 12].map(function(v){
                return { value: v };
            });
            isApiDataOutofBound(readings, '15', '10', 3, 1)
            .spread(function(isOut, outReading, infraction){
                expect(isOut).to.be.true;
                expect(outReading.value).to.eql(16);
                expect(infraction).to.eql(3);
                done();
            })
            .catch(done);
        });

        it('it return false if data is not out of bound', function(done){
            var readings = [12, 13, 9, 15, 16, 17, 18, 12].map(function(v){
                return { value: v };
            });
            isApiDataOutofBound(readings, '20', '9', 3, 1)
            .spread(function(isOut, outReading, infraction){
                expect(isOut).to.false;
                expect(outReading.value).to.eql(12); //latest reading
                expect(infraction).to.eql(1);
                done();
            })
            .catch(done);
        });
    });

});
