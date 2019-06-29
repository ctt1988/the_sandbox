var config = require('config');
var stripe = require('stripe')(config.get('stripe.key'));

module.exports = function(sequelize, DataTypes) {
  var Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    charge_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    charge_token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fee: {
      type: DataTypes.INTEGER
    },
    charged: {
      type: DataTypes.BOOLEAN
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'payment',
    classMethods: {
        createPayment: function (config) {
            return sequelize.Promise(function (resolve, reject) {
                stripe.charges.create({
                    amount: config.fee, // amount in cents, this is the maximum fee for this charge hold
                    currency: 'usd',
                    card: config.token,
                    description: 'SynsorMed encounter ' + config.patientCode,
                    capture: false  // only authorize, charge when session is ended
                }, function(err, charge) {
                    if(err) return reject('The card is declined: ' + err);

                    Payment.create({
                        charged: false,
                        charge_token: config.token,
                        charge_id: charge.id,
                        fee: config.fee
                    })
                    .then(function (payment){
                        resolve(payment);
                    })
                    .catch(reject);

                });
            });

        }
    }
  });

  return Payment;
};
