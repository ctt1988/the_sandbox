'use strict';

var expect = require('chai').expect;
var models = require('models');

describe('Model: Organization Working If', function(){
    it('exists', function(){
        expect(models.Organization).to.be.ok;
    });

    it('Function: encryptOtp works', function(){
         expect(models.Organization.encryptOtp('Hello')).to.be.ok;
    });

    it('Function: decryptOtp works', function(){
        expect((models.Organization.decryptOtp((models.Organization.encryptOtp('Hello'))))).to.eql('Hello');
    });

    it('Function: verifyOtp works', function(){
        expect(models.Organization.verifyOtp('Hello', models.Organization.encryptOtp('Hello'))).to.be.true;
    });
});
