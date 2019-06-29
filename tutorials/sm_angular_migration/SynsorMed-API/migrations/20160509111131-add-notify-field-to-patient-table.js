'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('patient', 'notify', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      done();
  }
};
