var router = require("express").Router({mergeParams: true});
var Models = require("models");
var MonitorModel = Models.Monitor;
var UserModel = Models.User;
var PatientModel = Models.Patient;
var MonitorDTO = require("../../../dto/monitor");
var Q = require("q");
var config = require('config');
var logger = require('logger');
var _ = require('lodash');
var moment = require('moment');

router.get('/', function (req, res) {
  var providerId = parseInt(req.params['providerId']);
  var paranoid = req.query.paranoid;
  var profileType = req.query.profileType;
  var currentPage = req.query.currentPage;
  var pageSize = req.query.pageSize;
  var offset = (currentPage - 1) * pageSize;
  var limit = parseInt(offset) + parseInt(pageSize);
  var getCount = req.query.getCount;
  var filterColor = req.query.filterColor;
  var searchFor = req.query.searchFor;

  if(paranoid == 1){
    paranoid = true;
  }
  else if(paranoid == 0){
    paranoid = false;
  }

  var where = {
    providers_id: {
      $like: '%'+providerId+'%'
    }
  };

  if(profileType){
    where = {
      provider_id: providerId
    };
  }

   var query = { where: where };
   if(searchFor && searchFor != '' && searchFor != undefined && searchFor != null){
     var seachSplit = searchFor.split(' ');
     query={
       include : [{
         model : PatientModel,
         where : {
           $or: [
             {first_name: {$like: '%'+seachSplit[0]+'%'}},
             {first_name: {$like: '%'+seachSplit[1]+'%'}},
             {last_name: {$like: '%'+seachSplit[0]+'%'}},
             {last_name: {$like: '%'+seachSplit[1]+'%'}},
             {email: {$like: '%'+searchFor+'%'}}
           ]
         }
       }]
     };
   }

 if((config.seeds.roles.Admin == req.current_user.role_id) && !providerId){
     var org_id = req.current_user.org_id;
     query = {
         include:[ { model : UserModel, where: { org_id : org_id } }],
         paranoid: paranoid
     };
     if(searchFor && searchFor != '' && searchFor != undefined && searchFor != null){
       seachSplit = searchFor.split(' ');
       query={
         include : [{
           model : PatientModel,
           where : {
             $or: [
               {first_name: {$like: '%'+seachSplit[0]+'%'}},
               {first_name: {$like: '%'+seachSplit[1]+'%'}},
               {last_name: {$like: '%'+seachSplit[0]+'%'}},
               {last_name: {$like: '%'+seachSplit[1]+'%'}},
               {email: {$like: '%'+searchFor+'%'}}
             ]
           }
         }],
        paranoid: paranoid
       };
     }
 }
 if(!getCount && (!filterColor || (filterColor && searchFor))){
  query.offset= offset;
  query.limit =parseInt(pageSize);
}
  var filtration = function(value){
    var toSendVal =[];
    var temp =[];
    var start = 0;
    for(var i = start; (!getCount)?toSendVal.length<parseInt(pageSize)&&i < value.length:i < value.length; i++) {
      if(filterColor == value[i].surveyColor){
        if(getCount || offset == 0)
          toSendVal.push(value[i]);
        else{
          if(temp.length < offset)temp.push(value[i]);
          else toSendVal.push(value[i]);
        }
      }
    }
    return toSendVal;
  };
  query.order=[ ['created_at',  'DESC'] ];
  return MonitorModel.findAll(query).then(function (results) {
    if(getCount && !filterColor) return res.json(results);
      var marshal = [];
      for(var i = 0, l = results.length; i < l; i++) {
          var promise = MonitorDTO.marshal(results[i]);
          marshal.push(promise);
      }
      return Q.all(marshal)
      .then(function (marshalled) {
        for(var i = 0; i < marshalled.length; i++) {
          _.forEach(marshalled[i].measurementName, function (measure, index) {
            if (measure == 'Patient status'){
              if (marshalled[i].lastSync[index] && marshalled[i].lastSync[index].service  == 'survey') {
                var diffDay = moment().startOf('day').diff(moment(marshalled[i].lastSync[index].lastSync).startOf('day'), 'days');
                if (diffDay > 1) {
                  marshalled[i].surveyColor='#fff';
                }
              }
            }
          });
        }
      if(filterColor && !searchFor) marshalled=filtration(marshalled);
        res.json(marshalled);
      });
  }).catch(function (reason) {
    logger.error(reason);
    res.status(500).end();
  });
});

module.exports = router;
