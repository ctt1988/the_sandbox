'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var support = require('../support');
var app = support.app;
var models = support.models;
var config = require('config');

describe('Request: post authentication using otp works if', function(){
    var organization, organizationPreference, user, fee = '50';
    var username = 'testUser@gmail.com', password = '123456awe', otp = 'Unique0tp';

    before(function(){
        return models.Organization.create({
            name: 'User Test',
            otp: models.Organization.encryptOtp(otp)
        })
        .then(function(created){
            organization = created;
            return models.User.hashPassword(password);
        })
        .then(function(encryptedPassword){
            return  models.User.create({
                first_name: 'Test User ',
                last_name: 'Model',
                email: username,
                password: encryptedPassword,
                registration_date: new Date(),
                last_activity: require('moment')().format(),
                role_id: config.seeds.roles.Admin,
                org_id: organization.id
            });
        })
        .then(function(newUser){
            user = newUser;
            return models.OrganizationPreference.create({
                org_id: organization.id,
                key: 'defaultFee',
                value: fee
            })
            .then(function(preference){
                organizationPreference = preference;
            });
        });
    });


    it('Admin could login in emergency', function(done){
        supertest(app)
        .post('/v1/authenticate/otp')
        .send({otp: otp})
        .expect(200)
        .end(function(err, res){
            expect(err).to.be.not.ok;
            expect(res.body.user).to.contain.all.keys(['email', 'id']);
            done();
        });
    });

    after(function(){
        return require('q').all([
            organization.destroy({force:true}),
            user.destroy({force:true}),
            organizationPreference.destroy({force: true})
        ]);
    });

});
