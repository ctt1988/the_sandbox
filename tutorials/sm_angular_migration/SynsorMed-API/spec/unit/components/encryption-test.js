'use strict';

var expect = require('chai').expect;
var component = require('../../../server/components/encryption');

describe('Component: Encryption Works If', function(){
    it('exists', function(){
        expect(component).to.be.ok;
    });
    it('Function: Encrypt works', function(){
        expect(component.encrypt('Hello')).to.be.ok;
        expect(component.encrypt()).to.be.null;
    });
    it('Function: Decrypt works', function(){
        expect(component.decrypt(component.encrypt('Hello'))).to.eql('Hello');
    });
});
