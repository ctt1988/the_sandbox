'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.removeColumn('encounter', 'oauth_token_secret')
    .then(function(){
        return migration.removeColumn('encounter', 'oauth_token');
    })
    .then(function(){
        return migration.addColumn('encounter', 'oauth_data', {
          type: DataTypes.TEXT,
          allowNull: true
        });
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.addColumn('encounter', 'oauth_token', {
      type: DataTypes.STRING(64),
      allowNull: true
    });
    migration.addColumn('encounter', 'oauth_token_secret', {
      type: DataTypes.STRING(64),
      allowNull: true
    });
    migration.removeColumn('encounter', 'oauth_data');
    done();
  }
};
