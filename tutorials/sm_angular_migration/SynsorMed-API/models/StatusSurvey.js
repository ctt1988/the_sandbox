'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('StatusSurvey', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        survey_name: {
          type: DataTypes.STRING
        },
        display_name: {
          type: DataTypes.STRING
        },
        care_margin: {
          type: DataTypes.INTEGER
        },
        survey_instructions: {
          type: DataTypes.TEXT
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
          type: DataTypes.DATE
        }
    },
    {
        tableName: 'status_survey'
    });
};
