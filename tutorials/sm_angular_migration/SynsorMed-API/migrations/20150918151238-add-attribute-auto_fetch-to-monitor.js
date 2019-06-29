'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'auto_fetch', {
       type: DataTypes.BOOLEAN
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('monitor', 'auto_fetch');
    done();
  }
};
