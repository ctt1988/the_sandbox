module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name : {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.STRING
    },
    city:{
      type: DataTypes.STRING
    },
    state:{
      type: DataTypes.STRING
    },
    zip:{
      type: DataTypes.STRING
    },
    dob: {
      type: DataTypes.DATE,
      allowNull:true
    },
    phone_mobile: {
        type: DataTypes.STRING
    },
    mobile_number: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    social_security_number: {
       type: DataTypes.STRING
    },
    medical_record_number: {
       type: DataTypes.STRING
    },
    gender: {
       type: DataTypes.ENUM('male', 'female')
    },
    notify: {
       type: DataTypes.BOOLEAN,
       allowNull: false,
       defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    },
    deleted_at: {
        type: DataTypes.DATE
    }
  },
  {
    deletedAt: 'deleted_at',
    paranoid: true,
    tableName: 'patient',
    instanceMethods: {
        getName: function(){
           return this.first_name + (this.last_name ? (' ' + this.last_name) : '');
        }
    }
  });
};
