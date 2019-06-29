module.exports = function(sequelize, DataTypes) {
  return sequelize.define("EncounterSurveyAnswer", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    encounter_id: {
      type: DataTypes.INTEGER
    },
    choice: {
      type: DataTypes.BOOLEAN
    },
    encounter_survey_question_id: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'encounter_survey_answer'
  });
}
