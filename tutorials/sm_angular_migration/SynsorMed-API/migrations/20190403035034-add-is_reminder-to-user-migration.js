'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('user', 'is_reminder', {
      type: DataTypes.BOOLEAN
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('user', 'is_reminder');
    done();
  }
};
