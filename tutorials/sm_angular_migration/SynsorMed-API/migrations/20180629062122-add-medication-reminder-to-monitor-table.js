'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('monitor', 'medication_reminder', {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    done();
  }
};
