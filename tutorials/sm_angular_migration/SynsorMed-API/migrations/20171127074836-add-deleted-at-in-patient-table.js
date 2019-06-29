'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('patient', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
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
