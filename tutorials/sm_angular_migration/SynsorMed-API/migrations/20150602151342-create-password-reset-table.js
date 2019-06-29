'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('password_token', {
      user_id : {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expires: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
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
    migration.dropTable('password_token');
    done();
  }
};
