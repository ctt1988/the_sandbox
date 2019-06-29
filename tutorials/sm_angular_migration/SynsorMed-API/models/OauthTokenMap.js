module.exports = function(sequelize, DataTypes) {
  return sequelize.define("OauthTokenMap", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    data: {
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
    tableName: 'oauth_token_map',
    classMethods: {
      getPrimaryKey: function(token, service){ return (token + '-' + service); }
    }
  });
}
