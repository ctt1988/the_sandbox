'use strict';

var expect = require('chai').expect;
var supertest = require('supertest');
var support = require('../support');
var app = support.app;
var models = support.models;
var config = require('config');

describe('Request: post superadmin login works if', function(){
    var organization, organizationPreference, user, superAdmin, fee = '50';
    var username = 'supertestadmin@test.com', password = '123456awe';
    var csrfToken, sessionToken;

    before(function(done){
        models.Organization.create({
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
                role_id: config.seeds.roles.SuperAdmin
            });
        })
        .then(function(admin){
            superAdmin = admin;
            return  models.User.create({
                first_name: 'Test User ',
                last_name: 'Model',
                email: 'testUser@gmail.com',
                password: admin.password,
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
                supertest(app)
                .post('/v1/authenticate/')
                .send({username: username, password: password})
                .expect(200)
                .end(function(err, auth){
                    csrfToken =  auth.body.csrfToken;
                    sessionToken = auth.headers['x-session-token'];
                    done();
                });
            });
        });
    });


    it('Superadmin can login', function(done){
        supertest(app)
        .post('/v1/authenticate/superadmin/login')
        .send({adminId: user.id})
        .set({'x-csrf': csrfToken, 'X-Session-Token': sessionToken})
        .expect(200)
        .end(function(err, res){
            expect(err).to.be.not.ok;
            expect(res.body.user).to.contain.all.keys(['email', 'id']);
            csrfToken =  res.body.csrfToken;
            sessionToken = res.headers['x-session-token'];
            done();
        });
    });

    it('Superadmin can go back to his/her own account', function(done){
        supertest(app)
        .post('/v1/authenticate/superadmin/goBack')
        .set({'x-csrf': csrfToken, 'X-Session-Token': sessionToken})
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
            superAdmin.destroy({force: true}),
            organizationPreference.destroy({force: true})
        ]);
    });

});
