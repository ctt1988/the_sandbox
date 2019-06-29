'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('organization', 'license_count', {
          type: Sequelize.STRING
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
    return done();
  }
};
