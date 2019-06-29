'use strict';

var _ = require('lodash');
var logger = require('logger');
var crypto = require('crypto');
var config = require('config');
var models = require('models');
var express = require('express');
var router = express.Router();
var mailer = require('../../emails');
var EXPIRE_MINS = config.get('password_reset_code_expire'); /** config phase **/

router.post('/send/:email', function(req, res){
    var email = req.params.email;

    models.User.findOne({
        where: {
            email: email,
            role_id: config.seeds.roles.Admin
        }
    })
    .then(function(user){
        if(_.isEmpty(user)) return res.status(404).send('No Admin found with this email.');

        crypto.randomBytes(32, function(ex, buf){
            var hash = buf.toString('hex');
            models.PasswordToken.upsert({
                user_id: user.id,
                hash: hash,
                expires: parseInt(( (new Date).getTime() / 1000 + (EXPIRE_MINS * 60)))
            })
            .then(function(created){
                logger.trace('Created token in passwordToken for user '+ user.id +' with id '+ created.id);
                return mailer.sendForgotPasswordMail(email, hash);
            })
            .then(function(){
                return res.status(200).send('Password reset instructions sent to your email.');//send the reset link
            })
            .catch(function(err){
                console.error(err);
                return res.status(500).send('Unable to send email.');
            });
        });

    })
    .catch(function(err){
        console.error(err);
        return res.status(500).send('Error looking up records.');
    });

});


router.post('/reset', function(req, res){
    var data = req.body.data, user = null;
    if(_.isEmpty(data)) return res.status(400).send('No Data Supplied');

    models.User.findOne({
        where: {
            email: data.email,
            role_id: config.seeds.roles.Admin
        }
    })
    .then(function(result){
        user = result;
        if(_.isEmpty(user)) return res.status(404).send('No Admin found with this email.');

        return models.PasswordToken.findOne({ //find the token
            where: {
                user_id: user.id,
                hash: data.code
            }
        });
    })
    .then(function(tokenData){
        if(_.isEmpty(tokenData)) return res.status(400).send('Code is invalid.');
        var currentTime = parseInt((new Date).getTime() / 1000);
        if(tokenData.expires < currentTime) return res.status(400).send('Code is already expired.');
        return models.User.hashPassword(data.newPassword); //hash the password
    })
    .then(function(hashedPassword){
        return user.updateAttributes({password: hashedPassword }); //update password
    })
    .then(function(){
        logger.trace('Reset the password for user '+user.id);
        return models.PasswordToken.destroy({ //delete the token
            where: {
                user_id: user.id
            }
        });
    })
    .then(function(){
        logger.trace('Deleted token in passwordToken for user id '+ user.id);
        return res.status(200).send('Password reset successful.');
    })
    .catch(function(err){
        console.error(err);
        return res.status(500).send('Password reset failed.');
    });
});

module.exports = router;
