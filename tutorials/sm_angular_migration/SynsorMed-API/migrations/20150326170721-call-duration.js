'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('encounter', 'duration', {
      type: DataTypes.INTEGER,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('encounter', 'duration');
    done(); // add reverting commands here, calling 'done' when finished
  }
};
