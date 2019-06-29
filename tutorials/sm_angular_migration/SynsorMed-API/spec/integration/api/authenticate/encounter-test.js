'use strict';

var support = require('../support');
var app = support.app;
var models = support.models;
var expect = require('chai').expect;
var supertest = require('supertest');

describe('Request: post authentication using patient code works if', function(){
    var monitor;

    before(function(){
        return models.Monitor.create({
            provider_id: 1,
            patient_code: 'UNI8C0DM',
            notify : 0
        })
        .then(function(data){
            monitor = data;
        });
    });

    it('Patient could login', function(done){
        supertest(app)
        .post('/v1/authenticate/encounter')
        .send({code: monitor.patient_code})
        .expect(200)
        .end(function(err, res){
            expect(err).to.be.not.ok;
            expect(res.body).to.contain.all.keys(['id', 'csrfToken', 'code']);
            done();
        });
    });

    after(function(){
        return monitor.destroy({force: true});
    });

});
