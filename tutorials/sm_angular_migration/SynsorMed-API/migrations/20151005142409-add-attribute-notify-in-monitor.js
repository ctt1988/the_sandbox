'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'notify', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('monitor', 'notify');
    done();
  }
};
