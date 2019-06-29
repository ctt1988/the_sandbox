'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {

    migration.createTable('service', {
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
      display : {
        type : DataTypes.STRING
      },
      url : {
        type: DataTypes.STRING
      },
      version : {
        type: DataTypes.STRING(5)
      },
      config : {
        type: DataTypes.TEXT
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
        return migration.addIndex('service', ['name']); //Quicken measurement name lookups
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('service');
    done();
  }
};
