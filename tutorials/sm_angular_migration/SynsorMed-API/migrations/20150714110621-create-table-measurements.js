'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('measurement', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull : false,
        unique : true
      },
      unit : {
        type: DataTypes.STRING
      },
      description : {
        type: DataTypes.STRING(1000)
      },
      created_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE
      }
    })
    .then(function(){
        return migration.addIndex('measurement', ['name']); //Quicken measurement name lookups
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('measurement');
    done();
  }
};
