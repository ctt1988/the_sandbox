'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
       queryInterface.addColumn('monitor', 'providers_id', {
            type: Sequelize.TEXT
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
