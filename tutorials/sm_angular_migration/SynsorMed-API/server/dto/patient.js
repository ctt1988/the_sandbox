'use strict';

var Q = require('q');
module.exports.marshal = function(patientModel){
   var defer = Q.defer();

    var response = {
             id : patientModel.id,
             name : patientModel.first_name + (patientModel.last_name ? (' ' + patientModel.last_name) : ''),
             firstName : patientModel.first_name,
             lastName : patientModel.last_name,
             city : patientModel.city,
             state : patientModel.state,
             zip : patientModel.zip,
             address : patientModel.address,
             dob : patientModel.dob,
             mobileNumber : patientModel.mobile_number,
             email : patientModel.email,
             socialSecurityNumber : patientModel.social_security_number,
             medicalRecordNumber : patientModel.medical_record_number,
             gender : patientModel.gender,
             notify : patientModel.notify,
             createdAt : patientModel.created_at,
             updatedAt : patientModel.updated_at,
             deletedAt : patientModel.deleted_at
   };
   if (patientModel.Users){
      response.userId = patientModel.Users[0].id;
      defer.resolve(response);
   }
   else{
      patientModel.getUsers()
      .then(function(users){
        if(users && users[0] &&  users[0].id ){
          response.userId = users[0].id;
        }
          defer.resolve(response);
      })
      .catch(function(error){
         defer.reject(error) ;
      });
   }
   return defer.promise;
};

module.exports.unmarshal = function(rawData){
  return {
            first_name : rawData.firstName,
            last_name : rawData.lastName,
            city : rawData.city,
            state : rawData.state,
            zip : rawData.zip,
            address : rawData.address,
            dob : rawData.dob,
            mobile_number : rawData.mobileNumber,
            email : rawData.email,
            social_security_number : rawData.socialSecurityNumber,
            medical_record_number : rawData.medicalRecordNumber,
            gender : rawData.gender,
            notify : rawData.notify
        };
};
