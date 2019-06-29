'use strict';

var config = require('config');
var logger = require('logger');
var Errors = require('errors');
var models = require('models');
var UserModel = models.User;
var RoleModel = models.Role;
var router = require('express').Router();
var OrganizationModel = models.Organization;
var UniqueCode = require('../../components/unique');


router.post('/', function (req, res) {
    var role, org, pwdHash;

    if(req.current_user.role_id !== config.get('seeds.roles.SuperAdmin') && req.current_user.role_id !== config.get('seeds.roles.OrgCreator')){
       throw new Errors.SecurityError('Access Denied. Only SuperAdmin are allowed.');
    }

    if(!req.body.adminUser || !req.body.practice) throw new Errors.BadRequestError();

    return UserModel.hashPassword(req.body.adminUser.password)
    .then(function (hashPassword) {
        pwdHash = hashPassword;
        return UserModel.find({
            where: {
                email: req.body.adminUser.email
            }
        })
        .then(function (existing){
            if(existing) throw new Errors.BadRequestError('Conflict - user already registered');
        });
    })
    .then(function () {
        return UniqueCode.generateUniqueOtp();
    })
    .then(function (otp) {
        return OrganizationModel.create({
            name: req.body.practice.name,
            otp: OrganizationModel.encryptOtp(otp)
        })
        .then(function (created) {
            logger.trace('Created new Organization with id '+ created.id + ' by '+req.body.adminUser.email);
            org = created;
        });
    })
    .then(function () {
        return RoleModel.find({
            where: {
                name: 'Admin'
            }
        })
        .then(function (adminRole) {
            role = adminRole;
        });
    })
    .then(function () {
        return UserModel.create({
            first_name: req.body.adminUser.first_name,
            last_name: req.body.adminUser.last_name,
            email: req.body.adminUser.email,
            password: pwdHash,
            registration_date: new Date(),
            role_id: role.id,
            org_id: org.id
        });
    })
    .then(function(created){
        logger.trace('Created new user with id '+created.id+' and email '+req.body.adminUser.email);
        return res.json(created);
    })
    .catch(function(err){
        console.log(err);
        logger.trace(err);
        if(err instanceof Errors.BadRequestError) return res.status(422).send('User with same email already exists');
        return res.status(500).send(err);
    });
});

module.exports = router;
