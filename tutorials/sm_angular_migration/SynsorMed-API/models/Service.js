module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull : false,
      unique : true
    },
    display : {
      type : DataTypes.STRING
    },
    url : {
      type: DataTypes.STRING
    },
    version : {
      type: DataTypes.STRING(5)
    },
    config : {
      type: DataTypes.TEXT
    },
    meta_data: {
      type: DataTypes.TEXT
    },
    description : {
      type: DataTypes.STRING(1000)
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName : 'service',
    instanceMethods : {
      toArray : function(){
        return {
          name : this.name,
          display : this.display,
          url : this.url,
          description : this.description
        };
      }
    }
  });
};
