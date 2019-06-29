'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('organization', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('organization', 'is_active');
    done();
  }
};
