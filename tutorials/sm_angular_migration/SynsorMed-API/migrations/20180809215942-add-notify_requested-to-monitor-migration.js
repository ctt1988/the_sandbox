'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'notify_requested', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    return done();
  }
};
