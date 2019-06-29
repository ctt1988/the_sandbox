'use strict';

var expect = require('chai').expect;
var isOutOfBound = require('../../../server/rules/monitor/isOutOfBound');

describe('Rule: isOutOfBound Is Working If', function(){
    it('It exists', function(){
        expect(isOutOfBound).to.be.ok;
    });

    it('Returns false if nothing provided to it ', function(){
        expect(isOutOfBound()).to.be.false;
    });

    it('Rreturns false if latest_reading is not provided to it ', function(){
        expect(isOutOfBound('200', '100')).to.be.false;
        expect(isOutOfBound('90/120', '60/80')).to.be.false;
    });

    it('Returns false if reading is in bound ', function(){
        expect(isOutOfBound('200', '100', '110')).to.be.false;
        expect(isOutOfBound('90/120', '60/80', '100/70')).to.be.false;
    });

    it('Rreturns true if reading is out of bound ', function(){
        expect(isOutOfBound('200', '100', '80')).to.be.true;
        expect(isOutOfBound('90/120', '60/80', '50/100')).to.be.true;
        expect(isOutOfBound('90/120', '60/80', '100/90')).to.be.true;
        expect(isOutOfBound('90/120', '60/80', '130/90')).to.be.true;
    });
});
