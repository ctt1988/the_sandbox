'use strict';

var expect = require('chai').expect;
var waitingTime = require('../../../server/rules/encounter/getWaitingTime.js');

describe('Module: waitingTime working if', function(){
    it('It exists', function(){
         expect(waitingTime).to.be.ok;
    });

    it('It is able to get Waiting Time when call started', function() {
        var callStarted = 'Mon Sep 28 2015 10:28:46 GMT+0530 (IST)',
        callReady = 'Mon Sep 28 2015 10:18:40 GMT+0530 (IST)',
        lastActivity = 0,
        tZero = 'Mon Sep 28 2015 10:28:35 GMT+0530 (IST)';
        expect(waitingTime(callStarted, callReady, lastActivity, tZero)).to.eql(606);
    });

    it('It is able to get Waiting Time when call not started', function() {
        var callStarted = 0,
        callReady = 'Mon Sep 28 2015 10:18:40 GMT+0530 (IST)',
        lastActivity = 'Mon Sep 28 2015 10:20:48 GMT+0530 (IST)',
        tZero = 'Mon Sep 28 2015 10:28:35 GMT+0530 (IST)';
        expect(waitingTime(callStarted, callReady, lastActivity, tZero)).to.eql(128);
    });

    it('It is able to get Waiting Time', function() {
        var callStarted = 0,
        callReady = 0,
        lastActivity = 0,
        tZero = 0;
        expect(waitingTime(callStarted, callReady, lastActivity, tZero)).to.eql(0);
    });
});
