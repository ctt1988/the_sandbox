'use strict';

var config = require('config')
, models = require('../support').models
, expect = require('chai').expect;

describe('Roles are configured correctly if', function(){

    it('Admin role is working', function(){
        return models.Role.find({
            where : {
                id : config.get('seeds.roles.Admin')
            }
        })
        .then(function(role){
            expect(role).not.to.equal(null);
        });

    });

    it('Super Admin role is working', function(){
        return models.Role.find({
            where : {
                id : config.get('seeds.roles.SuperAdmin')
            }
        })
        .then(function(role){
            expect(role).not.to.equal(null);
        });
    });

    it('Provider role is working', function(){
        return models.Role.find({
            where : {
                id : config.get('seeds.roles.Provider')
            }
        })
        .then(function(role){
            expect(role).not.to.equal(null);
        });
    });

});
