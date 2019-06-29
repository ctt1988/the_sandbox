'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('encounter_survey_answer', 'encounter_survey_question_id', {
      type: DataTypes.INTEGER
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    done(); // add reverting commands here, calling 'done' when finished
  }
};
