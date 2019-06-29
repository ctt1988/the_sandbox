var Config = require('config');
var models = require('models');
var UserModel = models.User;
var Errors = require('errors');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var UserMarshaller = require('../../dto/user');
var logger = require('logger');

var express = require('express');
var router = express.Router();

router.post('/login', function(req, res){
    if(req.current_user.role_id != Config.seeds.roles.SuperAdmin){
        return res.status(401).end('Unautharized');
    }

    var adminId = req.body.adminId;
    var superAdminId = req.current_user.id;
    UserModel.find({
                     where:{
                         id: adminId
                     }
    })
    .then(function(user){
        if(!user) {
            throw new Errors.SecurityError('Failed Login Attempt : No user found with id '+ adminId);
        }
        logger.debug('Super admin '+ superAdminId +' is logged in as ' + user.id + ' to access organization');

        csrf.attachToSession(req.session, function (token) {
          req.session.userId = user.id;
          req.session.superAdminId = superAdminId;
          req.session.save(function () {
            UserMarshaller.marshal(user)
            .then(function (userJson) {
                res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                res.json({ user: userJson, csrfToken: token, superAdmin: true });
            });
          });
       });
    })
    .catch(function(err){
        logger.error(err);
        return res.status(401).end(err.message);
    });
});


router.post('/goBack', function(req, res){

    if(!req.session.superAdminId){
        return res.status(401).end('Unautharized');
    }

    var superAdminId = req.session.superAdminId;

    UserModel.find({
                     where:{
                         id: superAdminId
                     }
    })
    .then(function(user){
        if(!user) {
            throw new Errors.SecurityError('Failed Login Attempt : No user found with id '+ superAdminId);
        }
        logger.debug('Super admin '+superAdminId+' is logged in back into his/her account');
        csrf.attachToSession(req.session, function (token) {
          req.session.userId = user.id;
          req.session.save(function () {
            UserMarshaller.marshal(user)
            .then(function (userJson) {
                res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                res.json({ user: userJson, csrfToken: token });
            });
          });
       });
    })
    .catch(function(err){
        logger.error(err);
        return res.status(401).end(err.message);
    });
});

module.exports = router;
