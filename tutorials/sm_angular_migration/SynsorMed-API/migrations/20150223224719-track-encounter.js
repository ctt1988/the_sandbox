'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('encounter', 'rtc_user_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
