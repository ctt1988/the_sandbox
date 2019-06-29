'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var support = require('../support');
var app = support.app;
var models = support.models;
var config = require('config');

describe('Request: post authentication works if', function(){
    var organization, organizationPreference, user, fee = '50';
    var username = 'testUser@gmail.com', password = '123456awe';

    before(function(){
        return models.Organization.create({
            name: 'User Test'
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


    it('It could authenticate user', function(done){
        setTimeout(function(){
            supertest(app)
            .post('/v1/authenticate/')
            .send({username: username, password: password})
            .expect(200)
            .end(function(err){
                expect(err).to.be.not.ok;
                done();
            });
        }, 500);
    });

    after(function(){
        return require('q').all([
            organization.destroy({force:true}),
            user.destroy({force:true}),
            organizationPreference.destroy({force: true})
        ]);
    });

});
