'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('encounter', 'is_ccm', {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('encounter', 'is_ccm');
    done();
  }
};
