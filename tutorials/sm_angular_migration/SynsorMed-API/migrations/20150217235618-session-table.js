'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('sessions', {
      session_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      data: {
        type: DataTypes.TEXT
      },
      expires: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      }
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    done();
  }
};
