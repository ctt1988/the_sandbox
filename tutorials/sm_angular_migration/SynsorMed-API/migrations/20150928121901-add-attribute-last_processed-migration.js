'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'process_time', {
      type: DataTypes.DATE,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('monitor', 'process_time');
    done();
  }
};
