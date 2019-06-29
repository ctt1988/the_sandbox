'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {

    migration.createTable('oauth_token_map', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      data: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE
      }
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('oauth_token_map');
    done();
  }
};
