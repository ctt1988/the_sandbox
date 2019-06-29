'use strict';
var config = require('config');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('role', [{
        id: config.get('seeds.roles.OrgCreator'),
        name: "OrgCreator",
        created_at: new Date(),
        updated_at: new Date()
      }], {});
  },

  down: function (queryInterface, Sequelize, done) {
    return done();
  }
};
