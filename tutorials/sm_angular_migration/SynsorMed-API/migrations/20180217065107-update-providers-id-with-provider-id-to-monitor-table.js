'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
       queryInterface.sequelize.query('UPDATE `monitor` SET `providers_id` = concat("[", provider_id, "]") where `id` = id AND `providers_id` IS NULL')
       .then(function(){
           done();
       })
       .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      return done();
  }
};
