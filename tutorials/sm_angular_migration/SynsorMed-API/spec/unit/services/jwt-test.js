'use strict';

var expect = require('chai').expect;
var jwt = require('../../../server/api/service/drivers/base/jwt');

describe('Module: JWT works if ', function(){

    it('It exists', function(){
        expect(jwt).to.be.ok;
    });

    it('It is able to encode the data', function(){
        var data = { freya : 'Sans' };
        var encoded = jwt.encode(data);
        expect(encoded).not.to.be.null;
        expect(encoded).not.eql(data);
    });

    it('It is able to decode the data', function(){
        var data = { freya : 'Sans' };
        var encoded = jwt.encode(data);
        expect(encoded).not.to.be.null;
        var decoded  = jwt.decode(encoded);
        expect(decoded).to.eql(data);
    });

    it('It works when plain object is decoded', function(){
        var data = { freya : 'Sans' };
        var decoded  = jwt.decode(data);
        expect(decoded).to.eql(data);
    });

    it('It will not fail when null data is decoded', function(){
        var decoded  = jwt.decode(null);
        expect(decoded).to.eql(null);
    });

    it('It will not fail when unencrypted string is encoded', function(){
        var decoded  = jwt.decode('winteriscoming');
        expect(decoded).to.eql('winteriscoming');
    });

});
