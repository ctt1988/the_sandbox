module.exports = function(sequelize, DataTypes) {
  return sequelize.define("OrganizationPreference", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    org_id: {
      type: DataTypes.INTEGER
    },
    key: {
      type: DataTypes.STRING
    },
    value: {
      type: DataTypes.STRING
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'organization_preference'
  });
}
