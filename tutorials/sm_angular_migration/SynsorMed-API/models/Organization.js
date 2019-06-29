var config = require('config');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var cryptoSecretKey = config.otp.key || 'd6F3Efeq';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Organization', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    specialty: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    license_count: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'organization',
    instanceMethods: {
      getPreferences: function () {
        return this.getOrganizationPreferences().then(function (preferences){
          var prefs = {};
          preferences.forEach(function (pref) {
            prefs[pref.key] = pref.value;
        });
          return prefs;
      });
      }
   },
   classMethods: {
      encryptOtp: function(plainOtp){
         if(!plainOtp) return null;
         var cipher = crypto.createCipher(algorithm, cryptoSecretKey);
         var encryptedOtp = cipher.update(plainOtp, 'utf8', 'hex');
             encryptedOtp += cipher.final('hex');
           return encryptedOtp;
      },
      decryptOtp: function(encryptedOtp){
          if(!encryptedOtp) return null;
          var decipher = crypto.createDecipher(algorithm, cryptoSecretKey);
          var plainOtp = decipher.update(encryptedOtp, 'hex', 'utf8');
              plainOtp += decipher.final('utf8');
          return plainOtp;
      },
      verifyOtp: function(plainOtp, encryptedOtp){
          if(!plainOtp || !encryptedOtp) return false;
          return (this.encryptOtp(plainOtp) == encryptedOtp);
      }
   }
  });
};
