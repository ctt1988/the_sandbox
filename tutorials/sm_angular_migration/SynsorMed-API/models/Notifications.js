module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Notifications", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    monitor_id: {
        type: DataTypes.INTEGER
    },
    type : {
        type : DataTypes.STRING
    },
    read_by: {
        type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'notifications'
  });
}
