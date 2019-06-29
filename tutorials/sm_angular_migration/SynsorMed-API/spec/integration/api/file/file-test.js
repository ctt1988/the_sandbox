'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var app = require('../support').app;

describe('Request: get file token works if', function(){
    it('it could return token', function(done){
        var monitorId = 5;
        var fileName = 'abc.txt';
        var diseasesId = 8;
        supertest(app)
        .get('/v1/file/token?monitorId='+monitorId+'&fileName='+fileName+'&diseasesId='+diseasesId)
        .expect(200)
        .end(function(err, res){
            expect(err).to.be.not.ok;
            expect(res.text).to.be.ok;
            done();
        });
    });
});
