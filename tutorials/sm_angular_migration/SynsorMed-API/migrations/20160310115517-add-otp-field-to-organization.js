'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
       queryInterface.addColumn('organization', 'otp', {
          type: Sequelize.STRING,
          allowNull: true
       })
       .then(function(){
           done();
       })
       .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      queryInterface.removeColumn('organization', 'otp');
      done();
  }
};
