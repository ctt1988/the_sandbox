'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {

    migration.addColumn('encounter', 'service_name', {
      type: DataTypes.STRING(50),
      allowNull: true
    })
    .then(function(){
        return migration.addColumn('encounter', 'oauth_token', {
          type: DataTypes.STRING(64),
          allowNull: true
        });
    })
    .then(function(){
        return migration.addColumn('encounter', 'oauth_token_secret', {
          type: DataTypes.STRING(64),
          allowNull: true
        });
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('encounter', 'oauth_token_secret');
    migration.removeColumn('encounter', 'oauth_token');
    migration.removeColumn('encounter', 'service_name');
    done();
  }
};
