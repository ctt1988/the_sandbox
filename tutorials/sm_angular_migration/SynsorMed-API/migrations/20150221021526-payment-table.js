'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('payment', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      charge_id: {
        type: DataTypes.STRING,
        allowNull: false
      },

      charge_token: {
        type: DataTypes.STRING,
        allowNull: false
      },

      charged: {
        type: DataTypes.BOOLEAN
      },

      fee: {
        type: DataTypes.INTEGER
      },

      created_at: {
        type: DataTypes.DATE
      },

      updated_at: {
        type: DataTypes.DATE
      }
    })
    .then(function(){
        return migration.addColumn('encounter', 'payment_id', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
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
