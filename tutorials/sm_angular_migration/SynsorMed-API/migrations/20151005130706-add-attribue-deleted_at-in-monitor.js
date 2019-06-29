'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('monitor', 'deleted_at');
    done();
  }
};
