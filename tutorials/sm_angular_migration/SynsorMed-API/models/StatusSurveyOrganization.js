'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('StatusSurveyOrganization', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        status_survey_id: {
          type: DataTypes.INTEGER
        },
        org_id: {
          type: DataTypes.INTEGER
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
          type: DataTypes.DATE
        }
    },
    {
        tableName: 'status_survey_organization'
    });
};
