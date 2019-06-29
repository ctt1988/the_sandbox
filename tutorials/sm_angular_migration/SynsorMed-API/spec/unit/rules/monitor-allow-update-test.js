'use strict';

var models = require('models');
var allowUpdate = require('../../../server/rules/monitor').allowUpdate;
var OrganizationModel = models.Organization;
var UserModel = models.User;
var RoleModel = models.Role;
var MonitorModel = models.Monitor;
var expect = require('chai').expect;

describe('Rule: allowUpdate Is Working If', function(){
    var organization, user, monitor;

    before(function(done){
        OrganizationModel.create({ name: 'User Test' })
        .then(function (created) {
            organization = created;
            return RoleModel.find({
              where: {
                name: 'Admin'
              }
            });
        })
        .then(function(adminRole){
            return UserModel.create({
              first_name: 'Test User ',
              last_name: 'Model',
              email: 'testUser@model.com',
              password: 'testUser',
              registration_date: new Date(),
              role_id: adminRole.id,
              org_id: organization.id
            });
        })
        .then(function(newUser){
            user = newUser;
            return MonitorModel.create({
                description: 'description',
                provider_id: user.id,
                patient_code: 'ABCD45',
                notify: 1
            });
        })
        .then(function(newMonitor){
            monitor = newMonitor;
            done();
        });
    });

    it('It exists', function(){
        expect(allowUpdate).to.be.ok;
    });

    it('Allow update ', function(done){
        allowUpdate(monitor.id, user, monitor.patient_code)
        .then(function(){
            expect(true).to.be.true;
            done();
        })
        .catch(function(){
            expect(false).to.be.true;
            done();
        });
    });

    after(function(done){
       organization.destroy({force:true})
       .then(function(){
           return user.destroy({force:true});
       })
       .then(function(){
           return monitor.destroy({force:true});
       })
       .then(function(){
           done();
       }).catch(done);
    });

});
