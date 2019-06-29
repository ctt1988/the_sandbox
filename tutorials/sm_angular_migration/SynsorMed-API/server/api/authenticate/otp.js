var models = require('models');
var Errors = require('errors');
var Config = require('config');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var OrganizationModel = models.Organization;
var UserMarshaller = require('../../dto/user');
var UniqueCode = require('../../components/unique');
var logger = require('logger');


module.exports = function(req, res){
    var otp = OrganizationModel.encryptOtp(req.body.otp);
    var Organization;
    OrganizationModel.find({where:{otp:otp}})
    .then(function(organization){
        if(!organization){
            throw new Errors.SecurityError('Invalid OTP');
        }
        if(!organization.is_active){
            throw new Errors.SecurityError('Organization Deactivated');
        }
        Organization = organization;
        return Organization.getUsers({where:{role_id: Config.seeds.roles.Admin}});
    })
    .then(function(users){
        if(!users.length){
           throw new Errors.SecurityError('No User Found In Organization');
        }

       var user = users[0];
         csrf.attachToSession(req.session, function (token) {
           req.session.userId = user.id;
           req.session.save(function () {
             UserMarshaller.marshal(user)
             .then(function (userJson) {
                 logger.trace('Emergency Access: User logged in organization '+Organization.id+' with userId '+user.id);
                 res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                 res.json({ user: userJson, csrfToken: token });
             });
           });
        });

        if(Organization){
            UniqueCode.generateUniqueOtp().then(function(otp){
               logger.trace('Reseting new otp for organization '+ Organization.id);
               Organization.updateAttributes({otp:OrganizationModel.encryptOtp(otp)});
            });
        }
    })
    .catch(function(err){
        logger.error(err);
        return res.status(401).end(err.message);
    });
};
