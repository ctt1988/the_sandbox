'use strict';

var expect = require('chai').expect;
var models = require('models');
var config = require('config');

describe('Model: User Working If', function(){
    var organization, organizationPreference, user, fee = '50';
    before(function(){
        return models.Organization.create({
            name: 'User Test'
        })
        .then(function (created) {
            organization = created;
            return  models.User.create({
                first_name: 'Test User ',
                last_name: 'Model',
                email: 'testUser@model.com',
                password: 'testUser',
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

    it('It exists', function(){
        expect(models.User) .to.be.ok;
    });
    it('Function: hashPassword works', function(done){
        models.User.hashPassword('HI123')
        .then(function(hash){
            expect(hash).to.not.eql('HI123');
            done();
        })
        .catch(done);
    });
    it('Function: verifyPassword works', function(done){
        models.User.hashPassword('HI123')
        .then(function(hash){
            return models.User.verifyPassword('HI123', hash);
        })
        .then(function(result){
            expect(result).to.be.true;
            done();
        })
        .catch(done);
    });

    it('Function: getFee works', function(done){
        models.User.getFee(user.id)
        .then(function(result){
            expect(result).to.eql(fee);
            done();
        })
        .catch(done);
    });

    it('Function: isOnline works', function(done){
        models.User.isOnline(user.id)
        .then(function(result){
            expect(result).to.be.true;
            done();
        })
        .catch(done);
    });

    after(function(){
        return require('q').all([
            organization.destroy({force:true}),
            user.destroy({force:true}),
            organizationPreference.destroy({force: true})
        ]);
    });

});
