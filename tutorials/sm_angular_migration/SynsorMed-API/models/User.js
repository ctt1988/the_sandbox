var scrypt = require('scrypt');
var config = require('config');
var logger = require('logger');

module.exports = function(sequelize, DataTypes) {

    var User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        first_name: {
            type: DataTypes.STRING
        },
        middle_name: {
            type: DataTypes.STRING
        },
        last_name: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.ENUM('male', 'female')
        },
        registration_date: {
            type: DataTypes.DATE
        },
        phone_mobile: {
            type: DataTypes.STRING
        },
        phone_work: {
            type: DataTypes.STRING
        },
        title: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        role_id: {
            type: DataTypes.INTEGER
        },
        org_id: {
            type: DataTypes.INTEGER
        },
        network_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        specialty: {
            type: DataTypes.INTEGER
        },
        last_activity: {
            type: DataTypes.DATE
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        },
        failed_trials: {
          type: DataTypes.INTEGER
        },
        blocked_till: {
            type: DataTypes.DATE
        },
        deleted_at: {
            type: DataTypes.DATE
        },
        is_reminder: {
            type: DataTypes.BOOLEAN
        }
    }, {
        deletedAt: 'deleted_at',
        paranoid: true,
        tableName: 'user',
        getterMethods   : {
            name: function () {
                return [this.first_name, this.middle_name, this.last_name].filter(function (i) { return i != null; }).join(' ');
            }
        },
        classMethods: {
            hashPassword: function (password) {
                var asciiEncodedPassword = new Buffer(password, 'ascii');
                return new sequelize.Promise(function (resolve, reject) {
                    scrypt.kdf(asciiEncodedPassword, {N: 1, r:1, p:1}, function(err, result){
                        if(err)  return reject(err);
                        resolve(result.toString('hex'));
                    });
                });
            },
            verifyPassword: function (password, hash, email, count) {
                var bufferPassword = new Buffer(password);
                var hexHash = new Buffer(hash, 'hex');
                return new sequelize.Promise(function (resolve, reject) {
                    scrypt.verifyKdf(hexHash, bufferPassword, function(err, result){
                        if(err || !result){
                          User.find({
                              where: {
                                  email: {
                                      $like: email
                                  }
                              }
                          })
                          .then(function(entry){
                            entry.updateAttributes({
                                failed_trials: count
                            })
                            .then(function(resp){
                              return reject({message:'Wrong password'});
                            });
                          });
                          return reject({message:'Wrong password'});
                        }
                        resolve(result);

                });
              });
            },
            getFee: function(uid){
                var self = this;
                return new sequelize.Promise(function (resolve, reject) {
                    //get the encounter fee
                    self.findById(uid).then(function (user) {
                        user.getOrganization().then(function (org) {
                            org.getPreferences().then(function (preferences) {
                                resolve(preferences.defaultFee);
                            });
                        });
                    }).catch(function(e){
                        logger.error(e);
                        reject(e);
                    });
                });
            },
            isOnline: function(providerId){
                var self = this;
                logger.debug('Checking '+providerId+' is online or not.');
                return new sequelize.Promise(function (resolve, reject) {
                    if(!providerId) reject(false);

                    self.findById(providerId)
                    .then(function (user) {
                        var cutoffDate = new Date();
                        cutoffDate.setSeconds(cutoffDate.getSeconds() - 60);
                        resolve(user.last_activity >= cutoffDate);
                    })
                    .catch(function(error){
                        logger.error(error);
                        reject(error);
                    });
                });
            }
        },
        scopes: {
            // if a user is provider or not
            isProvider : function(){
                return {
                    where : ['role_id = ' + config.seeds.roles.Provider]
                };
            },

            // if a user is admin or not
            isAdmin : function(){
                return {
                    where : ['role_id = ' + config.seeds.roles.Admin]
                };
            },

            //belongs to organization
            ofOrganization : function(orgId){
                return {
                    where : ['org_id = ?', orgId]
                };
            }
        }
    });

    return User;
};
