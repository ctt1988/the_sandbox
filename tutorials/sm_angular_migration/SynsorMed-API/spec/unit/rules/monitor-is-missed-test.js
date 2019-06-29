'use strict';

var expect = require('chai').expect;
var isMissed = require('../../../server/rules/monitor').isMissed;

describe('Rule: isMissed is Working If', function(){
    it('It exists', function(){
        expect(isMissed).to.be.ok;
    });

    it('Missed if Creation is past but recording date is future', function() {
        expect(isMissed('2013-12-12 00:00:00', '2013-12-13 00:00:00', 86400)).to.be.true;
    });

    it('Not Missed if Creation is today, recording date is past', function() {
        expect(isMissed(new Date(), '2013-12-12 00:00:00', 86400)).to.be.false;
    });

    it('Not Missed if Creation is future, recording date is past', function() {
        expect(isMissed('9990-12-12 00:00:00', '2013-12-12 00:00:00', 86400)).to.be.false;
    });

    it('Missed if Creation is past, recording date is future', function() {
        expect(isMissed('2013-12-12 00:00:00', '9990-12-12 00:00:00')).to.be.true;
    });

    it('Not Missed if Creation is same day, recording date is same day', function() {
        expect(isMissed(new Date(), new Date(), 86400)).to.be.false;
    });

    it('Not Missed if Creation is same day, recording is same day, with Precison', function() {
        var now = new Date();
        var somehoursago = new Date();
        somehoursago.setHours(0);
        expect(isMissed(now, somehoursago, 43200)).to.be.false;
    });

});
