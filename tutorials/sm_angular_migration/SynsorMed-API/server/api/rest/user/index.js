"use strict";

var _ = require('lodash');
var Errors = require('errors');
var router = require('express').Router();
var models = require('models');
var UserModel = models.User;
var OrganizationModel = models.Organization;
var UniqueCode = require('../../../components/unique');
var RoleModel = models.Role;
var UserMarshaller = require('../../../dto/user');
var Q = require('q');
var config = require('config');
var logger = require('logger');
var patientStatusDto = require('../../../dto/patientStatus');

var adminRoleId = config.get('seeds.roles.Admin'),
sadminRoleId = config.get('seeds.roles.SuperAdmin'),
providerRoleId = config.get('seeds.roles.Provider');

router.use(function (req, res, next) {
  UserModel.find({
    where: {id: req.session.userId},
    include: [RoleModel]
  }).then(function (user) {
    if (!user) {
      res.status(404).end();
    }
    req.currentUser = user;
    next();
  }).catch(function (err) {
    logger.error(err);
    res.status(500).end();
  });
});

router.get('/statusSurvey/:userId', function(req, res){
  req.currentUser.getOrganization({
    include: [models.StatusSurvey]
  })
  .then(function(org){
    var surveys = org ? org.StatusSurveys : [];
    var result = [];
    _.forEach(surveys, function(survey){
      result.push(patientStatusDto.marshal(survey));
    });
    return res.json(result);
  })
  .catch(function(err){
    return res.status(500).end(err);
  });
});

router.get('/', function (req, res) {
  var paranoid = req.query.paranoid;
  var query = {
    where: {
      org_id: req.currentUser.org_id
    }
  };
  query.paranoid = (paranoid != 0) ? false : true;
  if(paranoid == 2) query.where.deleted_at = {
    $ne: null
  };

  UserModel.findAll(query).then(function (users) {
    var promises = [];
    var userData = [];
    users.map(function (user) {
      var promise = UserMarshaller.marshal(user);
      promises.push(promise.then(function (userJSON) {
        userData.push(userJSON);
      }));
    });

    Q.all(promises).then(function () {
      logger.trace('Getting all users for organization '+ req.currentUser.org_id);
      res.json(userData);
    }).catch(function (e) {
      return res.status(500).send(e);
    });
  }).catch(function () {
    return res.status(500).end();
  });
});

router.get('/paginate/', function (req, res) {
  var currentPage = req.query.currentPage||1;
  var pageSize = 5;
  var offset = (currentPage - 1) * pageSize;
  var paranoid = req.query.paranoid;
  var query = {
    where: {
      org_id: req.currentUser.org_id
    }
  };
  query.paranoid = (paranoid != 0) ? false : true;
  if(paranoid == 2) query.where.deleted_at = {
    $ne: null
  };

  UserModel.findAll(query).then(function (totalUsers){
    var totalUsersData = [];
    totalUsers.map(function (user) {
      totalUsersData.push(user);
    });

    query.offset= offset;
    query.limit =parseInt(pageSize);
    UserModel.findAll(query).then(function (users) {
      var promises = [];
      var userData = [];
      users.map(function (user) {
        var promise = UserMarshaller.marshal(user);
        promises.push(promise.then(function (userJSON) {
          userData.push(userJSON);
        }));
      });

      Q.all(promises).then(function () {
        logger.trace('Getting all users for organization '+ req.currentUser.org_id);
        var tosend ={
          users : userData,
          pagination:{
            currentPage: currentPage,
            total: totalUsersData.length,
            paranoid: paranoid
          }
        };
        res.json(tosend);
      }).catch(function (e) {
        return res.status(500).send(e);
      });
    });
  }).catch(function () {
    return res.status(500).end();
  });
});

router.post('/', function (req, res) {
  if(req.currentUser.role_id !== sadminRoleId && req.currentUser.role_id !== adminRoleId){
    return res.status(401).end();
  }

  var userData = UserMarshaller.unmarshal(req.body);
  //check if email already present
  UserModel
  .find({where: {'email': req.body.email}})
  .then(function(user){
    // if user with same email found
    if(user)
    {
      // return 409 -> already used email
      return res.status(409).send();
    }
    // if user with same email not found
    else
    {
      // create a new user
      RoleModel.find({
        where: {
          name: req.body.role
        }
      }).then(function (role) {
        userData.role_id = role.id;
        if(req.currentUser.org_id)
        userData.org_id = req.currentUser.org_id ;
      }).then(function () {
        return UserModel.hashPassword(userData.password);
      }).then(function (hash) {
        userData.password = hash;
        userData.registration_date = new Date();
        return UserModel.create(userData).then(function (user) {
          return UserMarshaller.marshal(user).then(function (user) {
            logger.trace('New user created with id '+user.id);
            res.json(user);
          });
        }).catch(function (err) {
          return res.status(500).send(err);
        });
      });
    }
  });
});


