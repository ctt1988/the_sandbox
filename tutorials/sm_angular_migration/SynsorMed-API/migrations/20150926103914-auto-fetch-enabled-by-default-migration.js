'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.changeColumn('monitor', 'auto_fetch', {
        type: DataTypes.BOOLEAN,
        defaultValue: 1
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.changeColumn('monitor', 'auto_fetch', {
        type: DataTypes.BOOLEAN,
        defaultValue: 0
    });
    done();
  }
};
