var router = require('express').Router();
var Errors = require('errors');
var async  = require('async');
var models = require('models');
var config = require('config');
var Q      = require('q');
var logger = require('logger');

//models
var UserModel = models.User;
var OrganizationModel = models.Organization;
var MonitorModel = models.Monitor;

var UserMarshaller = require('../../../../dto/user');

var SuperAdminCheck = function(req, res, next){
    if(req.current_user.role_id === config.get('seeds.roles.SuperAdmin')){
      logger.debug('Super Admin Access');
      next();
    } else {
      throw new Errors.SecurityError('Access Denied. Only SuperAdmin are allowed.');
    }
};

router.get('/', function(req, res){
  UserModel
  .find({
      where: {
          id: req.session.userId
      }
  })
  .then(function(resp){
    Q.all([
      OrganizationModel
      .find({
          where: {
              id: resp.org_id
          }
      }),
      MonitorModel
       .findAll({
           include : [{
                   model : UserModel,
                   where : {
                     org_id : resp.org_id
                   },
                   required: true
                 }]
       })
    ])
    .spread(function(orgData, monitorData){
       if(orgData && orgData.license_count && monitorData && monitorData.length && monitorData.length > orgData.license_count){
          res.json(true);
       }
       else{
         res.json(false);
       }
    })
  })
  .catch(function(e){
      logger.error(e);
      res.status(500).json(e.message);
  });
});

//get the global statistics
router.get('/global', SuperAdminCheck, function(req, res){
  async.parallel([
      function(callback){
        OrganizationModel.count().then(function(data){
          callback(null, data);
        }).catch(function(e){
          callback(e, null);
        });
      },
      function(callback){
        UserModel.count().then(function(data){
          callback(null, data);
        }).catch(function(e){
          callback(e, null);
        });
      },
      function(callback){
        UserModel.count({
            where:{
              role_id : config.get('seeds.roles.Admin')
            }
          }).then(function(data){
          callback(null, data);
        }).catch(function(e){
          callback(e, null);
        });
      },
      function(callback){
        UserModel.count({
            where:{
              role_id : config.get('seeds.roles.Provider')
            }
          }).then(function(data){
          callback(null, data);
        }).catch(function(e){
          callback(e, null);
        });
      },
      function(callback){
        UserModel.count({
            where:{
              role_id : config.get('seeds.roles.SuperAdmin')
            }
          }).then(function(data){
          callback(null, data);
        }).catch(function(e){
          callback(e, null);
        });
      }
    ], function(err, results){

      if(err){
        logger.error(err);
        return res.status(500).send(err.message);
      }

      var final = {};

      final.organizations = results[0] || 0;
      final.users         = results[1] || 0;
      final.admins        = results[2] || 0;
      final.providers     = results[3] || 0;
      final.superAdmins   = results[4] || 0;

      return res.status(200).json(final);
  });

});

router.get('/adminuser', SuperAdminCheck, function(req, res){
  UserModel.findAll({
    where : {
      role_id : config.get('seeds.roles.Admin')
    },
    include : [{model: OrganizationModel, where: { is_active: true} }]
  })
  .then(function(users){
      var promises = [];
      var userData = [];
      users.map(function (user) {
          var promise = UserMarshaller.marshal(user);
          promises.push(promise.then(function (userJSON) {
              userData.push(userJSON);
          }));
      });

      Q.all(promises).then(function () {
          res.json(userData);
      }).catch(function (e) {
          return res.status(500).send(e);
      });
  });

});

router.get('/OrgCreatoruser', SuperAdminCheck, function(req, res){
  UserModel.findAll({
    where : {
      role_id : config.get('seeds.roles.OrgCreator')
    },
    include : [{model: OrganizationModel }]
  })
  .then(function(users){
      var promises = [];
      var userData = [];
      users.map(function (user) {
          var promise = UserMarshaller.marshal(user);
          promises.push(promise.then(function (userJSON) {
              userData.push(userJSON);
          }));
      });

      Q.all(promises).then(function () {
          res.json(userData);
      }).catch(function (e) {
          return res.status(500).send(e);
      });
  });

});

module.exports = router;

router.use('/:oraganizationId', require('./license'));
