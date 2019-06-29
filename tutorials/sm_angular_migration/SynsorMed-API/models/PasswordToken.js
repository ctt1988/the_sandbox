module.exports = function(sequelize, DataTypes) {
  return sequelize.define("PasswordToken", {
    user_id : {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expires: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'password_token',
  });
}
