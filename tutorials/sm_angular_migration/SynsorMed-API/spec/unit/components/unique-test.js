'use strict';

var expect = require('chai').expect;
var generator = require('../../../server/components/unique');

describe('Component: Unique: Works if', function(){

    it('exists', function(){
        expect(generator).to.be.ok;
    });

    it('Function: generateUniqueCode works', function(done){
        generator.generateUniqueCode()
        .then(function(code){
            expect(code).to.be.ok;
            done();
        })
        .catch(done);
    });

    it('Function: generateUniqueOtp works', function(done){
        generator.generateUniqueOtp()
        .then(function(otp){
            expect(otp).to.be.ok;
            done();
        })
        .catch(done);
    });

});
