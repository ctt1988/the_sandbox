var express = require('express');
var csrfMiddleware = require('../components/csrf');
var UserModel = require('models').User;
var csrf = new csrfMiddleware();
var logger = require('logger');

var router = express.Router();

router.use('/', function (req, res, next) {
  if(req.session.userId) {
    UserModel.findById(req.session.userId).then(function (user) {
      req.current_user = user;
      next();
    });
  } else {
    logger.debug('Using empty user');
    req.current_user = UserModel.build({});
    next();
  }
});

router.use('/authenticate', require('../api/authenticate/authenticate'));

router.use('/log', require('../api/log'));

router.use('/register', require('../api/register'));

router.use('/forgot', require('../api/forgot'));

//external API call handler
router.use('/service', require('../api/service'));

router.use('/csrf', function (req, res) {
    logger.info(req.cookies);
    logger.info(req.session);
    res.json(req.session.csrf);
});

router.use('/file', require('../api/file'));

router.use('/rest/', csrf.checkToken, require('../api/rest'));

/** Api for sending mails **/
router.use('/mailer', csrf.checkToken, require('../api/mailer'));

router.use('/unsubscribe', require('../api/unsubscribe'));

module.exports = router;
