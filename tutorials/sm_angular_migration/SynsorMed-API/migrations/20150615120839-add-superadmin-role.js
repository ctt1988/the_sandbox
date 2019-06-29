'use strict';

var config = require('config');
var RoleModel = require('models').Role;

module.exports = {
  up: function(migration, DataTypes, done) {
    //find if role already exists or not
    RoleModel.find({
      where : {
        id : config.get('seeds.roles.SuperAdmin')
      }
    })
    .then(function(role){
      if(role !== null){
        done();
        return;
      }
      //create the role
      RoleModel.create({
        id : config.get('seeds.roles.SuperAdmin'),
        name : 'SuperAdmin'
      })
      .then(function(){
          done();
      })
      .catch(done);
    });

  },

  down: function(migration, DataTypes, done) {

    //find if role already exists or not
    RoleModel.find({
      where : {
        id : config.get('seeds.roles.SuperAdmin')
      }
    }).then(function(role){
      if(role === null){
        done();
        return;
      }

      //find out what you want
      role.destroy().then(function(){
        done();
      });

    });

  }
};
