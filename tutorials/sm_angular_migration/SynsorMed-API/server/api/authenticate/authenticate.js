'use strict';

var config = require('config');
var Errors = require('errors');
var models = require('models');
var logger = require('logger');
var router = require('express').Router();
var config = require('config');
var UserMarshaller = require('../../dto/user');
var saveDeviceInfo = require('./savedeviceinfo');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var quickblox = require('../../components/quick-blox');
var moment = require('moment');

var count = 1;

router.post('/', function (req, res) {

    var email = req.body.username;
    var password = req.body.password;
    var userDetails = null;
    var orgId;
    var theme;

    logger.debug('Looking count >=5up user: ' + email);

    models.User.find({
        where: {
            email: {
                $like: email
            }
        },
        include: [models.Role]
    })
    .then(function (user) {
        if(!user) throw new Errors.SecurityError('Failed Login Attempt : No user found with email '+ email);
        userDetails = user;
        return user.getOrganization();
    })
    .then(function(org){
        if(config.get('org')){
            orgId = config.get('org.id');
        }
        //if(orgId && org && org.id && orgId.indexOf(org.id) != -1){
          if(true){ //hardcode so that all orgs get new theme. Hotfix by Amin 091418
          theme = 'synsormedWhite';
        }
        if(org && !org.is_active) throw new Errors.SecurityError('Organization Deactivated');

        if(userDetails.failed_trials == 5 && (!userDetails.blocked_till || userDetails.blocked_till < moment.utc().format('YYYY-MM-DD HH:mm:ss'))){
          var currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
          var loginTime = moment(currentTime).add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
          models.User.find({
              where: {
                  email: {
                      $like: email
                  }
              }
          })
          .then(function(entry){
            entry.updateAttributes({
                blocked_till: loginTime
            })
            .then(function(resp){
              return resp;
            });
          });
        }
        if(userDetails.failed_trials == 5 && userDetails.blocked_till > moment.utc().format('YYYY-MM-DD HH:mm:ss')){
          count = 1;
          var updatedTime = moment.utc(userDetails.updated_at).format('YYYY-MM-DD HH:mm:ss');
          var current = moment.utc().format('YYYY-MM-DD HH:mm:ss');
          throw new Errors.HTTPNotFoundError("Block User");
        }
        return  models.User.verifyPassword(password, userDetails.password, email, count);
    })
    .then(function () {
        csrf.attachToSession(req.session, function (token) {
            req.session.userId = userDetails.id;
            req.session.save(function () {
                UserMarshaller.marshal(userDetails)
                .then(function (userJson) {
                    logger.trace('User '+userDetails.id+ ' is logged in');
                    res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                    res.json({ user: userJson, csrfToken: token, profileType: theme });
                });
            });
        });

        if(req.body.device && userDetails.role_id == config.seeds.roles.Provider)
        return saveDeviceInfo('user', userDetails.id, req.body.device);
    })
    .then(function(){
      count = 1;
      models.User.find({
          where: {
              email: {
                  $like: email
              }
          }
      })
      .then(function(entry){
        entry.updateAttributes({
            failed_trials: count
        });
      });
      return quickblox.createUser(userDetails.email);
    })
    .catch(function(err){
        if(count < 5){
          count++;
        }
        logger.warn("*** Failed in authenticate.js with error: " + JSON.stringify(err.message));
        return res.status(401).end(err.message);
    });
});

router.post('/otp', require('./otp'));

router.use('/superadmin', require('./superadmin'));

router.use('/encounter', require('./monitor'), require('./encounter'));

module.exports = router;
