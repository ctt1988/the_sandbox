'use strict';

module.exports = {
  up: function (queryInterface, DataTypes, done) {
      queryInterface.createTable('diseases', {
          id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true
          },
          name: {
              type: DataTypes.STRING,
              allowNull: false,
              unique: true
          },
          description: {
              type: DataTypes.STRING(1000)
          },
          created_at: {
              type: DataTypes.DATE
          },
          updated_at: {
              type: DataTypes.DATE
          },
          display_name: {
              type: DataTypes.STRING,
              allowNull: true
          }
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
     done();
  }
};
