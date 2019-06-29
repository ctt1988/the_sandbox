
var router = require('express').Router();
var PaymentModel = require('models').Payment;
var logger = require('logger');

router.post('/', function (req, res) {
    logger.debug(req.encounterModel.fee);

    var stripeToken = req.body.id;
    PaymentModel.createPayment({
      fee: req.encounterModel.fee * 100, //This must be the amount in cents - not dollars
      patientCode: req.encounterModel.patient_code,
      token: stripeToken
    }).then(function (payment) {
      return req.encounterModel.update({
        payment_id: payment.id
      });
  }).then(function (encounter) {
      logger.trace('Recieved payment for encounter '+encounter.id+' with payment id '+encounter.payment_id);
      res.status(204).end();
    }).catch(function (err) {
      throw new Error(err);
    });
});

module.exports = router;
