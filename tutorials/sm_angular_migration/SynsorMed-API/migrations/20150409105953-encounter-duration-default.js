'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.changeColumn('encounter', 'duration', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.changeColumn('encounter', 'duration', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    done(); // add reverting commands here, calling 'done' when finished
  }
};
