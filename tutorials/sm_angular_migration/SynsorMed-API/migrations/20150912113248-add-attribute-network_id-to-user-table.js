'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('user', 'network_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('user', 'network_id');
    done();
  }
};
