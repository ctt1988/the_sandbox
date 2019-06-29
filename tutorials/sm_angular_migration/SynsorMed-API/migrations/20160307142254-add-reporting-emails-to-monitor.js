'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
       queryInterface.addColumn('monitor', 'reporting_emails', {
          type: Sequelize.STRING,
          allowNull: true
       })
       .then(function(){
           done();
       })
       .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
     queryInterface.removeColumn('monitor', 'reporting_emails');
     done();
  }
};
