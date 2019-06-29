'use strict';

var config = require('config');
var models = require('models');
var loremIpsum = require('lorem-ipsum');

//pick up role ids from config
var adminRoleID = config.seeds.roles.Admin;
var providerRoleID = config.seeds.roles.Provider;
var superAdminRoleID = config.seeds.roles.SuperAdmin;

module.exports = function (grunt) {
  grunt.registerTask('seed', function () {

    var seedData = {};

    var done = this.async();
    models.Organization.destroy({truncate: true}).then(function () {
      return models.User.destroy({truncate: true});
    }).then(function () {
      return models.Encounter.destroy({truncate: true});
    }).then(function () {
      return models.EncounterSurveyAnswer.destroy({truncate: true});
    }).then(function () {
      return models.Facility.destroy({truncate: true});
    }).then(function () {
      return models.OrganizationPreference.destroy({truncate: true});
    }).then(function () {
      return models.Role.destroy({truncate: true});
    }).then(function () {
      return models.SurveyQuestion.destroy({truncate: true});
    }).then(function () {
      return models.OauthTokenMap.destroy({truncate: true});
    }).then(function () {
      return models.Monitor.destroy({truncate: true, force: true});
    }).then(function () {
      return models.Measurement.destroy({truncate: true});
    }).then(function () {
      return models.MeasurementMonitor.destroy({truncate: true, force: true});
    }).then(function () {
      return models.MeasurementService.destroy({truncate: true});
    }).then(function () {
      return models.Service.destroy({truncate: true});
    }).then(function () {
      return models.PasswordToken.destroy({truncate: true});
    }).then(function (){
      return models.OauthMonitorToken.destroy({truncate: true});
    }).then(function () {
      return models.Patient.destroy({truncate: true});
    }).then(function () {
      return models.PatientUser.destroy({truncate: true});
    }).then(function(){
      return models.Event.destroy({truncate: true});
    }).then(function (){
      return models.Organization.create({
        name: "Test Org Acme Inc"
      }).then(function (org) {
        seedData.orgId = org.id;
      });
    }).then(function () {
      return models.sequelize.Promise.all([
        models.Role.create({
          id: adminRoleID,
          name: 'Admin'
        }).then(function (role) {
          seedData.adminRole = role.id;
        }),
        models.Role.create({
          id: providerRoleID,
          name: 'Provider'
        }).then(function (role) {
          seedData.providerRole = role.id;
        }),
        models.Role.create({
          id: superAdminRoleID,
          name: 'SuperAdmin'
        }).then(function (role) {
          seedData.superAdminRoleID = role.id;
        })
      ]);
    }).then(function () {
      return models.User.hashPassword('password').then(function (result) {
        return models.sequelize.Promise.all([
          models.User.create({
            first_name: "John",
            middle_name: "Jacob",
            last_name: "Doe",
            gender: 'male',
            registration_date: new Date(),
            phone_mobile: '3838383883',
            phone_work: '1919191919',
            title: "Doctor Extraordinaire",
            password: result,
            email: "provider@test.com",
            org_id: seedData.orgId,
            role_id: seedData.providerRole
          }).then(function (user) {
            seedData.providerId = user.id;
          }),
          models.User.create({
            first_name: "Elizabeth",
            middle_name: "Eliza",
            last_name: "Frankfurt",
            gender: 'female',
            registration_date: new Date(),
            phone_mobile: '3838383883',
            phone_work: '1919191919',
            title: "Doctor Extraordinaire",
            password: result,
            email: "admin@test.com",
            org_id: seedData.orgId,
            role_id: seedData.adminRole
          }).then(function (user) {
            seedData.adminId = user.id;
          }),
          models.User.create({
            first_name: "Adam",
            middle_name: "Francis",
            last_name: "Oswyne",
            gender: 'male',
            registration_date: new Date(),
            phone_mobile: '3838383883',
            phone_work: '1919191919',
            title: "Super Admin",
            password: result,
            email: "superadmin@test.com",
            role_id: seedData.superAdminRoleID
          }).then(function (user) {
            seedData.superAdminRoleID = user.id;
          })
        ]);
      });
    }).then(function () {
      return models.SurveyQuestion.create({
        org_id: seedData.orgId,
        text: loremIpsum({units: 'paragraphs', count: 1})
      });
    }).then(function () {
      return models.SurveyQuestion.create({
        org_id: seedData.orgId,
        text: loremIpsum({units: 'paragraphs', count: 1})
      });
    }).then(function () {
      return models.SurveyQuestion.create({
        org_id: seedData.orgId,
        text: loremIpsum({units: 'paragraphs', count: 1})
      });
    }).then(function () {
      return models.SurveyQuestion.create({
        org_id: seedData.orgId,
        text: loremIpsum({units: 'paragraphs', count: 1})
      });
    }).then(function () {
      return models.SurveyQuestion.create({
        org_id: seedData.orgId,
        text: loremIpsum({units: 'paragraphs', count: 1})
      });
    }).then(function () {
      return models.Facility.create({
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Seattle',
        state: 'WA',
        postal: '98155',
        phone: '6767584758',
        org_id: seedData.orgId
      });
    }).then(function () {
      var users = [];
      for(var i = 1; i <= 18; i++) {
        var str = "" + i;
        var pad = "000";
        var p = models.RTCUser.create({
          domain: 'synsormed.com',
          name: 'standard' + pad.substring(0, pad.length - str.length) + str,
          profile: 'standard'
        });
        users.push(p);
      }

      for(var i = 1; i <= 18; i++) {
        var str = "" + i;
        var pad = "000";
        var p = models.RTCUser.create({
          domain: 'synsormed.com',
          name: 'premium' + pad.substring(0, pad.length - str.length) + str,
          profile: 'premium'
        });
        users.push(p);
      }

      return models.sequelize.Promise.all(users);
    }).then(function () {
      return models.sequelize.Promise.all([
        models.Encounter.create({
          patient_code: 'XNMDFE',
          scheduled_start: new Date(),
          reason_for_visit: loremIpsum({units: 'paragraphs', count: 1}),
          fee: 15,
          fee_paid: false,
          terms_accepted: false,
          provider_id: seedData.providerId
        }),
        models.Encounter.create({
          patient_code: 'PLODIU',
          scheduled_start: new Date(),
          reason_for_visit: loremIpsum({units: 'paragraphs', count: 1}),
          fee: 15,
          fee_paid: false,
          terms_accepted: true,
          provider_id: seedData.providerId
        }),
        models.Encounter.create({
          patient_code: 'WJXYTD',
          scheduled_start: new Date(),
          reason_for_visit: loremIpsum({units: 'paragraphs', count: 1}),
          fee: 15,
          fee_paid: true,
          terms_accepted: true,
          provider_id: seedData.providerId
        }),
        models.Encounter.create({
          patient_code: 'JCNHWO',
          scheduled_start: new Date(),
          reason_for_visit: loremIpsum({units: 'paragraphs', count: 1}),
          fee: 15,
          fee_paid: true,
          terms_accepted: true,
          provider_id: seedData.providerId
        })
      ]);
    }).then(function () {
      return models.OrganizationPreference.create({
        org_id: seedData.orgId,
        key: "defaultFee",
        value: "30"
      });
    }).done(done);
  });
};