// get otp code for the user
router.get('/otp/:userId', function(req, res){
  var userId = req.params.userId;

  if(req.currentUser.id != userId){
    return res.status(401).end();
  }

  UserModel.findById(userId)
  .then(function(user){
    if(!user) throw new Errors.BadRequestError('No User Found With UserID '+userId);
    return user.getOrganization();
  })
  .then(function(organization){
    if(!organization) throw new Errors.BadRequestError('No Organization Found For UserID '+userId);
    if(!organization.otp){
      UniqueCode.generateUniqueOtp().then(function(otp){
        res.send(otp);
        logger.trace('Resetting otp for organization '+organization.id);
        organization.updateAttributes({otp:OrganizationModel.encryptOtp(otp)});
      });
    }
    else{
      return res.send(OrganizationModel.decryptOtp(organization.otp));
    }
  })
  .catch(function(err){
    logger.error(err);
    return res.status(401).end();
  });
});


var userRouter = require('express').Router({mergeParams: true});

router.put('/:userId', function(req, res){

  UserModel.findOne({
    where:{
      id: req.params.userId
    },
    paranoid: false
  })
  .then(function (user) {
    if(req.body.reset){
      user.restore()
      .then(function(){
        return res.status(200).send(true);
      })
    }
    else{
      var userData = UserMarshaller.unmarshal(req.body);
      delete userData._id;
      models.sequelize.Promise.resolve().then(function () {
        if(userData.role) {
          return RoleModel.find({where: {name: userData.role}}).then(function (role) {
            userData.role_id = role.id;
          });
        }
      }).then(function () {
        if(userData.password) {
          return UserModel.hashPassword(userData.password).then(function (hash) {
            userData.password = hash;
          });
        }
      }).then(function () {
        return user.update(userData).then(function (user) {
          logger.trace('Updating user '+user.id);
          UserMarshaller.marshal(user).then(function (user) {
            res.json(user);
          });
        });
      }).catch(function (err) {
        logger.error(err);
        return res.status(500).send(err);
      });
    }
  })
  .then(function(){
    return res.status(200).send(true);
  })
});

router.delete('/:userId', function (req, res) {
  var userId = req.params.userId;
  var userInstance;
  var paranoid = true;
  var force = false;
  if(req.query.permanentDelete){
    force = true;
    paranoid = false;
  }
  if(req.currentUser.role_id !== adminRoleId && (req.currentUser.role_id !== sadminRoleId) ){
    return res.status(401).end();
  }

  UserModel.find({
    where: {id: userId},
    paranoid: paranoid
  })
  .then(function(user){
    if(!user){
      throw new Errors.HTTPNotFoundError('No patient found for patient id ' + patientId);
    }
    userInstance = user;
    return userInstance;
  })
  .then(function(){
    return userInstance.destroy({ force: force });
  })
  .then(function(){
    logger.trace('User deleted with id '+userId);
    return res.json({success: true});
  })
  .catch(function(error){
    logger.error(error);
    logger.trace(error.message);
    res.status(500).send(JSON.stringify(error));
  });

  // req.user.destroy({force: force}).then(function () {
  //     logger.trace('User '+req.user.id+' Deleted');
  //     return res.send();
  // }).catch(function (err) {
  //   return res.status(500).send(err);
  // });

});

userRouter.put('/', function (req, res) {

  if(req.currentUser.role_id !== adminRoleId && (req.currentUser.id !== req.user.id && req.currentUser.role_id !== providerRoleId)) {
    return res.status(401).end();
  }

  UserModel
  .find({where: {'email': req.body.email}})
  .then(function(user){
    // if user with same email found
    var userData = UserMarshaller.unmarshal(req.body);

    if(user && (user.id !== req.user.id))
    {
      //already used email
      return res.status(409).send();
    }

    delete req.body.org_id;
    if(req.currentUser.role_id !== adminRoleId) {
      delete userData.role;
      delete userData.email;
    }

    var userData = userData;
    delete userData._id;

    models.sequelize.Promise.resolve().then(function () {
      if(userData.role) {
        return RoleModel.find({where: {name: userData.role}}).then(function (role) {
          userData.role_id = role.id;
        });
      }
    }).then(function () {
      if(userData.password) {
        return UserModel.hashPassword(userData.password).then(function (hash) {
          userData.password = hash;
        });
      }
    }).then(function () {
      return req.user.update(userData).then(function (user) {
        logger.trace('Updating user '+user.id);
        return UserMarshaller.marshal(user).then(function (user) {
          res.json(user);
        });
      });
    }).catch(function (err) {
      logger.error(err);
      return res.status(500).send(err);
    });
  })
  .catch(function(e){
    logger.error(e);
    return res.status(500).send(e);
  });
});

router.use('/:userId', function (req, res, next) {
  //do not correct != to !== , req.param.userId is a string
  if (req.currentUser.id != req.params.userId && req.currentUser.role_id !== adminRoleId) {
    logger.warn('User is not an admin');
    return res.status(401).end();
  }

  UserModel.findById(req.params.userId).then(function (user) {
    if (!user) {
      return res.status(404).end();
    }

    if(req.currentUser.org_id !== user.org_id) {
      logger.warn('Practices don\'t match up');
      return res.status(401).end();
    }
    req.user = user;
    next();
  }).catch(function (err) {
    return res.status(500).send(err);
  });
}, userRouter);


module.exports = router;
