module.exports = function(sequelize, DataTypes) {
  return sequelize.define("RTCUser", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    domain: {
      type: DataTypes.STRING
    },
    in_use: {
      type: DataTypes.BOOLEAN
    },
    last_activity: {
      type: DataTypes.DATE
    },
    name: {
      type: DataTypes.STRING
    },
    profile: {
      type: DataTypes.STRING
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'rtc_user'
  });
}
