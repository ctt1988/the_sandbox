'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var support = require('../support');
var app = support.app;
var models = support.models;

describe('Request: all unsubscribe work if', function(){
    var pateint = null, patientMobileNo = 9876543210;

    before(function(){
        return models.Patient.create({
            first_name : 'Test',
            last_name : 'Patient',
            city : 'TestCity',
            state : 'TestState',
            phone_mobile : patientMobileNo,
            notify : 1
        })
        .then(function(result){
            pateint = result;
        });
    });

    it('Patient could unsubscribe from mobile messages', function(done){
        expect(true).to.be.true;
        supertest(app)
        .get('/v1/unsubscribe?From=' + patientMobileNo + '&Text=STOP')
        .expect(200)
        .end(function(err, res){
            expect(err).to.be.not.ok;
            expect(res.body).to.be.ok;
            models.Patient.find({where: {id: pateint.id}})
            .then(function(result){
                expect(result.notify).to.be.false;
                done();
            });
        });

    });

    after(function(){
        return pateint.destroy({ force: true});
    });
});
