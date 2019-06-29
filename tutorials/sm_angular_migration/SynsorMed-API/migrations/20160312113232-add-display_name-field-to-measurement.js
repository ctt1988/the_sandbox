'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('measurement', 'display_name', {
          type: Sequelize.STRING,
          allowNull: true
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
     queryInterface.removeColumn('measurement', 'display_name');
     done();
  }
};
