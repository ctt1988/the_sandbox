'use strict';

var networkModel = require('models').CellularNetwork;
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('cellular_network', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
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
      return networkModel.bulkCreate([
            { name: 'Verizon Wireless'},
            { name: 'AT&T Mobility'},
            { name: 'T-Mobile US'},
            { name: 'Sprint Corporation'},
            { name: 'U.S. Cellular'},
            { name: 'Other'}
      ]);
  })
  .then(function(){
      done();
  })
  .catch(done);
},

 down: function(migration, DataTypes, done) {
     migration.dropTable('cellular_network');
     done();
 }
};
