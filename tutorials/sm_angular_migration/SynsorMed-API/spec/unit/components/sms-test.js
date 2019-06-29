'use strict';

var expect = require('chai').expect;
var sms = require('../../../server/components/sms');

describe('Component: sms works if', function(){
    it('exists', function(){
        expect(sms).to.be.ok;
    });

    it('Function: mailIsANumber works', function(){
        expect(sms.mailIsANumber()).to.be.undefined;
        expect(sms.mailIsANumber('abc@gmail.com')).to.be.false;
        expect(sms.mailIsANumber('123456789@gmail.com')).to.be.false;
        expect(sms.mailIsANumber('abcdef@txt.att.net')).to.be.false;
        expect(sms.mailIsANumber('123456789@txt.att.net')).to.be.true;
    });
});
